import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserSettings from './UserSettings';
import './NavbarAuth.css';

// NOTE: AuthModal component must be rendered at the root level in App.jsx
// to ensure it covers the full screen and avoids clipping issues from
// parent container overflow/positioning constraints. Do NOT render it here.

const NavbarAuth = () => {
  const { user, isGuest, isLoggedIn, logout, setShowAuthModal } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  const handleOpenSettings = () => {
    setShowDropdown(false);
    setShowSettings(true);
  };

  if (showSettings) {
    return <UserSettings onClose={() => setShowSettings(false)} />;
  }

  if (isGuest) {
    return (
      <div className="navbar-auth">
        <button
          className="login-button glass"
          onClick={() => setShowAuthModal(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Login</span>
        </button>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="navbar-auth" ref={dropdownRef}>
        <div
          className="user-profile glass"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="user-avatar">{user.avatar}</div>
          <span className="user-name">{user.name}</span>
          <svg
            className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {showDropdown && (
          <div className="user-dropdown glass">
            <div className="dropdown-header">
              <div className="dropdown-avatar">{user.avatar}</div>
              <div className="dropdown-user-info">
                <div className="dropdown-name">{user.name}</div>
                <div className="dropdown-email">{user.email}</div>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <button className="dropdown-item" onClick={handleOpenSettings}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 1v6m0 6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 12h6m6 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Settings</span>
            </button>

            <button className="dropdown-item logout" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default NavbarAuth;
