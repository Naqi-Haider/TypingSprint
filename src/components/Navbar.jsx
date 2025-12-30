import { memo, useEffect, useState, useMemo, useCallback } from 'react';
import '../styles/Navbar.css';
import AnimatedLogo from './AnimatedLogo';
import keyboardIcon from '../assets/keyboard.svg';
import keyboardBlue from '../assets/keyboard (2).svg';
import keyboardGold from '../assets/keyboard (4).svg';
import keyboardObsidian from '../assets/keyboard (5).svg';
import keyboardSakura from '../assets/keyboard (6).svg';
import keyboardPaper from '../assets/keyboard (7).svg';
import { NavbarAuth } from './AuthSystem';

const Navbar = memo(({ onLogoClick }) => {
  const [currentIcon, setCurrentIcon] = useState(keyboardIcon);

  // Memoize theme icons map
  const themeIcons = useMemo(() => ({
    'retro': keyboardIcon,
    'blue': keyboardBlue,
    'sakura': keyboardSakura,
    'paper': keyboardPaper,
    'gold': keyboardGold,
    'obsidian': keyboardObsidian
  }), []);

  // Memoize logo source getter
  const getLogoSrc = useCallback((theme) => {
    switch (theme) {
      case 'theme-blue': return keyboardBlue;
      case 'theme-sakura': return keyboardSakura;
      case 'theme-paper': return keyboardPaper;
      case 'theme-gold': return keyboardGold;
      case 'theme-obsidian': return keyboardObsidian;
      case 'theme-retro':
      default: return keyboardIcon;
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme') || 'retro';
    setCurrentIcon(themeIcons[savedTheme] || keyboardIcon);

    const handleStorageChange = (e) => {
      if (e.key === 'selectedTheme') {
        const newTheme = e.newValue || 'retro';
        setCurrentIcon(themeIcons[newTheme] || keyboardIcon);
      }
    };

    const handleThemeChange = (e) => {
      const newTheme = e.detail || 'retro';
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
  }, [themeIcons, getLogoSrc]);

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
});

Navbar.displayName = 'Navbar';

export default Navbar;
