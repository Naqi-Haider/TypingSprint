import './Navbar.css';
import AnimatedLogo from './AnimatedLogo';
import keyboardIcon from '../assets/keyboard.svg';
import keyboardBlue from '../assets/keyboard (2).svg';
import keyboardSunset from '../assets/keyboard (3).svg';
import keyboardGold from '../assets/keyboard (4).svg';
import keyboardObsidian from '../assets/keyboard (5).svg';
import { NavbarAuth } from './AuthSystem';
import { useEffect, useState } from 'react';

const Navbar = ({ onLogoClick }) => {
  const [currentIcon, setCurrentIcon] = useState(keyboardIcon);

  // Map theme to keyboard icon
  const themeIcons = {
    'retro': keyboardIcon,
    'blue': keyboardBlue,
    'sunset': keyboardSunset,
    'gold': keyboardGold,
    'obsidian': keyboardObsidian
  };

  // Get logo based on theme class
  const getLogoSrc = (theme) => {
    switch (theme) {
      case 'theme-blue':
        return keyboardBlue;
      case 'theme-sunset':
        return keyboardSunset;
      case 'theme-gold':
        return keyboardGold;
      case 'theme-obsidian':
        return keyboardObsidian;
      case 'theme-retro':
      default:
        return keyboardIcon;
    }
  };

  useEffect(() => {
    // Get current theme from localStorage
    const savedTheme = localStorage.getItem('selectedTheme') || 'retro';
    setCurrentIcon(themeIcons[savedTheme] || keyboardIcon);

    // Listen for theme changes from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'selectedTheme') {
        const newTheme = e.newValue || 'retro';
        setCurrentIcon(themeIcons[newTheme] || keyboardIcon);
      }
    };

    // Listen for theme changes within the same tab (custom event)
    const handleThemeChange = (e) => {
      const newTheme = e.detail || 'retro';
      // Support both theme name and theme class
      if (newTheme.startsWith('theme-')) {
        setCurrentIcon(getLogoSrc(newTheme));
      } else {
        setCurrentIcon(themeIcons[newTheme] || keyboardIcon);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleThemeChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  return (
    <nav className="navbar glass">
      <div className="navbar-content">
        <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
          <img src={currentIcon} alt="Keyboard" className="logo-icon" />
          <AnimatedLogo />
        </div>
        <NavbarAuth />
      </div>
    </nav>
  );
};

export default Navbar;
