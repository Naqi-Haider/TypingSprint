import { useState, useEffect, memo } from 'react';
import '../styles/TypewriterText.css';

const TypewriterText = memo(({ text, speed = 100, deleteSpeed = 50, pauseDuration = 2000 }) => {
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
        if (displayText.length < text.length) {
          setDisplayText(text.slice(0, displayText.length + 1));
        } else {
          setIsPaused(true);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(text.slice(0, displayText.length - 1));
        } else {
          setIsDeleting(false);
        }
      }
    }, currentSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, isPaused, text, speed, deleteSpeed, pauseDuration]);

  return <span className="typewriter-text">{displayText}</span>;
});

TypewriterText.displayName = 'TypewriterText';

export default TypewriterText;
