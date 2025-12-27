import './WordDisplay.css';

const WordDisplay = ({ words, currentWordIndex, userInput, hasError, errorCharIndex }) => {
  // Calculate positions - linear strip movement
  const getWordPosition = (index) => {
    const relativeIndex = index - currentWordIndex;
    return relativeIndex;
  };

  // Render word with character-by-character fade
  const renderWord = (word, index) => {
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
            // Active word character logic
            if (charIndex < userInput.length) {
              if (userInput[charIndex] === char) {
                className += ' correct';
              } else {
                className += ' incorrect';
                // Check if this is the error character that should shake
                if (charIndex === errorCharIndex && hasError) {
                  shouldShake = true;
                }
              }
            } else if (charIndex === userInput.length) {
              // Current character (cursor position)
              // If there's an error at this position, show it as error instead of current
              if (charIndex === errorCharIndex && hasError) {
                className += ' incorrect';
                shouldShake = true;
              } else {
                className += ' current';
              }
            }
          } else if (isPast) {
            // Fade past characters progressively
            const fadeDelay = charIndex * 0.02;
            className += ' past-char';
            return (
              <span
                key={charIndex}
                className={className}
                style={{
                  animationDelay: `${fadeDelay}s`,
                  opacity: 0.2
                }}
              >
                {char}
              </span>
            );
          } else if (isFuture) {
            // Fade future characters progressively
            const fadeDelay = charIndex * 0.02;
            className += ' future-char';
            return (
              <span
                key={charIndex}
                className={className}
                style={{
                  animationDelay: `${fadeDelay}s`,
                  opacity: 0.5
                }}
              >
                {char}
              </span>
            );
          }

          return (
            <span
              key={charIndex}
              className={`${className} ${shouldShake ? 'shake-char' : ''}`}
            >
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="word-display-container">
      <div className="words-track">
        {words.map((word, index) => {
          const position = getWordPosition(index);
          const isActive = index === currentWordIndex;
          const isPast = index < currentWordIndex;
          const isFuture = index > currentWordIndex;

          // Show 3 words on left, current word, and 3 words on right for balance
          if (position < -3) return null;
          if (position > 3) return null;

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
        })}
      </div>
    </div>
  );
};

export default WordDisplay;
