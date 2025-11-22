import './Navbar.css';
import AnimatedLogo from './AnimatedLogo';
import keyboardIcon from '../assets/keyboard.svg';

const Navbar = ({ onLogoClick, bestWPM }) => {
  return (
    <nav className="navbar glass">
      <div className="navbar-content">
        <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
          <img src={keyboardIcon} alt="Keyboard" className="logo-icon" />
          <AnimatedLogo />
        </div>
        <div className="nav-stats">
          <span className="best-wpm-text">Best WPM: <span className="wpm-value">{bestWPM}</span></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
