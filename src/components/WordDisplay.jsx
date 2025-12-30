import { memo, useMemo, useCallback } from 'react';
import '../styles/WordDisplay.css';

const WordDisplay = memo(({ words, currentWordIndex, userInput, hasError, errorCharIndex }) => {
  // Memoize position calculator
  const getWordPosition = useCallback((index) => {
    return index - currentWordIndex;
  }, [currentWordIndex]);

  // Memoize word renderer
  const renderWord = useCallback((word, index) => {
    const position = getWordPosition(index);
    const isActive = index === currentWordIndex;
    const isPast = index < currentWordIndex;
    const isFuture = index > currentWordIndex;

    return (
      <div className="word-chars">
        {word.split('').map((char, charIndex) => {
          let className = 'char';
          let shouldShake = false;

          if (isActive) {
            if (charIndex < userInput.length) {
              className += userInput[charIndex] === char ? ' correct' : ' incorrect';
              if (userInput[charIndex] !== char && charIndex === errorCharIndex && hasError) {
                shouldShake = true;
              }
            } else if (charIndex === userInput.length) {
              if (charIndex === errorCharIndex && hasError) {
                className += ' incorrect';
                shouldShake = true;
              } else {
                className += ' current';
              }
            }
          } else if (isPast) {
            const fadeDelay = charIndex * 0.02;
            return (
              <span
                key={charIndex}
                className={`${className} past-char`}
                style={{ animationDelay: `${fadeDelay}s`, opacity: 0.2 }}
              >
                {char}
              </span>
            );
          } else if (isFuture) {
            const fadeDelay = charIndex * 0.02;
            return (
              <span
                key={charIndex}
                className={`${className} future-char`}
                style={{ animationDelay: `${fadeDelay}s`, opacity: 0.5 }}
              >
                {char}
              </span>
            );
          }

          return (
            <span key={charIndex} className={`${className} ${shouldShake ? 'shake-char' : ''}`}>
              {char}
            </span>
          );
        })}
      </div>
    );
  }, [currentWordIndex, userInput, hasError, errorCharIndex, getWordPosition]);

  // Memoize visible words
  const visibleWords = useMemo(() => {
    return words.map((word, index) => {
      const position = getWordPosition(index);
      if (position < -3 || position > 3) return null;

      const isActive = index === currentWordIndex;
      const isPast = index < currentWordIndex;
      const isFuture = index > currentWordIndex;

      return (
        <div
          key={`word-${index}`}
          className={`word-item ${isActive ? 'active' : ''} ${isPast ? 'past' : ''} ${isFuture ? 'future' : ''}`}
          style={{
            transform: `translateX(${position * 350}px)`,
            scale: isActive ? 1.3 : 0.9,
            transition: 'transform 0.3s ease, scale 0.3s ease'
          }}
        >
          {renderWord(word, index)}
        </div>
      );
    }).filter(Boolean);
  }, [words, currentWordIndex, getWordPosition, renderWord]);

  return (
    <div className="word-display-container">
      <div className="words-track">{visibleWords}</div>
    </div>
  );
});

WordDisplay.displayName = 'WordDisplay';

export default WordDisplay;
