import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './UserSettings.css';

const THEMES = [
  {
    id: 'retro',
    name: 'Retro Terminal',
    className: '',
    isPremium: false,
    locked: false,
    colors: {
      primary: '#22c55e',
      bg: '#000000',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
    }
  },
  {
    id: 'blue',
    name: 'Cyber Blue',
    className: 'theme-blue',
    isPremium: false,
    locked: false,
    colors: {
      primary: '#06b6d4',
      bg: '#0f172a',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Synth',
    className: 'theme-sunset',
    isPremium: true,
    locked: false,
    colors: {
      primary: '#f97316',
      bg: '#2e1065',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
    }
  },
  {
    id: 'gold',
    name: 'Matrix Gold',
    className: 'theme-gold',
    isPremium: true,
    locked: false,
    colors: {
      primary: '#eab308',
      bg: '#1a1a1a',
      gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
    }
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    className: 'theme-obsidian',
    isPremium: false,
    locked: false,
    colors: {
      primary: '#ffffff',
      bg: '#000000',
      gradient: 'linear-gradient(135deg, #1a1a1a 0%, #000000 50%, #262626 100%)',
      border: '#404040'
    }
  }
];

const UserSettings = ({ onClose }) => {
  const { user, updateUserStats } = useAuth();

  // Initial values for change tracking
  const initialUsername = user?.name || 'User';
  const initialBio = user?.bio || 'Professional typist';
  const initialAvatarUrl = user?.avatarUrl || '';
  const initialBannerUrl = user?.bannerUrl || '';
  const initialTheme = THEMES.find(t => t.id === (user?.theme || 'retro')) || THEMES[0];

  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl);
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);

  // Track if any changes have been made
  const hasChanges =
    username !== initialUsername ||
    bio !== initialBio ||
    avatarUrl !== initialAvatarUrl ||
    bannerUrl !== initialBannerUrl ||
    selectedTheme.id !== initialTheme.id;

  const handleThemeSelect = (theme) => {
    if (theme.locked) return;
    setSelectedTheme(theme);

    // Apply theme immediately
    const root = document.documentElement;
    root.className = theme.className;
    localStorage.setItem('selectedTheme', theme.id);
    
    // Dispatch custom event for same-tab reactivity
    window.dispatchEvent(new CustomEvent('themeChange', { detail: theme.id }));
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmClose) return;

      // Revert theme if changed and not saved
      if (selectedTheme.id !== initialTheme.id) {
        const root = document.documentElement;
        root.className = initialTheme.className;
        localStorage.setItem('selectedTheme', initialTheme.id);
        window.dispatchEvent(new CustomEvent('themeChange', { detail: initialTheme.id }));
      }
    }
    onClose();
  };

  const handleSave = () => {
    updateUserStats({
      name: username,
      bio: bio,
      avatarUrl: avatarUrl,
      bannerUrl: bannerUrl,
      theme: selectedTheme.id
    });
    onClose();
  };

  return (
    <div className="user-settings-overlay">
      <div className="user-settings-container">
        {/* Header */}
        <div className="settings-header">
          <button className="back-button" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back</span>
          </button>
          <h1 className="settings-title">USER SETTINGS</h1>
          <button 
            className={`save-button ${!hasChanges ? 'disabled' : ''}`} 
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                style={{
                  background: bannerUrl
                    ? `url(${bannerUrl}) center/cover`
                    : selectedTheme.colors.gradient
                }}
              ></div>

              {/* Avatar */}
              <div className="profile-avatar-wrapper">
                <div
                  className="profile-avatar"
                  style={{
                    backgroundColor: avatarUrl ? 'transparent' : selectedTheme.colors.primary,
                    backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!avatarUrl && username.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Info */}
              <div className="profile-info">
                <div className="profile-username">{username}</div>
                <div className="profile-rank">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor" />
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
                    <div className="profile-stat-value">{user?.highestStreak || 0}</div>
                    <div className="profile-stat-label">Highest Streak</div>
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

            {/* Themes Section */}
            <div className="control-section">
              <h2 className="section-heading">THEMES</h2>
              <div className="theme-grid">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    className={`theme-card ${selectedTheme.id === theme.id ? 'selected' : ''} ${theme.locked ? 'locked' : ''}`}
                    style={{ 
                      background: theme.colors.gradient,
                      borderColor: theme.colors.border || 'transparent'
                    }}
                    onClick={() => handleThemeSelect(theme)}
                    disabled={theme.locked}
                  >
                    <div className="theme-card-content">
                      <div className="theme-name">{theme.name}</div>
                      {theme.isPremium && (
                        <div className="theme-badge">Premium</div>
                      )}
                    </div>
                    {theme.locked && (
                      <div className="lock-overlay">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                    {selectedTheme.id === theme.id && !theme.locked && (
                      <div className="theme-check">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Uploads Section */}
            <div className="control-section">
              <h2 className="section-heading">CUSTOM UPLOADS</h2>

              {/* Profile Picture URL */}
              <div className="control-group">
                <label className="control-label">PROFILE PICTURE URL</label>
                <div className="url-input-group">
                  <input
                    type="text"
                    className="control-input"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <button className="upload-button" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Upload</span>
                  </button>
                </div>
                <div className="control-hint">Leave empty to use theme color</div>
              </div>

              {/* Banner Image URL */}
              <div className="control-group">
                <label className="control-label">BANNER IMAGE URL</label>
                <div className="url-input-group">
                  <input
                    type="text"
                    className="control-input"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                  />
                  <button className="upload-button" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Upload</span>
                  </button>
                </div>
                <div className="control-hint">Leave empty to use theme gradient</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
