import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: function () {
      return this.username.charAt(0).toUpperCase();
    }
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  bannerUrl: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 150
  },
  theme: {
    type: String,
    default: 'retro'
  },
  avatarPosition: {
    x: { type: Number, default: 50 },
    y: { type: Number, default: 50 }
  },
  bannerPosition: {
    x: { type: Number, default: 50 },
    y: { type: Number, default: 50 }
  },
  stats: {
    bestWPM: {
      type: Number,
      default: 0
    },
    avgWPM: {
      type: Number,
      default: 0
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
    totalWords: {
      type: Number,
      default: 0
    },
    accuracy: {
      type: Number,
      default: 0
    },
    matchesWon: {
      type: Number,
      default: 0
    },
    hoursPlayed: {
      type: Number,
      default: 0
    }
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

export default mongoose.model('User', UserSchema);
