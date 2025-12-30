# TypingSprint

A modern, real-time multiplayer typing game built with React and Node.js. Test your typing speed and accuracy in competitive paragraph races with friends or practice solo with multiple game modes.

## Overview

TypingSprint is a full-stack web application designed to help users improve their typing skills through engaging gameplay. The application features both single-player and multiplayer modes, real-time progress tracking, and a customizable theming system.

## Features

### Game Modes

**Speed Bullet Mode**
- 60-second timed challenge
- Random word generation
- Real-time WPM calculation
- Accuracy tracking with error penalties
- Combo system for consecutive correct inputs

**Paragraph Mode**
- Progressive difficulty tiers (Easy, Medium, Hard)
- 20-second timer with time bonuses
- Character-level error detection
- Completion time tracking

**Multiplayer Paragraph Race**
- Real-time competitive typing
- Support for 2-4 players
- Two game modes: Random and Tier Mode
- Live progress tracking for all players
- Elimination system for failed rounds
- Password-protected lobbies
- Spectator mode for eliminated players

### User System

- User authentication (login/signup)
- Profile customization with avatars
- Statistics tracking (best WPM, accuracy)
- Theme preferences persistence
- Session management

### Theming

Six built-in themes:
- Retro Terminal (default green)
- Cyber Blue
- Sakura Night (pink/grey)
- Paper Mode (light theme)
- Matrix Gold
- Obsidian (monochrome)

## Technology Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Framer Motion for animations
- Socket.IO Client for real-time communication
- CSS3 with CSS Variables for theming

### Backend
- Node.js with Express
- Socket.IO for WebSocket communication
- MongoDB with Mongoose ODM
- bcrypt for password hashing
- Session-based authentication

## Project Structure

```
TypingSprint/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── HomePage.jsx          # Landing page
│   │   ├── GameEngine.jsx        # Speed Bullet game logic
│   │   ├── ParagraphEngine.jsx   # Paragraph mode logic
│   │   ├── MultiplayerGame.jsx   # Multiplayer game interface
│   │   ├── LobbyRoom.jsx         # Multiplayer lobby
│   │   ├── Navbar.jsx            # Navigation bar
│   │   ├── AuthModal.jsx         # Login/Signup modal
│   │   └── UserSettings.jsx      # User profile settings
│   ├── context/                  # React context providers
│   │   └── AuthContext.jsx       # Authentication state
│   ├── assets/                   # Static assets
│   ├── App.jsx                   # Main application component
│   └── index.css                 # Global styles and themes
├── server/                       # Backend source code
│   ├── models/                   # Mongoose schemas
│   │   └── User.js               # User model
│   ├── routes/                   # Express routes
│   │   └── authRoutes.js         # Authentication endpoints
│   └── server.js                 # Main server file
└── public/                       # Static files

```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas connection)
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone https://github.com/Naqi-Haider/TypingSprint.git
cd TypingSprint
```

2. Install frontend dependencies
```bash
npm install
```

3. Install backend dependencies
```bash
cd server
npm install
```

4. Configure MongoDB connection
Edit `server/server.js` and update the MongoDB URI:
```javascript
mongoose.connect('mongodb://localhost:27017/typing-sprint')
```

5. Start the development servers

Backend (from `/server` directory):
```bash
node server.js
```

Frontend (from root directory):
```bash
npm run dev
```

6. Access the application
Open your browser and navigate to `http://localhost:5173`

## How It Works

### Single Player Flow

1. User selects a game mode from the homepage
2. Game engine initializes with appropriate settings
3. Timer starts on first keystroke
4. Real-time WPM and accuracy calculations
5. Results displayed upon completion

### Multiplayer Flow

1. Host creates a lobby with game settings (mode, max players, password)
2. Players join via room ID or lobby search
3. Host starts the game when ready
4. All players type the same paragraph simultaneously
5. Real-time progress synced via WebSocket
6. Rankings determined by completion time
7. Eliminated players can spectate remaining rounds
8. Final results displayed after all rounds

### Real-Time Communication

The application uses Socket.IO for bidirectional communication:

**Client Events:**
- `create_lobby` - Create new game room
- `join_lobby` - Join existing room
- `start_game` - Begin multiplayer match
- `typing_progress` - Send typing updates
- `player_finished` - Signal completion

**Server Events:**
- `lobby_created` - Confirm room creation
- `player_joined` - Notify new player
- `game_started` - Begin countdown
- `player_progress` - Broadcast typing updates
- `round_complete` - End round and show results

## Configuration

### Theme Customization

Themes are defined in `src/index.css` using CSS variables. To add a new theme:

1. Define theme class with color variables
2. Add theme to `THEME_CLASSES` mapping in `App.jsx`
3. Update theme selector in `UserSettings.jsx`

### Game Parameters

Adjust game settings in respective component files:

**Speed Bullet** (`GameEngine.jsx`):
- `GAME_DURATION` - Game length in seconds
- `ERROR_PENALTY` - Time penalty per error

**Paragraph Mode** (`ParagraphEngine.jsx`):
- `INITIAL_TIME_LIMIT` - Starting time per paragraph
- `TIME_BONUS` - Bonus seconds for quick completion

**Multiplayer** (`MultiplayerGame.jsx`):
- `TOTAL_TIER_ROUNDS` - Number of rounds in Tier Mode
- `INTERMISSION_DURATION` - Break between rounds

## Contributing

We welcome contributions from the community. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate comments.

## License

This project is open source and available under the MIT License.

## Acknowledgments

Built with passion for the typing community. Special thanks to all contributors and users who help improve TypingSprint.
