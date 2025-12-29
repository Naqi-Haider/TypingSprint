import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import User from './models/User.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// In-memory lobby storage
const lobbies = new Map();

// Tier Mode Constants
const TIER_SCHEDULE = ['easy', 'easy', 'medium', 'medium', 'hard', 'hard', 'hard', 'hard'];
const TOTAL_TIER_ROUNDS = 8;
const INTERMISSION_DURATION = 10000; // 10 seconds in ms

// Session tokens for validated lobby access (ephemeral - not stored in DB)
// Map<lobbyId, Map<token, { expiresAt }>>
// Token-based validation allows tokens to work across socket reconnections
const lobbySessionTokens = new Map();

// Helper: Generate ephemeral session token
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper: Validate session token (token-based, not socket-id based)
const validateSessionToken = (roomId, token) => {
  if (!token) return false;

  const lobbySessions = lobbySessionTokens.get(roomId);
  if (!lobbySessions) return false;

  const session = lobbySessions.get(token);
  if (!session) return false;

  // Check expiry (tokens valid for 1 hour)
  if (Date.now() > session.expiresAt) {
    lobbySessions.delete(token);
    return false;
  }

  return true;
};

// Helper: Create session for validated user
const createLobbySession = (roomId) => {
  if (!lobbySessionTokens.has(roomId)) {
    lobbySessionTokens.set(roomId, new Map());
  }

  const token = generateSessionToken();
  const session = {
    expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour expiry
  };

  lobbySessionTokens.get(roomId).set(token, session);
  return token;
};

// Helper: Clean up lobby sessions when lobby is deleted
const cleanupLobbySessions = (roomId) => {
  lobbySessionTokens.delete(roomId);
};

// Paragraph banks for different modes (extended for more variety)
const PARAGRAPHS = {
  random: [
    "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!",
    "Technology continues to evolve at an incredible pace. New innovations emerge almost daily. These advancements shape how we live and work.",
    "Music has the power to touch our souls. Different melodies evoke various emotions and memories. It connects people across cultures and generations.",
    "Learning never stops throughout our entire lives. Each experience teaches us something valuable. Curiosity drives us to discover and grow.",
    "The internet has revolutionized how we access information. Within seconds, we can find answers to almost any question.",
    "Dreams motivate us to reach for greatness. They give us direction and purpose. Pursuing our aspirations makes life meaningful and exciting.",
    "Friendship is one of life's greatest treasures. True friends support us through difficult times and celebrate our successes with genuine joy.",
    "Nature provides us with countless wonders to explore. From towering mountains to vast oceans, the natural world inspires awe and respect.",
    "Food brings people together in wonderful ways. Sharing meals creates bonds and memories that last a lifetime across generations.",
    "Exercise is essential for maintaining good health. Regular physical activity strengthens our bodies and minds significantly.",
    "Reading books expands our knowledge and imagination. Stories take us to different worlds and times we could never otherwise experience.",
    "The sun rises in the east and sets in the west. Every morning brings new opportunities and challenges to embrace with enthusiasm.",
    "Creativity allows us to express ourselves in unique ways. Art, music, and writing help us communicate our deepest thoughts.",
    "Travel broadens our perspectives and understanding of the world. Experiencing different cultures challenges our assumptions.",
    "Communication skills are vital in personal and professional settings. Clear expression prevents misunderstandings.",
    "Climate change affects every corner of our planet. Rising temperatures alter weather patterns and ecosystems dramatically.",
    "Artificial intelligence is transforming numerous industries rapidly. Machines can now perform tasks once thought impossible.",
    "Education opens doors to countless opportunities in life. Knowledge empowers individuals to make informed decisions daily.",
    "Mental health deserves the same attention as physical health. Stress and anxiety affect millions of people worldwide today.",
    "Innovation drives progress in science and technology fields. Creative problem-solving leads to breakthrough discoveries."
  ],
  tier: {
    easy: [
      "The sun rises in the east and sets in the west. Every morning brings new opportunities.",
      "Reading books expands our knowledge. Stories take us to different worlds.",
      "Exercise is essential for good health. Regular activity strengthens our bodies."
    ],
    medium: [
      "Climate change affects every corner of our planet. Rising temperatures alter weather patterns and ecosystems. Scientists urge immediate action to reduce carbon emissions.",
      "Artificial intelligence is transforming numerous industries rapidly. Machines can now perform tasks once thought impossible. This technology offers tremendous benefits but also raises ethical questions.",
      "Education opens doors to countless opportunities in life. Knowledge empowers individuals to make informed decisions. Lifelong learning helps us adapt to changing circumstances."
    ],
    hard: [
      "The exploration of space represents humanity's boldest endeavor to understand our place in the universe. Astronauts risk their lives to expand the boundaries of human knowledge and capability. Advanced telescopes reveal distant galaxies and mysterious cosmic phenomena that challenge our understanding. International cooperation in space programs demonstrates what we can achieve when nations work together.",
      "Biotechnology and genetic engineering offer revolutionary possibilities for medicine and agriculture worldwide. Scientists can now edit genes with unprecedented precision using advanced molecular tools. These capabilities raise profound ethical questions about the limits of human intervention in nature. Potential benefits include curing genetic diseases and feeding growing populations more efficiently.",
      "Ocean ecosystems face unprecedented threats from pollution, overfishing, and climate change impacts. Coral reefs, often called rainforests of the sea, are dying at alarming rates. Plastic waste accumulates in massive gyres that harm marine life throughout food chains. Rising ocean temperatures and acidification disrupt delicate ecological balances built over millennia."
    ]
  }
};

// Track last used paragraph per lobby to avoid repetition
const lobbyLastParagraphs = new Map();

// Helper function to get paragraph based on mode (avoiding last used)
const getParagraphForMode = (mode, currentTier = 'easy', roomId = null) => {
  const lastParagraph = roomId ? lobbyLastParagraphs.get(roomId) : null;

  if (mode === 'tier') {
    const tierParagraphs = PARAGRAPHS.tier[currentTier] || PARAGRAPHS.tier.easy;
    let available = tierParagraphs.filter(p => p !== lastParagraph);
    if (available.length === 0) available = tierParagraphs;
    const selected = available[Math.floor(Math.random() * available.length)];
    if (roomId) lobbyLastParagraphs.set(roomId, selected);
    return selected;
  }

  // Random mode - single paragraph (avoid last used)
  let available = PARAGRAPHS.random.filter(p => p !== lastParagraph);
  if (available.length === 0) available = PARAGRAPHS.random;
  const selected = available[Math.floor(Math.random() * available.length)];
  if (roomId) lobbyLastParagraphs.set(roomId, selected);
  return selected;
};

// Helper function to get tier paragraphs pool for progressive difficulty
// Returns paragraph arrays indexed by round for the 8-round tier mode
const getTierParagraphs = () => {
  const shuffleArray = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Get shuffled pools - 2 easy, 2 medium, 4 hard needed for TIER_SCHEDULE
  // Expand arrays if needed (repeat with shuffle if not enough paragraphs)
  const expandArray = (arr, needed) => {
    const result = [];
    while (result.length < needed) {
      const remaining = needed - result.length;
      const shuffled = shuffleArray(arr);
      result.push(...shuffled.slice(0, remaining));
    }
    return result;
  };

  const easy = expandArray(PARAGRAPHS.tier.easy, 2);
  const medium = expandArray(PARAGRAPHS.tier.medium, 2);
  const hard = expandArray(PARAGRAPHS.tier.hard, 4);

  return { easy, medium, hard };
};

// Helper to get paragraph for a specific tier round
const getParagraphForRound = (tierState, roundIndex) => {
  const difficulty = TIER_SCHEDULE[roundIndex];
  const pools = tierState.paragraphPools;

  // Track which index within each difficulty pool we're on
  // Rounds 0,1 = easy[0,1], Rounds 2,3 = medium[0,1], Rounds 4-7 = hard[0-3]
  if (difficulty === 'easy') {
    return pools.easy[roundIndex]; // 0 or 1
  } else if (difficulty === 'medium') {
    return pools.medium[roundIndex - 2]; // 0 or 1
  } else {
    return pools.hard[roundIndex - 4]; // 0, 1, 2, or 3
  }
};

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Search lobbies by name (case-sensitive)
  socket.on('search_lobbies', ({ query }) => {
    try {
      const matchingLobbies = Array.from(lobbies.values())
        .filter(lobby => lobby.name.includes(query))
        .map(lobby => ({
          id: lobby.id,
          name: lobby.name,
          players: lobby.players.length,
          maxPlayers: lobby.maxPlayers,
          mode: lobby.mode,
          hasPassword: !!lobby.passwordHash // Use hash presence
        }));

      socket.emit('lobbies_found', { lobbies: matchingLobbies });
    } catch (error) {
      console.error('Search error:', error);
      socket.emit('search_error', { message: 'Failed to search lobbies' });
    }
  });

  // Check lobby status (before joining - for password check)
  socket.on('check_lobby_status', ({ roomId }) => {
    try {
      const lobby = lobbies.get(roomId);

      if (!lobby) {
        return socket.emit('lobby_status', { roomId, exists: false });
      }

      const isFull = lobby.players.length >= lobby.maxPlayers;

      socket.emit('lobby_status', {
        roomId,
        exists: true,
        protected: !!lobby.passwordHash, // Use hash presence, not raw password
        full: isFull
      });
    } catch (error) {
      console.error('Check lobby status error:', error);
      socket.emit('lobby_error', { message: 'Failed to check lobby status' });
    }
  });

  // Validate lobby password - uses bcrypt comparison, returns session token
  socket.on('validate_lobby_password', async ({ roomId, password }) => {
    try {
      const lobby = lobbies.get(roomId);

      if (!lobby) {
        return socket.emit('password_validated', { success: false, roomId, error: 'Lobby not found' });
      }

      // If no password set, always succeed
      if (!lobby.passwordHash) {
        const sessionToken = createLobbySession(roomId);
        return socket.emit('password_validated', { success: true, roomId, sessionToken });
      }

      // Compare password with stored hash using bcrypt
      const isCorrect = await bcrypt.compare(password, lobby.passwordHash);

      if (isCorrect) {
        // Create ephemeral session token for this socket
        const sessionToken = createLobbySession(roomId);
        socket.emit('password_validated', { success: true, roomId, sessionToken });
      } else {
        socket.emit('password_validated', { success: false, roomId, error: 'Incorrect password' });
      }
    } catch (error) {
      console.error('Validate password error:', error);
      socket.emit('password_validated', { success: false, roomId, error: 'Validation failed' });
    }
  });

  // Create lobby - hash password with bcrypt, never store raw password
  socket.on('create_lobby', async ({ roomId, lobbyName, mode, maxPlayers, password, hostUser }) => {
    try {
      // Hash password if provided (never store raw password)
      let passwordHash = null;
      if (password && password.trim()) {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(password, salt);
      }

      const lobby = {
        id: roomId,
        name: lobbyName,
        hostName: hostUser?.name || 'Host',
        hostId: null,
        mode,
        maxPlayers,
        passwordHash, // Store hash, not raw password
        hasPassword: !!passwordHash, // Boolean flag for clients
        players: [],
        hostUserData: hostUser,
        createdAt: Date.now()
      };

      lobbies.set(roomId, lobby);

      // Create session token for host (they don't need password validation)
      const sessionToken = createLobbySession(roomId);

      console.log(`Lobby created: ${lobbyName} (${roomId}) - Host: ${hostUser?.name || 'Host'}, Mode: ${mode}, Max: ${maxPlayers}, Protected: ${!!passwordHash}`);
      socket.emit('lobby_created', { roomId, lobby: { ...lobby, passwordHash: undefined }, sessionToken });
    } catch (error) {
      console.error('Create lobby error:', error);
      socket.emit('lobby_error', { message: 'Failed to create lobby' });
    }
  });

  // Join lobby (from Join Modal - requires password check)
  socket.on('join_lobby', async ({ roomId, username, password }) => {
    try {
      const lobby = lobbies.get(roomId);

      if (!lobby) {
        return socket.emit('lobby_error', { message: 'Lobby not found' });
      }

      // Check password using bcrypt if lobby is protected
      if (lobby.passwordHash) {
        const isCorrect = await bcrypt.compare(password || '', lobby.passwordHash);
        if (!isCorrect) {
          return socket.emit('lobby_error', { message: 'Incorrect password' });
        }
      }

      if (lobby.players.length >= lobby.maxPlayers) {
        return socket.emit('lobby_error', { message: 'Lobby is full' });
      }

      // Password is correct or no password - create session token
      const sessionToken = createLobbySession(roomId);
      socket.emit('lobby_join_success', { roomId, sessionToken });
    } catch (error) {
      console.error('Join lobby error:', error);
      socket.emit('lobby_error', { message: 'Failed to join lobby' });
    }
  });

  // Validate password for protected lobbies (legacy handler)
  socket.on('validate_password', async ({ roomId, password }) => {
    try {
      const lobby = lobbies.get(roomId);
      if (lobby) {
        if (!lobby.passwordHash) {
          // No password set
          const sessionToken = createLobbySession(roomId);
          socket.emit('password_accepted', { sessionToken });
        } else {
          const isCorrect = await bcrypt.compare(password || '', lobby.passwordHash);
          if (isCorrect) {
            const sessionToken = createLobbySession(roomId);
            socket.emit('password_accepted', { sessionToken });
          } else {
            socket.emit('password_incorrect');
          }
        }
      } else {
        socket.emit('password_incorrect');
      }
    } catch (error) {
      console.error('Validate password error:', error);
      socket.emit('password_incorrect');
    }
  });

  // Join room (from LobbyRoom component) - validates session token or password
  socket.on('join_room', async ({ roomId, user, password, sessionToken }) => {
    try {
      const lobby = lobbies.get(roomId);

      if (!lobby) {
        return socket.emit('lobby_error', { message: 'Lobby not found' });
      }

      // Check if user is already in the lobby
      const existingPlayer = lobby.players.find(p => p.id === socket.id);

      if (!existingPlayer) {
        // Check if this is the host joining (by matching name)
        const isHostJoining = lobby.hostUserData && user.name === lobby.hostUserData.name && lobby.hostId === null;

        // For non-host players joining protected lobbies
        if (!isHostJoining && lobby.passwordHash) {
          // Check session token first (bypass password if valid)
          const isSessionValid = validateSessionToken(roomId, sessionToken);

          if (!isSessionValid) {
            // No valid session - require password
            if (!password) {
              return socket.emit('password_required');
            }

            const isCorrect = await bcrypt.compare(password, lobby.passwordHash);
            if (!isCorrect) {
              return socket.emit('password_required');
            }
          }
        }

        if (!isHostJoining && lobby.players.length >= lobby.maxPlayers) {
          return socket.emit('lobby_full');
        }

        const newPlayer = {
          id: socket.id,
          name: user.name,
          theme: user.theme || 'retro',
          avatarUrl: user.avatarUrl || null,
          bannerUrl: user.bannerUrl || null,
          avatarPosition: user.avatarPosition || { x: 50, y: 50 },
          bannerPosition: user.bannerPosition || { x: 50, y: 50 },
          mongoId: user.mongoId || null,
          isHost: isHostJoining,
          isReady: isHostJoining,
          inGame: false, // Explicitly initialize to prevent undefined
          status: 'ready', // ready, playing, spectating, eliminated
          stats: user.stats || { wpm: 0, precision: 95, matchesWon: 0 }
        };

        // If host is joining, update hostId and create their session
        if (isHostJoining) {
          lobby.hostId = socket.id;
          createLobbySession(roomId);
        }

        lobby.players.push(newPlayer);

        console.log(`${user.name} joined lobby: ${lobby.name}${isHostJoining ? ' (HOST)' : ''}`);
        socket.to(roomId).emit('player_joined', { player: newPlayer });
      }

      // Join socket room and send current state (whether new or existing player)
      socket.join(roomId);

      // Debug: Log player states being sent
      console.log('Sending current_room_state - Player states:', lobby.players.map(p => ({
        name: p.name,
        inGame: p.inGame,
        isReady: p.isReady
      })));

      socket.emit('current_room_state', {
        hostId: lobby.hostId,
        players: lobby.players,
        mode: lobby.mode,
        maxPlayers: lobby.maxPlayers,
        hasPassword: !!lobby.passwordHash
      });
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('lobby_error', { message: 'Failed to join room' });
    }
  });

  // Update settings (Host only)
  socket.on('update_settings', ({ roomId, mode }) => {
    try {
      const lobby = lobbies.get(roomId);

      if (!lobby) {
        return socket.emit('lobby_error', { message: 'Lobby not found' });
      }

      if (lobby.hostId !== socket.id) {
        return socket.emit('lobby_error', { message: 'Only host can change settings' });
      }

      lobby.mode = mode;
      io.to(roomId).emit('settings_updated', { mode });

      console.log(`Settings updated in ${lobby.name}: mode=${mode}`);
    } catch (error) {
      console.error('Update settings error:', error);
      socket.emit('lobby_error', { message: 'Failed to update settings' });
    }
  });

  // Player ready toggle
  socket.on('player_ready', ({ roomId, isReady }) => {
    const lobby = lobbies.get(roomId);
    if (lobby) {
      const player = lobby.players.find(p => p.id === socket.id);
      if (player) {
        player.isReady = isReady;
        io.to(roomId).emit('player_ready_changed', {
          playerId: socket.id,
          isReady,
          players: lobby.players
        });

        // Check if all players are ready AND lobby is FULL
        const allReady = lobby.players.every(p => p.isReady);
        const isFull = lobby.players.length >= lobby.maxPlayers;
        if (allReady && isFull) {
          // Mark game as in progress
          lobby.gameInProgress = true;

          // Update all players' status to 'playing'
          lobby.players.forEach(p => {
            p.status = 'playing';
          });

          io.to(roomId).emit('all_players_ready');

          // Get paragraph(s) based on game mode
          let gameData;
          if (lobby.mode === 'tier') {
            // Tier mode: Initialize tier tracking and send all tier paragraphs
            const tierParagraphs = getTierParagraphs();

            // Initialize tier mode tracking on lobby
            lobby.tierState = {
              currentRound: 0,
              roundResults: [],
              cumulativeStats: new Map(), // playerId -> { totalWpm, totalPrecision, totalPenaltyTime, completedRounds, bestWpm, chances, isEliminated }
              finishOrder: [],
              roundTimer: null,
              roundTimeLimit: 60, // Default time limit, will be updated per round
              paragraphPools: tierParagraphs,
              readyForNextRound: new Set(), // Players who clicked ready
              activePlayers: new Set(lobby.players.map(p => p.id)), // Players still in game
              failedThisRound: new Set() // Players who failed current round
            };

            // Initialize cumulative stats for all players
            lobby.players.forEach(p => {
              p.inGame = true; // Mark player as in game
              lobby.tierState.cumulativeStats.set(p.id, {
                playerName: p.name,
                totalWpm: 0,
                totalPrecision: 0,
                totalPenaltyTime: 0,
                completedRounds: 0,
                bestWpm: 0,
                chances: 0,
                isEliminated: false
              });
              // Mark player as in game
              p.inGame = true;
            });

            gameData = {
              mode: 'tier',
              paragraphs: tierParagraphs, // { easy, medium, hard } - pools
              paragraphText: tierParagraphs.easy[0], // Start with first easy paragraph
              roundIndex: 0,
              difficulty: TIER_SCHEDULE[0]
            };
          } else {
            // Random mode: Single paragraph
            const paragraphText = getParagraphForMode('random');
            // Mark all players as in game
            lobby.players.forEach(p => {
              p.inGame = true;
            });
            gameData = {
              mode: 'random',
              paragraphText
            };
          }

          io.to(roomId).emit('game_starting', gameData);

          // Broadcast status update to lobby so returning players see "In Game" status
          lobby.players.forEach(p => {
            io.to(roomId).emit('player_status_update', {
              playerId: p.id,
              playerName: p.name,
              inGame: true,
              isReady: p.isReady
            });
          });

          console.log(`Game starting in lobby ${lobby.name} - Mode: ${lobby.mode}`);
        }
      }
    }
  });

  // Delete lobby (Host only)
  socket.on('delete_lobby', ({ roomId }) => {
    const lobby = lobbies.get(roomId);
    if (lobby && lobby.hostId === socket.id) {
      lobbies.delete(roomId);
      cleanupLobbySessions(roomId); // Clean up session tokens
      io.to(roomId).emit('lobby_closed', { reason: 'Host deleted the lobby' });
      console.log(`Lobby ${lobby.name} deleted by host`);
    }
  });

  // Kick player from lobby (Host only)
  socket.on('kick_player', ({ roomId, targetPlayerId }) => {
    try {
      const lobby = lobbies.get(roomId);

      if (!lobby) {
        return socket.emit('lobby_error', { message: 'Lobby not found' });
      }

      // Only host can kick players
      if (lobby.hostId !== socket.id) {
        return socket.emit('lobby_error', { message: 'Only host can kick players' });
      }

      // Can't kick yourself
      if (targetPlayerId === socket.id) {
        return socket.emit('lobby_error', { message: 'Cannot kick yourself' });
      }

      // Find the target player
      const targetPlayer = lobby.players.find(p => p.id === targetPlayerId);
      if (!targetPlayer) {
        return socket.emit('lobby_error', { message: 'Player not found' });
      }

      // Remove player from lobby
      lobby.players = lobby.players.filter(p => p.id !== targetPlayerId);

      // Emit 'kicked' event to the target player
      io.to(targetPlayerId).emit('kicked', { reason: 'Kicked by host' });

      // Notify remaining players that player was removed
      socket.to(roomId).emit('player_left', { playerId: targetPlayerId });

      console.log(`Player ${targetPlayer.name} was kicked from lobby ${lobby.name} by host`);
    } catch (error) {
      console.error('Kick player error:', error);
      socket.emit('lobby_error', { message: 'Failed to kick player' });
    }
  });

  // Typing progress (broadcast to all players in room)
  socket.on('typing_progress', ({ roomId, progress, wpm, accuracy, completed, completionTime, typedText }) => {
    const lobby = lobbies.get(roomId);
    if (lobby) {
      // Broadcast progress to all other players in the room (including typedText for spectators)
      socket.to(roomId).emit('player_progress', {
        playerId: socket.id,
        progress,
        wpm,
        accuracy,
        completed,
        completionTime,
        typedText // For spectator mode
      });

      // If player completed, broadcast completion event to everyone
      if (completed) {
        const player = lobby.players.find(p => p.id === socket.id);

        // Track completion for random mode
        if (lobby.mode === 'random' || !lobby.mode) {
          // Initialize completions tracking if not exists
          if (!lobby.completedPlayers) {
            lobby.completedPlayers = new Map();
          }

          // Only add if not already completed
          if (!lobby.completedPlayers.has(socket.id)) {
            lobby.completedPlayers.set(socket.id, {
              playerId: socket.id,
              playerName: player?.name || 'Unknown',
              completionTime,
              wpm,
              accuracy,
              position: lobby.completedPlayers.size + 1
            });
          }
        }

        io.to(roomId).emit('player_completed', {
          playerId: socket.id,
          playerName: player?.name || 'Unknown',
          completionTime,
          wpm,
          accuracy
        });

        // Check if all players finished (random mode)
        if ((lobby.mode === 'random' || !lobby.mode) &&
          lobby.completedPlayers &&
          lobby.completedPlayers.size >= lobby.players.length) {
          // All players finished - emit game_over with final standings
          const standings = Array.from(lobby.completedPlayers.values())
            .sort((a, b) => a.position - b.position);

          io.to(roomId).emit('game_over', {
            standings,
            winner: standings[0]
          });

          console.log(`Game over in lobby ${lobby.name}: Winner is ${standings[0]?.playerName}`);

          // Track win for the winner (async, fire-and-forget)
          const winner = standings[0];
          if (winner) {
            const winnerPlayer = lobby.players.find(p => p.id === winner.playerId);
            if (winnerPlayer && winnerPlayer.mongoId) {
              User.findByIdAndUpdate(
                winnerPlayer.mongoId,
                { $inc: { 'stats.matchesWon': 1 } }
              ).catch(err => console.error('Failed to update winner stats:', err));
            }
          }

          // Reset for next game
          lobby.completedPlayers = new Map();
          lobby.gameInProgress = false;
        }
      }
    }
  });

  // Tier Mode: Round complete handler
  socket.on('round_complete', ({ roomId, roundIndex, wpm, accuracy, completionTime }) => {
    const lobby = lobbies.get(roomId);
    if (!lobby || lobby.mode !== 'tier' || !lobby.tierState) return;

    const tierState = lobby.tierState;
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;

    // Check if player already completed this round
    const alreadyFinished = tierState.finishOrder.some(f => f.playerId === socket.id);
    if (alreadyFinished) return;

    // Rename accuracy to precision for the payload
    const precision = accuracy;

    // Calculate penalty time for hard rounds
    let penaltyTimeUsed = 0;
    const difficulty = TIER_SCHEDULE[roundIndex];
    if (difficulty === 'hard' && completionTime > lobby.tierState.roundTimeLimit) {
      penaltyTimeUsed = completionTime - lobby.tierState.roundTimeLimit;
    }

    // Add to finish order
    const position = tierState.finishOrder.length + 1;
    tierState.finishOrder.push({
      playerId: socket.id,
      playerName: player.name,
      position,
      wpm,
      precision,
      penaltyTimeUsed,
      completionTime
    });

    // Update cumulative stats
    const stats = tierState.cumulativeStats.get(socket.id);
    if (stats) {
      stats.totalWpm += wpm;
      stats.totalPrecision += precision;
      stats.totalPenaltyTime += penaltyTimeUsed;
      stats.completedRounds += 1;
      stats.bestWpm = Math.max(stats.bestWpm, wpm);
    }

    // Broadcast player completion to room
    io.to(roomId).emit('tier_player_finished', {
      playerId: socket.id,
      playerName: player.name,
      position,
      wpm,
      precision,
      penaltyTimeUsed,
      completionTime,
      roundIndex
    });

    console.log(`Tier round ${roundIndex + 1}: ${player.name} finished in position ${position}`);

    // Check if all players have finished this round
    // Check if all ACTIVE players have finished or failed
    const activePlayerCount = tierState.activePlayers.size;
    const finishedCount = tierState.finishOrder.length;
    const failedCount = tierState.failedThisRound.size;

    if (finishedCount + failedCount >= activePlayerCount) {
      handleRoundEnd(roomId, lobby);
    }
  });

  // Tier Mode: Player failed to complete in time
  socket.on('tier_player_failed', ({ roomId, roundIndex }) => {
    const lobby = lobbies.get(roomId);
    if (!lobby || lobby.mode !== 'tier' || !lobby.tierState) return;

    const tierState = lobby.tierState;
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;

    // Check if already processed
    if (tierState.failedThisRound.has(socket.id)) return;

    tierState.failedThisRound.add(socket.id);

    // Elimination Logic:
    // In Easy/Medium rounds, fail = immediate elimination.
    // In Hard rounds, fail = elimination if they didn't finish even in penalty time.
    const difficulty = TIER_SCHEDULE[roundIndex];
    const isHardMode = difficulty === 'hard';

    // Track failure
    tierState.failedThisRound.add(socket.id);

    const stats = tierState.cumulativeStats.get(socket.id);
    if (stats && !stats.isEliminated) {
      // Eliminate player if not hard mode OR if they actually reached the hard limit (-20)
      // The client only emits tier_player_failed when they truly run out of all time (including penalty if applicable)
      stats.isEliminated = true;
      tierState.activePlayers.delete(socket.id);

      io.to(roomId).emit('player_eliminated', {
        playerId: socket.id,
        playerName: player.name,
        roundIndex,
        difficulty
      });

      console.log(`${player.name} eliminated from tier game in ${lobby.name} during ${difficulty} round`);
    }

    // Check if round should end
    const activePlayerCount = tierState.activePlayers.size;
    const finishedCount = tierState.finishOrder.length;
    const failedCount = tierState.failedThisRound.size;

    // Check if ALL players failed (no one finished)
    if (finishedCount === 0 && failedCount >= lobby.players.length) {
      // All players failed - determine winner by best stats
      const leaderboard = Array.from(tierState.cumulativeStats.entries())
        .map(([playerId, stats]) => ({
          playerId,
          playerName: stats.playerName,
          completedRounds: stats.completedRounds,
          avgWpm: stats.completedRounds > 0 ? Math.round(stats.totalWpm / stats.completedRounds) : 0,
          avgPrecision: stats.completedRounds > 0 ? Math.round(stats.totalPrecision / stats.completedRounds) : 0,
          totalPenaltyTime: stats.totalPenaltyTime,
          bestWpm: stats.bestWpm
        }))
        .sort((a, b) => {
          // Sort by: most rounds completed, then best avgWpm
          if (a.completedRounds !== b.completedRounds) {
            return b.completedRounds - a.completedRounds;
          }
          return b.avgWpm - a.avgWpm;
        });

      const winner = leaderboard[0];

      io.to(roomId).emit('tier_game_complete', {
        leaderboard,
        winner,
        totalRounds: currentRound + 1,
        reason: 'all_failed'
      });

      // Reset game state
      lobby.gameInProgress = false;
      delete lobby.tierState;

      console.log(`Tier game ended in ${lobby.name} - All players failed. Winner: ${winner?.playerName}`);
      return;
    }

    if (finishedCount + failedCount >= activePlayerCount || activePlayerCount <= 1) {
      handleRoundEnd(roomId, lobby);
    }
  });

  // Tier Mode: Player is ready for next round
  socket.on('tier_ready_next_round', ({ roomId }) => {
    const lobby = lobbies.get(roomId);
    if (!lobby || lobby.mode !== 'tier' || !lobby.tierState) return;

    const tierState = lobby.tierState;
    tierState.readyForNextRound.add(socket.id);

    // Broadcast ready status
    io.to(roomId).emit('player_ready_next_round', {
      playerId: socket.id,
      readyCount: tierState.readyForNextRound.size,
      totalActive: tierState.activePlayers.size
    });

    // Check if all active players are ready
    const allActiveReady = Array.from(tierState.activePlayers).every(
      playerId => tierState.readyForNextRound.has(playerId)
    );

    if (allActiveReady && tierState.activePlayers.size > 0) {
      // Clear any existing timer and advance immediately
      if (tierState.roundTimer) {
        clearTimeout(tierState.roundTimer);
        tierState.roundTimer = null;
      }
      advanceToNextRound(roomId, lobby);
    }
  });

  // Tier Mode: Player quits game (uses remaining chances)
  socket.on('tier_player_quit', ({ roomId }) => {
    const lobby = lobbies.get(roomId);
    if (!lobby || lobby.mode !== 'tier' || !lobby.tierState) return;

    const tierState = lobby.tierState;
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;

    const stats = tierState.cumulativeStats.get(socket.id);
    if (stats && !stats.isEliminated) {
      stats.isEliminated = true;
      stats.chances = 0;
      tierState.activePlayers.delete(socket.id);

      io.to(roomId).emit('player_eliminated', {
        playerId: socket.id,
        playerName: player.name,
        reason: 'quit'
      });

      console.log(`${player.name} quit tier game in ${lobby.name}`);

      // Check if only one player remains or game should end
      if (tierState.activePlayers.size <= 1) {
        handleRoundEnd(roomId, lobby);
      }
    }
  });

  // Helper function to handle round end and advance
  const handleRoundEnd = (roomId, lobby) => {
    const tierState = lobby.tierState;
    const currentRound = tierState.currentRound;
    const isLastRound = currentRound >= TOTAL_TIER_ROUNDS - 1;
    const onlyOnePlayerLeft = tierState.activePlayers.size <= 1;
    const noPlayersLeft = tierState.activePlayers.size === 0;

    // Clear any existing timer
    if (tierState.roundTimer) {
      clearTimeout(tierState.roundTimer);
      tierState.roundTimer = null;
    }

    // Build round results with positions
    const roundResults = tierState.finishOrder.map(f => ({
      playerId: f.playerId,
      playerName: f.playerName,
      position: f.position,
      wpm: f.wpm,
      accuracy: f.accuracy,
      completionTime: f.completionTime
    }));

    // Add failed players to results
    tierState.failedThisRound.forEach(playerId => {
      const player = lobby.players.find(p => p.id === playerId);
      const stats = tierState.cumulativeStats.get(playerId);
      if (player && !roundResults.find(r => r.playerId === playerId)) {
        roundResults.push({
          playerId,
          playerName: player.name,
          position: roundResults.length + 1,
          wpm: 0,
          precision: 0,
          failed: true,
          isEliminated: stats?.isEliminated || false
        });
      }
    });

    // If only one player finishes and it's Easy/Medium, they win immediately?
    // User says: "If all players except for one are failed to complete the paragraph in easy or medium mode the winner would be decided straight forward"
    const difficulty = TIER_SCHEDULE[currentRound];
    if (difficulty !== 'hard' && tierState.activePlayers.size === 1 && !isLastRound) {
      // Single survivor in Easy/Medium round - they win!
      const winnerId = Array.from(tierState.activePlayers)[0];
      const winnerStats = tierState.cumulativeStats.get(winnerId);
      if (winnerStats) {
        // Trigger game over early
        const winner = {
          playerId: winnerId,
          playerName: winnerStats.playerName,
          avgWpm: Math.round(winnerStats.totalWpm / (winnerStats.completedRounds || 1)),
          avgPrecision: Math.round(winnerStats.totalPrecision / (winnerStats.completedRounds || 1)),
          totalPenaltyTime: winnerStats.totalPenaltyTime,
          isEliminated: false
        };

        io.to(roomId).emit('tier_game_complete', {
          leaderboard: [], // We can build this if needed
          winner,
          totalRounds: currentRound + 1,
          reason: 'last_standing'
        });

        // Reset game state
        lobby.gameInProgress = false;
        delete lobby.tierState;
        return;
      }
    }

    // Build leaderboard from cumulative stats
    const leaderboard = Array.from(tierState.cumulativeStats.entries())
      .map(([playerId, stats]) => ({
        playerId,
        playerName: stats.playerName,
        avgWpm: stats.completedRounds > 0 ? Math.round(stats.totalWpm / stats.completedRounds) : 0,
        avgPrecision: stats.completedRounds > 0 ? Math.round(stats.totalPrecision / stats.completedRounds) : 0,
        totalPenaltyTime: stats.totalPenaltyTime,
        completedRounds: stats.completedRounds,
        bestWpm: stats.bestWpm,
        isEliminated: stats.isEliminated
      }))
      .sort((a, b) => {
        // Non-eliminated first
        if (a.isEliminated !== b.isEliminated) return a.isEliminated ? 1 : -1;

        // If in Hard mode rounds comparison, comparison is based on LEAST PENALTY TIME
        if (currentRound >= 4) {
          if (a.totalPenaltyTime !== b.totalPenaltyTime) {
            return a.totalPenaltyTime - b.totalPenaltyTime;
          }
        }

        // Secondary: rounds completed
        if (a.completedRounds !== b.completedRounds) {
          return b.completedRounds - a.completedRounds;
        }

        // Tertiary: avgWpm
        return b.avgWpm - a.avgWpm;
      });

    // Emit round_ended to all players
    io.to(roomId).emit('round_ended', {
      roundIndex: currentRound,
      isLastRound: isLastRound || onlyOnePlayerLeft || noPlayersLeft,
      roundResults,
      leaderboard,
      activePlayers: Array.from(tierState.activePlayers)
    });

    console.log(`Tier round ${currentRound + 1}/${TOTAL_TIER_ROUNDS} ended in lobby ${lobby.name}`);

    // Game ends if: last round, only 1 player left, or no players left
    if (isLastRound || onlyOnePlayerLeft || noPlayersLeft) {
      // Check for draw condition - if ALL players have 0 completed rounds, it's a draw
      const allPlayersZeroRounds = leaderboard.every(p => p.completedRounds === 0);
      const allPlayersZeroWpm = leaderboard.every(p => p.avgWpm === 0);
      const isDraw = allPlayersZeroRounds && allPlayersZeroWpm;

      // Game over - emit final results
      // If it's a draw, winner is null
      const winner = isDraw ? null : (leaderboard.find(p => !p.isEliminated) || leaderboard[0]);

      io.to(roomId).emit('tier_game_complete', {
        leaderboard,
        winner,
        totalRounds: currentRound + 1,
        reason: isDraw ? 'draw' : (noPlayersLeft ? 'all_eliminated' : onlyOnePlayerLeft ? 'last_standing' : 'completed'),
        isDraw
      });

      // Track win for the winner (async, fire-and-forget) - only if not a draw
      if (winner && !isDraw) {
        const winnerPlayer = lobby.players.find(p => p.id === winner.playerId);
        if (winnerPlayer && winnerPlayer.mongoId) {
          User.findByIdAndUpdate(
            winnerPlayer.mongoId,
            { $inc: { 'stats.matchesWon': 1 } }
          ).catch(err => console.error('Failed to update tier winner stats:', err));
        }
      }

      // Reset game state
      lobby.gameInProgress = false;
      delete lobby.tierState;

      console.log(`Tier game complete in ${lobby.name}. Winner: ${winner?.playerName}`);
    } else {
      // Reset ready state for next round - wait for players to click ready
      tierState.readyForNextRound.clear();
      tierState.failedThisRound.clear();

      // Notify players they need to ready up
      io.to(roomId).emit('waiting_for_ready', {
        activePlayers: Array.from(tierState.activePlayers),
        nextRound: currentRound + 1,
        nextDifficulty: TIER_SCHEDULE[currentRound + 1]
      });
    }
  };

  // Helper function to advance to the next round
  const advanceToNextRound = (roomId, lobby) => {
    const tierState = lobby.tierState;
    if (!tierState) return;

    // Increment round
    tierState.currentRound += 1;
    const newRound = tierState.currentRound;

    // Reset round state
    tierState.finishOrder = [];
    tierState.roundResults = [];
    tierState.readyForNextRound.clear();
    tierState.failedThisRound.clear();

    // Get new paragraph for this round
    const paragraphText = getParagraphForRound(tierState, newRound);
    const difficulty = TIER_SCHEDULE[newRound];

    // Emit next_round to all players
    io.to(roomId).emit('next_round', {
      roundIndex: newRound,
      paragraphText,
      difficulty,
      totalRounds: TOTAL_TIER_ROUNDS,
      activePlayers: Array.from(tierState.activePlayers)
    });

    console.log(`Starting tier round ${newRound + 1}/${TOTAL_TIER_ROUNDS} (${difficulty}) in ${lobby.name}`);
  };

  // Tier Mode: Player finishes game early (clicked "Finish Game" button)
  socket.on('tier_finish_early', ({ roomId, playerId, stats }) => {
    const lobby = lobbies.get(roomId);
    if (!lobby || lobby.mode !== 'tier') return;

    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;

    // Clear any pending timers
    if (lobby.tierState?.roundTimer) {
      clearTimeout(lobby.tierState.roundTimer);
    }

    // Build leaderboard from current stats
    const tierState = lobby.tierState;
    const leaderboard = tierState ? Array.from(tierState.cumulativeStats.entries())
      .map(([pId, pStats]) => ({
        playerId: pId,
        playerName: pStats.playerName,
        avgWpm: pStats.completedRounds > 0 ? Math.round(pStats.totalWpm / pStats.completedRounds) : 0,
        avgAccuracy: pStats.completedRounds > 0 ? Math.round(pStats.totalAccuracy / pStats.completedRounds) : 0,
        completedRounds: pStats.completedRounds,
        bestWpm: pStats.bestWpm
      }))
      .sort((a, b) => b.avgWpm - a.avgWpm) : [];

    // Notify opponent that player finished early
    socket.to(roomId).emit('opponent_finished_early', {
      playerId: socket.id,
      playerName: player.name,
      stats
    });

    // Emit tier_game_complete to all players
    io.to(roomId).emit('tier_game_complete', {
      leaderboard,
      winner: leaderboard[0] || null,
      reason: 'finished_early'
    });

    // Clean up game state
    lobby.gameInProgress = false;
    delete lobby.tierState;

    console.log(`Tier game ended early in ${lobby.name} by ${player.name}`);
  });

  // Tier Mode: Player timed out
  socket.on('tier_player_timeout', ({ roomId, roundIndex, wpm, accuracy }) => {
    const lobby = lobbies.get(roomId);
    if (!lobby || lobby.mode !== 'tier' || !lobby.tierState) return;

    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;

    // Update stats for the timed-out player
    const stats = lobby.tierState.cumulativeStats.get(socket.id);
    if (stats) {
      stats.totalWpm += wpm;
      stats.totalAccuracy += accuracy;
      stats.completedRounds += 1;
    }

    // Build leaderboard
    const leaderboard = Array.from(lobby.tierState.cumulativeStats.entries())
      .map(([pId, pStats]) => ({
        playerId: pId,
        playerName: pStats.playerName,
        avgWpm: pStats.completedRounds > 0 ? Math.round(pStats.totalWpm / pStats.completedRounds) : 0,
        avgAccuracy: pStats.completedRounds > 0 ? Math.round(pStats.totalAccuracy / pStats.completedRounds) : 0,
        completedRounds: pStats.completedRounds,
        bestWpm: pStats.bestWpm
      }))
      .sort((a, b) => b.avgWpm - a.avgWpm);

    // Emit tier_game_complete - player timed out means game ends for them
    io.to(roomId).emit('tier_game_complete', {
      leaderboard,
      winner: leaderboard[0] || null,
      reason: 'timeout'
    });

    // Clean up
    if (lobby.tierState?.roundTimer) {
      clearTimeout(lobby.tierState.roundTimer);
    }
    lobby.gameInProgress = false;
    delete lobby.tierState;

    console.log(`Tier game ended in ${lobby.name} - ${player.name} timed out`);
  });

  // Go Again voting
  socket.on('vote_go_again', ({ roomId, playerId }) => {
    const lobby = lobbies.get(roomId);
    if (lobby) {
      // Initialize votes array if not exists
      if (!lobby.goAgainVotes) {
        lobby.goAgainVotes = [];
      }

      // Add vote if not already voted
      if (!lobby.goAgainVotes.includes(playerId)) {
        lobby.goAgainVotes.push(playerId);
      }

      const totalPlayers = lobby.players.length;
      const votes = lobby.goAgainVotes;

      // Broadcast updated vote count to all players
      io.to(roomId).emit('go_again_votes', {
        votes,
        totalPlayers
      });

      // If all players voted, start new round with new paragraph
      if (votes.length >= totalPlayers) {
        // Reset votes for next round
        lobby.goAgainVotes = [];

        // Mark game as in progress for new round
        lobby.gameInProgress = true;

        // Get a new paragraph (different from last used)
        const newParagraph = getParagraphForMode('random', 'easy', roomId);

        // Emit new round with new paragraph
        io.to(roomId).emit('new_round', {
          paragraphText: newParagraph
        });

        console.log(`New round starting in lobby ${roomId} with new paragraph`);
      }
    }
  });

  // Player returns to lobby from game (eliminated player)
  socket.on('return_to_lobby', ({ roomId }) => {
    const lobby = lobbies.get(roomId);
    if (!lobby) return;

    const player = lobby.players.find(p => p.id === socket.id);
    if (player) {
      player.inGame = false;

      // Host stays ready, non-host players need to ready up again
      const isHost = player.id === lobby.hostId;
      player.isReady = isHost; // Host is always ready, others are not

      // Notify all players about this player's status change
      io.to(roomId).emit('player_status_update', {
        playerId: socket.id,
        playerName: player.name,
        inGame: false,
        isReady: player.isReady
      });

      console.log(`${player.name} returned to lobby in ${lobby.name}`);

      // Check if all players have returned to lobby
      const allPlayersInLobby = lobby.players.every(p => !p.inGame);

      if (allPlayersInLobby && lobby.gameInProgress) {
        // All players are back in lobby - reset game state for new game
        lobby.gameInProgress = false;
        lobby.tierState = null;

        // Reset all player ready states (host stays ready)
        lobby.players.forEach(p => {
          p.status = 'waiting';
          p.isReady = p.id === lobby.hostId;
        });

        // Notify all players that game has reset and they can ready up again
        io.to(roomId).emit('game_reset', {
          players: lobby.players,
          message: 'Game ended. Ready up to play again!'
        });

        console.log(`Game reset in lobby ${lobby.name} - ready for new game`);
      }
    }
  });

  // Leave lobby
  socket.on('leave_lobby', ({ roomId }) => {
    const lobby = lobbies.get(roomId);
    if (lobby) {
      lobby.players = lobby.players.filter(p => p.id !== socket.id);
      socket.leave(roomId);
      io.to(roomId).emit('player_left', { playerId: socket.id });
    }
  });

  // Leave room (from LobbyRoom component)
  socket.on('leave_room', ({ roomId }) => {
    const lobby = lobbies.get(roomId);
    if (lobby) {
      const isHostLeaving = lobby.hostId === socket.id;

      lobby.players = lobby.players.filter(p => p.id !== socket.id);
      socket.leave(roomId);

      // Clean up this socket's session
      const lobbySessions = lobbySessionTokens.get(roomId);
      if (lobbySessions) {
        lobbySessions.delete(socket.id);
      }

      if (isHostLeaving) {
        // Host left - delete the entire lobby
        lobbies.delete(roomId);
        cleanupLobbySessions(roomId);
        io.to(roomId).emit('lobby_closed', { reason: 'Host left the lobby' });
        console.log(`Lobby ${lobby.name} deleted (host left)`);
      } else {
        // Regular player left
        io.to(roomId).emit('player_left', { playerId: socket.id });
      }
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Clean up player from any lobbies they were in
    lobbies.forEach((lobby, roomId) => {
      const playerIndex = lobby.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const disconnectedPlayer = lobby.players[playerIndex];
        const isHostLeaving = lobby.hostId === socket.id;
        const wasGameInProgress = lobby.gameInProgress;

        // If game is in progress, mark as disconnected instead of removing
        if (wasGameInProgress && !isHostLeaving) {
          disconnectedPlayer.disconnected = true;
          disconnectedPlayer.inGame = false; // No longer actively playing

          // Notify other players
          io.to(roomId).emit('player_disconnected', {
            playerId: socket.id,
            playerName: disconnectedPlayer.name
          });
          console.log(`Player ${disconnectedPlayer.name} marked as disconnected in ${lobby.name}`);
        } else {
          // Not in game or host leaving - remove player completely
          lobby.players.splice(playerIndex, 1);

          // Clean up session token
          const lobbySessions = lobbySessionTokens.get(roomId);
          if (lobbySessions) {
            lobbySessions.delete(socket.id);
          }
        }

        // Clean up tier mode timer if active
        if (lobby.tierState?.roundTimer) {
          clearTimeout(lobby.tierState.roundTimer);
        }

        if (isHostLeaving) {
          // Host disconnected - delete the entire lobby
          lobbies.delete(roomId);
          cleanupLobbySessions(roomId);
          io.to(roomId).emit('lobby_closed', { reason: 'Host disconnected' });
          console.log(`Lobby ${lobby.name} deleted (host disconnected)`);
        } else if (wasGameInProgress) {

          // For tier mode: If only one player left, end the game
          if (lobby.mode === 'tier' && lobby.players.length < 2 && lobby.tierState) {
            // End tier game since we need at least 2 players
            const tierState = lobby.tierState;
            const leaderboard = Array.from(tierState.cumulativeStats.entries())
              .filter(([playerId]) => lobby.players.some(p => p.id === playerId))
              .map(([playerId, stats]) => ({
                playerId,
                playerName: stats.playerName,
                avgWpm: stats.completedRounds > 0 ? Math.round(stats.totalWpm / stats.completedRounds) : 0,
                avgAccuracy: stats.completedRounds > 0 ? Math.round(stats.totalAccuracy / stats.completedRounds) : 0,
                completedRounds: stats.completedRounds,
                bestWpm: stats.bestWpm
              }))
              .sort((a, b) => b.avgWpm - a.avgWpm);

            io.to(roomId).emit('tier_game_complete', {
              leaderboard,
              winner: leaderboard[0],
              reason: 'opponent_left'
            });

            lobby.gameInProgress = false;
            delete lobby.tierState;
            console.log(`Tier game ended in ${lobby.name} - opponent left`);
          }
        } else {
          io.to(roomId).emit('player_left', { playerId: socket.id });
        }
      }
    });
  });
});

httpServer.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend: http://localhost:5173`);
  console.log(`🔌 WebSocket ready on port ${PORT}`);
  console.log('========================================');
});
