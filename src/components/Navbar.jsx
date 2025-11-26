import './Navbar.css';
import AnimatedLogo from './AnimatedLogo';
import keyboardIcon from '../assets/keyboard.svg';
import { NavbarAuth } from './AuthSystem';

const Navbar = ({ onLogoClick }) => {
  return (
    <nav className="navbar glass">
      <div className="navbar-content">
        <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
          <img src={keyboardIcon} alt="Keyboard" className="logo-icon" />
          <AnimatedLogo />
        </div>
        <NavbarAuth />
      </div>
    </nav>
  );
};

export default Navbar;
