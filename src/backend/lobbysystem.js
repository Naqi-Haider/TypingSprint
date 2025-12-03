const Lobby = require('../models/Lobby');
const { generateParagraph } = require('../utils/textGenerator'); // Assuming you have this

module.exports = (io, socket) => {
  
  // 1. Create Lobby
  socket.on('create_lobby', async ({ username, avatar, theme, mode, maxPlayers, password }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newLobby = new Lobby({
      roomId,
      hostId: socket.id,
      gameMode: mode,
      maxPlayers,
      password,
      players: [{ 
        socketId: socket.id, 
        username, 
        avatar, 
        theme, 
        isReady: true 
      }]
    });

    await newLobby.save();
    socket.join(roomId);
    socket.emit('lobby_created', newLobby);
  });

  // 2. Join Lobby
  socket.on('join_lobby', async ({ roomId, username, avatar, theme }) => {
    const lobby = await Lobby.findOne({ roomId });
    
    if (!lobby) return socket.emit('error', 'Lobby not found');
    if (lobby.players.length >= lobby.maxPlayers) return socket.emit('error', 'Lobby full');
    if (lobby.status !== 'waiting') return socket.emit('error', 'Game already started');

    lobby.players.push({ socketId: socket.id, username, avatar, theme });
    await lobby.save();
    
    socket.join(roomId);
    io.to(roomId).emit('player_joined', lobby.players);
    socket.emit('joined_success', lobby);
  });

  // 3. Start Game (Handle Modes)
  socket.on('start_game', async ({ roomId }) => {
    const lobby = await Lobby.findOne({ roomId });
    if (socket.id !== lobby.hostId) return;

    // Logic for Paragraph Selection
    let text = "";
    let time = 60;

    if (lobby.gameMode === 'random') {
       // Logic: Randomly pick Medium (45s) or Hard (90s)
       const isHard = Math.random() > 0.5;
       text = await generateParagraph(isHard ? 'hard' : 'medium');
       time = isHard ? 90 : 45;
    } else {
       // Tier Mode: Round 1 (Easy)
       text = await generateParagraph('easy');
       time = 40;
    }

    lobby.status = 'starting';
    lobby.targetText = text;
    lobby.timeLimit = time;
    await lobby.save();

    io.to(roomId).emit('game_starting', { text, time });
    
    // Countdown 3..2..1 handled on client, then client emits 'ready_to_type'
  });

  // 4. Progress Sync
  socket.on('update_progress', async ({ roomId, progress, wpm }) => {
    socket.to(roomId).emit('opponent_progress', { socketId: socket.id, progress, wpm });
  });
};