import { useState, useEffect } from 'react';
import './TypewriterText.css';

const TypewriterText = ({ text, speed = 100, deleteSpeed = 50, pauseDuration = 2000 }) => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    const currentSpeed = isDeleting ? deleteSpeed : speed;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < text.length) {
          setDisplayText(text.slice(0, displayText.length + 1));
        } else {
          // Finished typing, pause before deleting
          setIsPaused(true);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(text.slice(0, displayText.length - 1));
        } else {
          // Finished deleting, start typing again
          setIsDeleting(false);
        }
      }
    }, currentSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, isPaused, text, speed, deleteSpeed, pauseDuration]);

  return <span className="typewriter-text">{displayText}</span>;
};

export default TypewriterText;
