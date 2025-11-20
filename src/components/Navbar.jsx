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
          <div className="stat-badge glass">
            <span className="stat-label">Best WPM</span>
            <span className="stat-value">{bestWPM}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
