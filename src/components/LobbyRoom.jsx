import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import MultiplayerGame from './MultiplayerGame';
import './LobbyRoom.css';

// Theme class mapping
const THEME_CLASSES = {
  'retro': '',
  'blue': 'theme-blue',
  'sakura': 'theme-sakura',
  'paper': 'theme-paper',
  'gold': 'theme-gold',
  'obsidian': 'theme-obsidian'
};

// Player theme colors mapping
const PLAYER_THEMES = {
  retro: {
    primary: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.5)',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
  },
  blue: {
    primary: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.5)',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
  },
  sakura: {
    primary: '#ffafcc',
    glow: 'rgba(255, 175, 204, 0.5)',
    gradient: 'linear-gradient(135deg, #ffafcc 0%, #ff8fab 100%)'
  },
  paper: {
    primary: '#2f4f4f',
    glow: 'rgba(47, 79, 79, 0.5)',
    gradient: 'linear-gradient(135deg, #2f4f4f 0%, #1a3333 100%)'
  },
  gold: {
    primary: '#eab308',
    glow: 'rgba(234, 179, 8, 0.5)',
    gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
  },
  obsidian: {
    primary: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.5)',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'
  }
};

const LobbyRoom = ({
  gameMode = 'random',
  maxPlayers = 4,
  onStartGame,
  onLeave,
  currentTheme: propTheme
}) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [inviteCopied, setInviteCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [players, setPlayers] = useState([]);
  const [lobbyData, setLobbyData] = useState({ hostId: null, mode: gameMode, maxPlayers, hasPassword: false });
  const [currentTheme, setCurrentTheme] = useState(propTheme || 'retro');
  const [showSettings, setShowSettings] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Password prompt state
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const passwordInputRef = useRef(''); // Ref to access latest password in socket listener
  const [passwordError, setPasswordError] = useState('');

  // Socket and game state
  const [socket, setSocket] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  // Lobby status: 'waiting' | 'starting' | 'in_progress'
  const [lobbyStatus, setLobbyStatus] = useState('waiting');
  const [gameStarting, setGameStarting] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [paragraphText, setParagraphText] = useState('');
  const [tierParagraphs, setTierParagraphs] = useState(null); // For tier mode: { easy, medium, hard }
  const [actualGameMode, setActualGameMode] = useState(gameMode || 'random'); // Track actual game mode
  const [allPlayersReady, setAllPlayersReady] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null); // For Profile Modal

  // Initialize socket connection and join lobby
  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Get current theme from localStorage
    const savedTheme = localStorage.getItem('selectedTheme') || 'retro';
    setCurrentTheme(savedTheme);

    // Connect to socket server
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    // Socket connection handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnecting(false);

      // Prepare user data for joining
      const userName = isLoggedIn && user?.name
        ? user.name
        : `Guest_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const userData = {
        id: newSocket.id,
        name: userName,
        theme: savedTheme,
        avatarUrl: user?.avatarUrl || null,
        stats: {
          wpm: user?.bestWPM || 0,
          accuracy: 95
        }
      };

      // Check for stored session token (from password validation)
      const storedSessionToken = sessionStorage.getItem(`lobby_session_${roomId}`);

      // Emit join_room event with session token if available
      newSocket.emit('join_room', {
        roomId,
        user: userData,
        sessionToken: storedSessionToken || undefined
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnecting(false);
    });

    // Listen for initial room state (Task 4: Synchronized loader)
    newSocket.on('current_room_state', (data) => {
      console.log('Current room state received:', data);
      setPlayers(data.players || []);
      setLobbyData({
        hostId: data.hostId || data.players?.find(p => p.isHost)?.id,
        mode: data.mode || actualGameMode,
        maxPlayers: data.maxPlayers || maxPlayers,
        hasPassword: data.hasPassword || false
      });

      // Add minimum delay for smooth UX (1.5 seconds minimum)
      setTimeout(() => {
        setIsConnecting(false);
      }, 1500);
    });

    // Listen for player joined event (Task 4: Live updates)
    newSocket.on('player_joined', (data) => {
      console.log('Player joined:', data);
      // Update players list immediately
      setPlayers(prev => [...prev, data.player]);
    });

    // Listen for player left event (Task 4: Live updates)
    newSocket.on('player_left', (data) => {
      console.log('Player left:', data);
      // Remove player from list immediately
      setPlayers(prev => prev.filter(p => p.id !== data.playerId));
    });

    // Listen for settings updates
    newSocket.on('settings_updated', (data) => {
      console.log('Settings updated:', data);
      setLobbyData(prev => ({ ...prev, mode: data.mode }));
    });

    // Listen for game_starting event (Phase 1: Countdown)
    newSocket.on('game_starting', (data) => {
      console.log('Game starting with countdown, mode:', data.mode);
      setLobbyStatus('starting');
      setGameStarting(true);
      setCountdown(5); // Changed from 3 to 5 seconds
      setActualGameMode(data.mode || 'random');

      if (data.mode === 'tier' && data.paragraphs) {
        // Store all tier paragraphs for progressive difficulty
        setTierParagraphs(data.paragraphs);
        setParagraphText(data.paragraphs.easy); // Start with easy
      } else {
        // Random mode - single paragraph
        setParagraphText(data.paragraphText || 'The quick brown fox jumps over the lazy dog.');
      }
    });

    // Listen for lobby closed (host left)
    newSocket.on('lobby_closed', (data) => {
      console.log('Lobby closed:', data.reason);
      alert(data.reason || 'Lobby has been closed');
      navigate('/');
    });

    // Listen for player ready changes
    newSocket.on('player_ready_changed', (data) => {
      console.log('Player ready changed:', data);
      setPlayers(data.players);
    });

    // Listen for all players ready - server will emit game_starting with text
    newSocket.on('all_players_ready', (data) => {
      console.log('All players ready! Waiting for synchronized start...');
      setAllPlayersReady(true);
      // The actual countdown will be triggered by game_starting event from server
      // This ensures all players are synchronized
    });

    // Password required for protected lobbies
    newSocket.on('password_required', () => {
      setShowPasswordPrompt(true);
      setIsConnecting(false);
    });

    // Password accepted - hide prompt and re-join with session token
    newSocket.on('password_accepted', (data) => {
      setShowPasswordPrompt(false);
      setPasswordError('');
      setIsConnecting(true); // Show loader while rejoining

      // Store session token for future reconnections
      if (data?.sessionToken) {
        sessionStorage.setItem(`lobby_session_${roomId}`, data.sessionToken);
      }

      // Re-emit join_room with the session token
      const userName = isLoggedIn && user?.name
        ? user.name
        : `Guest_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const savedTheme = localStorage.getItem('selectedTheme') || 'retro';
      newSocket.emit('join_room', {
        roomId,
        password: passwordInputRef.current, // Pass the password from ref
        user: {
          id: newSocket.id,
          name: userName,
          theme: savedTheme,
          avatarUrl: user?.avatarUrl || null,
          bannerUrl: user?.bannerUrl || null,
          avatarPosition: user?.avatarPosition || { x: 50, y: 50 },
          bannerPosition: user?.bannerPosition || { x: 50, y: 50 },
          mongoId: user?.id || null,
          stats: { wpm: user?.bestWPM || 0, accuracy: 95, matchesWon: user?.stats?.matchesWon || 0 }
        },
        sessionToken: data?.sessionToken
      });
    });

    // Password validation result
    newSocket.on('password_incorrect', () => {
      setPasswordError('Incorrect password. Please try again.');
    });

    // Lobby full - cannot join
    newSocket.on('lobby_full', () => {
      setIsConnecting(false);
      alert('Lobby Room Full! This lobby has reached its maximum player capacity.');
      navigate('/');
    });

    // Generic lobby error
    newSocket.on('lobby_error', (data) => {
      setIsConnecting(false);
      alert(data?.message || 'Failed to join lobby. Please try again.');
      navigate('/');
    });

    // Kicked by host
    newSocket.on('kicked', (data) => {
      setIsConnecting(false);
      alert('You were kicked by the host.');
      navigate('/');
    });

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.emit('leave_room', { roomId });
        newSocket.disconnect();
      }
    };
  }, [roomId, user, isLoggedIn, navigate]);

  // Countdown effect (Phase 1: 3-2-1 countdown)
  useEffect(() => {
    if (gameStarting && countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // Phase 2: After countdown, start the game
        setTimeout(() => {
          setLobbyStatus('in_progress');
          setGameStarted(true);
          setGameStarting(false);
        }, 500);
      }
    }
  }, [gameStarting, countdown]);

  // Generate invite link
  const getInviteLink = () => {
    return `${window.location.origin}/join/${roomId}`;
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(getInviteLink());
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId || '');
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (socket && isHost && canStartGame) {
      socket.emit('start_game_request', { roomId });
    }
  };

  const handleUpdateSettings = (newMode) => {
    if (socket && isHost) {
      socket.emit('update_settings', { roomId, mode: newMode });
      setLobbyData(prev => ({ ...prev, mode: newMode }));
    }
  };

  const handleLeave = () => {
    if (socket) {
      socket.emit('leave_room', { roomId });
      socket.disconnect();
    }
    if (onLeave) {
      onLeave();
    } else {
      navigate('/');
    }
  };

  const handleToggleReady = () => {
    if (socket && !isHost) {
      const newReadyState = !isReady;
      setIsReady(newReadyState);
      socket.emit('player_ready', { roomId, isReady: newReadyState });
    }
  };

  const handleDeleteLobby = () => {
    if (socket && isHost) {
      if (window.confirm('Are you sure you want to delete this lobby? All players will be removed.')) {
        socket.emit('delete_lobby', { roomId });
      }
    }
  };

  // Kick a player from the lobby (host only)
  const handleKickPlayer = (targetPlayerId) => {
    if (socket && isHost && targetPlayerId !== socket.id) {
      socket.emit('kick_player', { roomId, targetPlayerId });
    }
  };

  // Derive isHost from lobbyData
  const isHost = socket?.id === lobbyData.hostId;
  const currentMode = lobbyData.mode;
  const currentMaxPlayers = lobbyData.maxPlayers || 4;

  // Generate dynamic slots based on maxPlayers
  // Ensure host is always in slot 0
  const playerSlots = Array.from({ length: currentMaxPlayers }, (_, index) => {
    if (index === 0) {
      // Slot 0 is always for the host
      const hostPlayer = players.find(p => p.isHost);
      if (hostPlayer) return hostPlayer;
      // Fallback: if no players yet and current user is host, show them
      if (isHost) {
        return {
          id: socket?.id,
          name: isLoggedIn && user?.name ? user.name : 'Host',
          theme: currentTheme,
          avatarUrl: user?.avatarUrl || null,
          isHost: true,
          stats: { wpm: user?.bestWPM || 0, accuracy: 95 }
        };
      }
      return null;
    }
    // Fill remaining slots with non-host players
    const nonHostPlayers = players.filter(p => !p.isHost);
    return nonHostPlayers[index - 1] || null;
  });

  const isFull = players.length >= lobbyData.maxPlayers;
  const allReady = players.length > 0 && players.every(p => p.isReady);
  const canStartGame = isFull && allReady && isHost;
  const themeClass = THEME_CLASSES[currentTheme] || '';

  // Status-based rendering for seamless transitions
  // 'in_progress' - render MultiplayerGame
  if (lobbyStatus === 'in_progress' || gameStarted) {
    return (
      <MultiplayerGame
        targetText={paragraphText}
        tierParagraphs={tierParagraphs} // Pass tier paragraphs for progressive difficulty
        players={players}
        currentPlayer={players.find(p => p.id === socket?.id)}
        socket={socket}
        roomId={roomId}
        mode={actualGameMode}
        skipCountdown={false} // Let MultiplayerGame handle the color indicator countdown
        onLeave={handleLeave}
      />
    );
  }

  // 'starting' - render a fullscreen waiting/loader state
  if (lobbyStatus === 'starting') {
    return (
      <div className={`lobby-room min-h-screen ${themeClass}`}>
        <motion.div
          className="lobby-countdown-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="lobby-countdown-content">
            <motion.div
              className="lobby-loader-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.div>
            <motion.div
              className="lobby-countdown-label"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {countdown > 0 ? 'PREPARING GAME' : 'GET READY!'}
            </motion.div>
            <motion.div
              className="lobby-countdown-hint"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {countdown > 0 ? `Starting in ${countdown}...` : 'Type fast!'}
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show connecting loader
  if (isConnecting) {
    return (
      <div className="lobby-room min-h-screen flex items-center justify-center">
        <div className="connecting-loader">
          <div className="loader-spinner"></div>
          <p className="loader-text">Connecting to lobby...</p>
        </div>
      </div>
    );
  }

  // Show password prompt for protected lobbies using portal
  if (showPasswordPrompt) {
    const handlePasswordSubmit = () => {
      if (!passwordInput.trim()) return;
      setPasswordError('');
      socket?.emit('validate_password', { roomId, password: passwordInput });
    };

    return createPortal(
      <div className="password-modal-overlay">
        <div className="password-modal">
          <div className="password-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M7 11V7a5 5 0 1110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h2 className="password-title">Password</h2>
            <button className="password-close-btn" onClick={() => navigate('/')} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="password-subtitle">This lobby is password protected</p>
          <input
            type="password"
            className="password-input"
            placeholder="Enter lobby password"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              passwordInputRef.current = e.target.value;
            }}
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            autoFocus
          />
          {passwordError && <p className="password-error">{passwordError}</p>}
          <div className="password-actions">
            <button className="password-cancel-btn" onClick={() => navigate('/')}>
              Cancel
            </button>
            <button className="password-submit-btn" onClick={handlePasswordSubmit}>
              Join Lobby
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <>
      <div className={`lobby-room min-h-screen ${themeClass}`}>
        {/* Main Content Grid */}
        <div className="lobby-content-grid">
          {/* Left Section - Players Grid */}
          <div className="lobby-players-section">
            <div className="lobby-section-header">
              <h2 className="lobby-section-title">
                {/* Users Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Players ({players.length}/{currentMaxPlayers})</span>
              </h2>
            </div>

            <div className={`players-grid players-${currentMaxPlayers}`}>
              {playerSlots.map((player, index) => (
                <motion.div
                  key={player?.id || `empty-${index}`}
                  className={`player-slot ${player ? 'occupied' : 'empty'}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, type: 'spring' }}
                  style={player ? {
                    '--player-theme': PLAYER_THEMES[player.theme]?.primary || PLAYER_THEMES.retro.primary,
                    '--player-glow': PLAYER_THEMES[player.theme]?.glow || PLAYER_THEMES.retro.glow
                  } : {}}
                >
                  {player ? (
                    <div className="player-card player-card-new">
                      {/* Circular Avatar with Theme Border */}
                      <div
                        className="player-avatar-circle"
                        onClick={() => setSelectedProfile(player)}
                        style={{
                          borderColor: PLAYER_THEMES[player.theme]?.primary || '#22c55e',
                          boxShadow: `0 0 15px ${PLAYER_THEMES[player.theme]?.glow || 'rgba(34, 197, 94, 0.5)'}`
                        }}
                      >
                        {player.avatarUrl ? (
                          <img
                            src={player.avatarUrl}
                            alt={player.name}
                            className="player-avatar-img-round"
                            style={{ objectPosition: `${player.avatarPosition?.x || 50}% ${player.avatarPosition?.y || 50}%` }}
                          />
                        ) : (
                          <div
                            className="player-avatar-initial-round"
                            style={{ background: PLAYER_THEMES[player.theme]?.gradient }}
                          >
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="avatar-hover-overlay">
                          <span>View Profile</span>
                        </div>
                      </div>

                      {/* Host crown - moved outside avatar */}
                      {player.isHost && (
                        <div className="host-crown">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M2 17h20l-2-11-5 4-3-6-3 6-5-4-2 11z" fill="#FFD700" />
                          </svg>
                        </div>
                      )}

                      {/* Kick button for host - moved outside avatar */}
                      {isHost && !player.isHost && player.id !== socket?.id && (
                        <button
                          className="kick-btn-avatar"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Kick ${player.name} from the lobby?`)) {
                              handleKickPlayer(player.id);
                            }
                          }}
                          title={`Kick ${player.name}`}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}

                      {/* Player Name */}
                      <span className="player-name-new">{player.name}</span>

                      {/* Stats Row */}
                      <div className="player-stats-new">
                        <span className="stat-item">
                          <strong>{player.stats?.matchesWon || 0}</strong> Won
                        </span>
                        <span className="stat-divider">|</span>
                        <span className="stat-item">
                          <strong>{player.stats?.wpm || 0}</strong> WPM
                        </span>
                      </div>

                      {/* Ready Badge */}
                      {player.isReady && (
                        <div className="ready-indicator">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Ready
                        </div>
                      )}

                      {/* Ready button for current user */}
                      {player.id === socket?.id && !player.isHost && (
                        <button
                          className={`ready-toggle-btn ${player.isReady ? 'ready' : ''}`}
                          onClick={handleToggleReady}
                        >
                          {player.isReady ? 'Ready!' : 'Click to Ready'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="empty-slot">
                      <div className="empty-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                          <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <span className="empty-text">Waiting for player...</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Waiting Message - only show when NOT in countdown */}
            {
              !gameStarting && (
                players.length < 2 ? (
                  <div className="waiting-message">
                    <div className="waiting-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <p>Waiting for more players to join...</p>
                  </div>
                ) : (
                  <div className="waiting-message">
                    <p>Waiting for all players to be ready...</p>
                  </div>
                )
              )
            }
          </div >

          {/* Right Section - Host Only Sidebar */}
          {
            isHost && (
              <div className="lobby-sidebar">
                {/* Invite Card */}
                <div className="lobby-invite-card">
                  <h3 className="invite-card-title">
                    {/* Share Icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
                      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span>Invite Friends</span>
                  </h3>

                  {/* Room ID */}
                  <div className="invite-field">
                    <label className="invite-label">Room ID</label>
                    <div className="invite-input-group">
                      <input
                        type="text"
                        className="invite-input"
                        value={roomId || ''}
                        readOnly
                      />
                      <button
                        className={`invite-copy-btn ${idCopied ? 'copied' : ''}`}
                        onClick={handleCopyRoomId}
                      >
                        {idCopied ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Invite Link */}
                  <div className="invite-field">
                    <label className="invite-label">Invite Link</label>
                    <div className="invite-input-group">
                      <input
                        type="text"
                        className="invite-input invite-link-input"
                        value={getInviteLink()}
                        readOnly
                      />
                      <button
                        className={`invite-copy-btn ${inviteCopied ? 'copied' : ''}`}
                        onClick={handleCopyInviteLink}
                      >
                        {inviteCopied ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Game Settings Card - Host Only */}
                <div className="lobby-settings-card">
                  <h3 className="settings-card-title">
                    {/* Settings Icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span>Game Settings</span>
                  </h3>

                  <div className="settings-list">
                    <div className="settings-item">
                      <span className="settings-label">Game Mode</span>
                      {isHost ? (
                        <div className="settings-toggle-group">
                          <button
                            type="button"
                            className={`settings-toggle ${currentMode === 'random' ? 'active' : ''}`}
                            onClick={() => handleUpdateSettings('random')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                              <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            Random
                          </button>
                          <button
                            type="button"
                            className={`settings-toggle ${currentMode === 'tier' ? 'active' : ''}`}
                            onClick={() => handleUpdateSettings('tier')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            Tier
                          </button>
                        </div>
                      ) : (
                        <span className="settings-value">
                          {currentMode === 'random' ? (
                            <span className="settings-badge random">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                                <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                              </svg>
                              Random
                            </span>
                          ) : (
                            <span className="settings-badge tier">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" />
                              </svg>
                              Tier Mode
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="settings-item">
                      <span className="settings-label">Max Players</span>
                      <span className="settings-value">{currentMaxPlayers}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Host only has Delete Lobby */}
                <div className="lobby-actions">

                  {isHost && (
                    <button className="lobby-delete-btn" onClick={handleDeleteLobby}>
                      {/* Trash Icon */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Delete Lobby</span>
                    </button>
                  )}
                </div>

                {!isFull && isHost && (
                  <p className="lobby-hint">Waiting for lobby to be full ({players.length}/{lobbyData.maxPlayers} players)</p>
                )}
                {isFull && !allReady && isHost && (
                  <p className="lobby-hint">Waiting for all players to be ready</p>
                )}
              </div>
            )
          }

          {/* Non-Host: Show game info and leave button */}
          {
            !isHost && (
              <div className="lobby-sidebar">
                {/* Game Settings Card - Read Only for Guests */}
                <div className="lobby-settings-card">
                  <h3 className="settings-card-title">
                    {/* Settings Icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span>Game Settings</span>
                  </h3>

                  <div className="settings-list">
                    <div className="settings-item">
                      <span className="settings-label">Game Mode</span>
                      <span className="settings-value">
                        {currentMode === 'random' ? (
                          <span className="settings-badge random">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                              <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            Random
                          </span>
                        ) : (
                          <span className="settings-badge tier">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            Tier Mode
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="settings-item">
                      <span className="settings-label">Max Players</span>
                      <span className="settings-value">{currentMaxPlayers}</span>
                    </div>
                  </div>
                </div>

                <div className="lobby-actions">
                  <button className="lobby-leave-btn" onClick={handleLeave}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Leave Lobby</span>
                  </button>
                </div>
              </div>
            )
          }
        </div >
      </div >

      {/* Profile Modal */}
      {
        selectedProfile && createPortal(
          <div className={`profile-modal-overlay ${THEME_CLASSES[selectedProfile.theme || 'retro']}`} onClick={() => setSelectedProfile(null)}>
            <div
              className={`profile-modal ${THEME_CLASSES[selectedProfile.theme || 'retro']}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                borderColor: PLAYER_THEMES[selectedProfile.theme]?.primary || '#22c55e'
              }}
            >
              {/* Banner */}
              <div
                className="profile-modal-banner"
                style={{
                  background: selectedProfile.bannerUrl
                    ? `url(${selectedProfile.bannerUrl})`
                    : PLAYER_THEMES[selectedProfile.theme]?.gradient || 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: selectedProfile.bannerPosition
                    ? `${selectedProfile.bannerPosition.x}% ${selectedProfile.bannerPosition.y}%`
                    : 'center'
                }}
              >
                {/* Avatar */}
                <div
                  className="profile-modal-avatar"
                  style={{
                    background: selectedProfile.avatarUrl
                      ? `url(${selectedProfile.avatarUrl})`
                      : PLAYER_THEMES[selectedProfile.theme]?.gradient,
                    backgroundSize: 'cover',
                    backgroundPosition: selectedProfile.avatarPosition
                      ? `${selectedProfile.avatarPosition.x}% ${selectedProfile.avatarPosition.y}%`
                      : 'center',
                    borderColor: PLAYER_THEMES[selectedProfile.theme]?.primary || '#22c55e'
                  }}
                >
                  {!selectedProfile.avatarUrl && (
                    <div
                      className="profile-modal-avatar-initial"
                      style={{ background: PLAYER_THEMES[selectedProfile.theme]?.gradient }}
                    >
                      {selectedProfile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="profile-modal-content">
                <div className="profile-modal-name">{selectedProfile.name}</div>

                <div
                  className="profile-modal-theme-badge"
                  style={{
                    background: `${PLAYER_THEMES[selectedProfile.theme]?.primary}22`,
                    borderColor: PLAYER_THEMES[selectedProfile.theme]?.primary,
                    color: PLAYER_THEMES[selectedProfile.theme]?.primary
                  }}
                >
                  {PLAYER_THEMES[selectedProfile.theme]?.name || selectedProfile.theme}
                </div>

                <div className="profile-modal-stats">
                  <div className="profile-modal-stat">
                    <div className="profile-modal-stat-value">{selectedProfile.stats?.matchesWon || 0}</div>
                    <div className="profile-modal-stat-label">Matches Won</div>
                  </div>
                  <div className="profile-modal-stat">
                    <div className="profile-modal-stat-value">{selectedProfile.stats?.wpm || 0}</div>
                    <div className="profile-modal-stat-label">Best WPM</div>
                  </div>
                  <div className="profile-modal-stat">
                    <div className="profile-modal-stat-value">{selectedProfile.stats?.accuracy || 95}%</div>
                    <div className="profile-modal-stat-label">Accuracy</div>
                  </div>
                </div>

                <button className="profile-modal-close" onClick={() => setSelectedProfile(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default LobbyRoom;
