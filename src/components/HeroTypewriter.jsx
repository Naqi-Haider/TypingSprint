import { useState, useEffect, memo, useMemo } from 'react';
import '../styles/HeroTypewriter.css';

const HeroTypewriter = memo(({
  strings,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 1500
}) => {
  const [currentStringIndex, setCurrentStringIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Memoize current string
  const currentString = useMemo(() =>
    strings[currentStringIndex],
    [strings, currentStringIndex]
  );

  useEffect(() => {
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
        if (displayText.length < currentString.length) {
          setDisplayText(currentString.slice(0, displayText.length + 1));
        } else {
          setIsPaused(true);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(currentString.slice(0, displayText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentStringIndex((prevIndex) => (prevIndex + 1) % strings.length);
        }
      }
    }, currentSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, isPaused, currentString, strings.length, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <div className="hero-typewriter">
      <span className="hero-typewriter-text">{displayText}</span>
      <span className="hero-cursor">|</span>
    </div>
  );
});

HeroTypewriter.displayName = 'HeroTypewriter';

export default HeroTypewriter;
