const mongoose = require('mongoose');

const LobbySchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  hostId: { type: String, required: true },
  
  // Settings
  maxPlayers: { type: Number, default: 4 },
  gameMode: { type: String, enum: ['random', 'tier'], default: 'random' },
  status: { type: String, enum: ['waiting', 'starting', 'in_progress', 'finished'], default: 'waiting' },
  password: { type: String, default: null }, // Null = Public
  
  // Game State
  currentRound: { type: Number, default: 1 }, // For Tier Mode (1-5)
  targetText: { type: String, default: '' },
  timeLimit: { type: Number, default: 60 },
  startTime: { type: Number },

  // Players
  players: [{
    socketId: String,
    username: String,
    avatar: String, // URL
    theme: String,  // For glowing effect
    isReady: { type: Boolean, default: false },
    progress: { type: Number, default: 0 }, // 0-100%
    wpm: { type: Number, default: 0 },
    rank: { type: Number, default: 0 }
  }],

  createdAt: { type: Date, default: Date.now, expires: 3600 } // TTL 1hr
});

module.exports = mongoose.model('Lobby', LobbySchema);