import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './UserSettings.css';

const AVATAR_COLORS = [
  '#60934D', '#4a7a3d', '#3a5f30', '#2a4f20',
  '#8ab876', '#a0c48a', '#70b85d', '#509840'
];

const BANNER_GRADIENTS = [
  'linear-gradient(135deg, #60934D 0%, #2a4f20 100%)',
  'linear-gradient(135deg, #4a7a3d 0%, #0b140e 100%)',
  'linear-gradient(135deg, #8ab876 0%, #60934D 100%)',
  'linear-gradient(135deg, #70b85d 0%, #3a5f30 100%)',
  'linear-gradient(135deg, #0b140e 0%, #60934D 100%)',
  'linear-gradient(135deg, #2a4f20 0%, #8ab876 100%)'
];

const UserSettings = ({ onClose }) => {
  const { user, updateUserStats } = useAuth();
  
  const [username, setUsername] = useState(user?.name || 'User');
  const [bio, setBio] = useState(user?.bio || 'Professional typist');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarColor || AVATAR_COLORS[0]);
  const [selectedBanner, setSelectedBanner] = useState(user?.banner || BANNER_GRADIENTS[0]);

  const handleSave = () => {
    updateUserStats({
      name: username,
      bio: bio,
      avatarColor: selectedAvatar,
      banner: selectedBanner
    });
    onClose();
  };

  return (
    <div className="user-settings-overlay">
      <div className="user-settings-container">
        {/* Header */}
        <div className="settings-header">
          <button className="back-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Back</span>
          </button>
          <h1 className="settings-title">USER SETTINGS</h1>
          <button className="save-button" onClick={handleSave}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Save</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="settings-content">
          {/* Left Column - Preview */}
          <div className="settings-preview">
            <h2 className="section-heading">PREVIEW</h2>
            <div className="profile-card">
              {/* Banner */}
              <div 
                className="profile-banner" 
                style={{ background: selectedBanner }}
              ></div>
              
              {/* Avatar */}
              <div className="profile-avatar-wrapper">
                <div 
                  className="profile-avatar" 
                  style={{ backgroundColor: selectedAvatar }}
                >
                  {username.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Info */}
              <div className="profile-info">
                <div className="profile-username">{username}</div>
                <div className="profile-rank">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor"/>
                  </svg>
                  <span>Level {Math.floor((user?.bestWPM || 0) / 10) + 1}</span>
                </div>
                <div className="profile-bio">{bio}</div>
                
                <div className="profile-stats-grid">
                  <div className="profile-stat">
                    <div className="profile-stat-value">{user?.bestWPM || 0}</div>
                    <div className="profile-stat-label">Best WPM</div>
                  </div>
                  <div className="profile-stat">
                    <div className="profile-stat-value">{user?.gamesPlayed || 0}</div>
                    <div className="profile-stat-label">Games</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Controls */}
          <div className="settings-controls">
            {/* Identity Section */}
            <div className="control-section">
              <h2 className="section-heading">IDENTITY</h2>
              <div className="control-group">
                <label className="control-label">USERNAME</label>
                <input
                  type="text"
                  className="control-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div className="control-group">
                <label className="control-label">BIO</label>
                <textarea
                  className="control-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={100}
                  rows={3}
                />
                <div className="char-count">{bio.length}/100</div>
              </div>
            </div>

            {/* Aesthetics Section */}
            <div className="control-section">
              <h2 className="section-heading">AESTHETICS</h2>
              
              {/* Avatar Picker */}
              <div className="control-group">
                <label className="control-label">AVATAR COLOR</label>
                <div className="color-picker">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`color-option ${selectedAvatar === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedAvatar(color)}
                    >
                      {selectedAvatar === color && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Picker */}
              <div className="control-group">
                <label className="control-label">BANNER GRADIENT</label>
                <div className="banner-picker">
                  {BANNER_GRADIENTS.map((gradient, index) => (
                    <button
                      key={index}
                      className={`banner-option ${selectedBanner === gradient ? 'selected' : ''}`}
                      style={{ background: gradient }}
                      onClick={() => setSelectedBanner(gradient)}
                    >
                      {selectedBanner === gradient && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
