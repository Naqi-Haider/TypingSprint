import { memo } from 'react';
import '../styles/AnimatedLogo.css';

const AnimatedLogo = memo(() => {
  return (
    <span className="animated-logo">
      TYPING SPRINT
      <span className="cursor">|</span>
    </span>
  );
});

AnimatedLogo.displayName = 'AnimatedLogo';

export default AnimatedLogo;
