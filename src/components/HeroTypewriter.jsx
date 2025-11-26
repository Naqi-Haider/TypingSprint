import { useState, useEffect } from 'react';
import './HeroTypewriter.css';

const HeroTypewriter = ({ 
  strings, 
  typingSpeed = 50, 
  deletingSpeed = 30, 
  pauseDuration = 1500 
}) => {
  const [currentStringIndex, setCurrentStringIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentString = strings[currentStringIndex];

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    const currentSpeed = isDeleting ? deletingSpeed : typingSpeed;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing phase
        if (displayText.length < currentString.length) {
          setDisplayText(currentString.slice(0, displayText.length + 1));
        } else {
          // Finished typing, pause before deleting
          setIsPaused(true);
        }
      } else {
        // Deleting phase
        if (displayText.length > 0) {
          setDisplayText(currentString.slice(0, displayText.length - 1));
        } else {
          // Finished deleting, move to next string
          setIsDeleting(false);
          setCurrentStringIndex((prevIndex) => (prevIndex + 1) % strings.length);
        }
      }
    }, currentSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, isPaused, currentStringIndex, strings, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <div className="hero-typewriter">
      <span className="hero-typewriter-text">{displayText}</span>
      <span className="hero-cursor">|</span>
    </div>
  );
};

export default HeroTypewriter;
