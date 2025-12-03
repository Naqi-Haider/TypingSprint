import './Navbar.css';
import AnimatedLogo from './AnimatedLogo';
import keyboardIcon from '../assets/keyboard.svg';
import keyboardBlue from '../assets/keyboard (2).svg';
import keyboardSunset from '../assets/keyboard (3).svg';
import keyboardGold from '../assets/keyboard (4).svg';
import { NavbarAuth } from './AuthSystem';
import { useEffect, useState } from 'react';

const Navbar = ({ onLogoClick }) => {
  const [currentIcon, setCurrentIcon] = useState(keyboardIcon);

  useEffect(() => {
    // Get current theme from localStorage
    const savedTheme = localStorage.getItem('selectedTheme') || 'retro';

    // Map theme to keyboard icon
    const themeIcons = {
      'retro': keyboardIcon,
      'blue': keyboardBlue,
      'sunset': keyboardSunset,
      'gold': keyboardGold
    };

    setCurrentIcon(themeIcons[savedTheme] || keyboardIcon);

    // Listen for theme changes
    const handleStorageChange = (e) => {
      if (e.key === 'selectedTheme') {
        const newTheme = e.newValue || 'retro';
        setCurrentIcon(themeIcons[newTheme] || keyboardIcon);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
