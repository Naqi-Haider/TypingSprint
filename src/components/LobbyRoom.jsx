import { useState } from 'react';
import { motion } from 'framer-motion';
import './LobbyRoom.css';

// Player theme colors mapping
const PLAYER_THEMES = {
  green: {
    primary: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.5)',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
  },
  blue: {
    primary: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.5)',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
  },
  gold: {
    primary: '#eab308',
    glow: 'rgba(234, 179, 8, 0.5)',
    gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
  },
  sunset: {
    primary: '#f97316',
    glow: 'rgba(249, 115, 22, 0.5)',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
  },
  obsidian: {
    primary: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.5)',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'
  }
};

const LobbyRoom = ({ 
  roomId = 'ABC123',
  gameMode = 'random',
  players = [],
  maxPlayers = 4,
  isHost = false,
  onStartGame,
  onLeave
}) => {
  const [inviteCopied, setInviteCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  // Generate invite link
  const getInviteLink = () => {
    return `${window.location.origin}/lobby/${roomId}`;
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

  const handleLeave = () => {
    if (onLeave) {
      onLeave();
    }
  };

  // Fill empty slots
  const playerSlots = [...players];
  while (playerSlots.length < maxPlayers) {
    playerSlots.push(null);
  }

  const canStartGame = players.length >= 2 && isHost;

  return (
    <div className="lobby-room">
      {/* Main Content Grid */}
      <div className="lobby-content-grid">
        {/* Left Section - Players Grid */}
        <div className="lobby-players-section">
          <div className="lobby-section-header">
            <h2 className="lobby-section-title">
              {/* Users Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Players ({players.length}/{maxPlayers})</span>
            </h2>
          </div>

          <div className={`players-grid players-${maxPlayers}`}>
            {playerSlots.map((player, index) => (
              <motion.div
                key={player?.id || `empty-${index}`}
                className={`player-slot ${player ? 'occupied' : 'empty'}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
                style={player ? {
                  '--player-theme': PLAYER_THEMES[player.theme]?.primary || PLAYER_THEMES.green.primary,
                  '--player-glow': PLAYER_THEMES[player.theme]?.glow || PLAYER_THEMES.green.glow
                } : {}}
              >
                {player ? (
                  <div className="player-card">
                    <div className="player-avatar-wrapper">
                      {player.avatarUrl ? (
                        <img src={player.avatarUrl} alt={player.name} className="player-avatar-img" />
                      ) : (
                        <div className="player-avatar-initial" style={{ background: PLAYER_THEMES[player.theme]?.gradient }}>
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="player-info">
                      <span className="player-name">{player.name}</span>
                      <div className="player-badges">
                        {player.isHost && (
                          <span className="badge host-badge">
                            {/* Crown Icon */}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 17h20l-2-11-5 4-3-6-3 6-5-4-2 11z" fill="currentColor"/>
                            </svg>
                            Host
                          </span>
                        )}
                        {player.isReady && (
                          <span className="badge ready-badge">
                            {/* Check Icon */}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Ready
                          </span>
                        )}
                      </div>
                    </div>
                    {player.stats && (
                      <div className="player-stats">
                        <span className="stat">{player.stats.wpm} WPM</span>
                        <span className="stat">{player.stats.accuracy}%</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-slot">
                    <div className="empty-icon">
                      {/* User Plus Icon */}
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="empty-text">Waiting for player...</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Waiting Message */}
          {players.length < 2 && (
            <div className="waiting-message">
              <div className="waiting-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Waiting for more players to join...</p>
            </div>
          )}
        </div>

        {/* Right Section - Invite & Settings */}
        <div className="lobby-sidebar">
          {/* Invite Card */}
          <div className="lobby-invite-card">
            <h3 className="invite-card-title">
              {/* Share Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2"/>
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
                        <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
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
                        <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Game Settings Card */}
          <div className="lobby-settings-card">
            <h3 className="settings-card-title">
              {/* Settings Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Game Settings</span>
            </h3>

            <div className="settings-list">
              <div className="settings-item">
                <span className="settings-label">Game Mode</span>
                <span className="settings-value">
                  {gameMode === 'random' ? (
                    <span className="settings-badge random">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                        <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Random
                    </span>
                  ) : (
                    <span className="settings-badge tier">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Tier Mode
                    </span>
                  )}
                </span>
              </div>
              <div className="settings-item">
                <span className="settings-label">Max Players</span>
                <span className="settings-value">{maxPlayers}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="lobby-actions">
            <button className="lobby-leave-btn" onClick={handleLeave}>
              {/* Log Out Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Leave Lobby</span>
            </button>

            {isHost && (
              <button 
                className={`lobby-start-btn ${!canStartGame ? 'disabled' : ''}`}
                onClick={onStartGame}
                disabled={!canStartGame}
              >
                {/* Play Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
                </svg>
                <span>Start Game</span>
              </button>
            )}
          </div>

          {!canStartGame && isHost && (
            <p className="lobby-hint">Need at least 2 players to start</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LobbyRoom;
