import { motion, AnimatePresence } from 'framer-motion';
import './WordDisplay.css';

const WordDisplay = ({ words, currentWordIndex, userInput, hasError, shakeWord }) => {
  // Calculate positions - current word in center, past words to the left
  const getWordPosition = (index) => {
    const relativeIndex = index - currentWordIndex;
    return relativeIndex;
  };

  return (
    <div className="word-display-container">
      <div className="words-track">
        <AnimatePresence mode="popLayout">
          {words.map((word, index) => {
            const position = getWordPosition(index);
            const isActive = index === currentWordIndex;
            const isPast = index < currentWordIndex;
            const isFuture = index > currentWordIndex;

            // Don't render words too far in the past
            if (position < -2) return null;
            // Don't render words too far in the future
            if (position > 6) return null;

            return (
              <motion.div
                key={`word-${index}`}
                className={`word-item ${isActive ? 'active' : ''} ${isPast ? 'past' : ''} ${isFuture ? 'future' : ''} ${isActive && shakeWord ? 'shake' : ''}`}
                initial={false}
                animate={{
                  x: position * 250,
                  opacity: isPast ? 0.2 : isFuture ? 0.6 : 1,
                  scale: isActive ? 1.1 : 0.9
                }}
                exit={isPast ? { opacity: 0 } : false}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 25,
                  duration: 0.5
                }}
              >
                {isActive ? (
                  <div className="word-chars">
                    {word.split('').map((char, charIndex) => {
                      let className = 'char';

                      if (charIndex < userInput.length) {
                        if (userInput[charIndex] === char) {
                          className += ' correct';
                        } else {
                          className += ' incorrect';
                        }
                      } else if (charIndex === userInput.length) {
                        className += ' current';
                      }

                      return (
                        <span key={charIndex} className={className}>
                          {char}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="word-text">{word}</div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WordDisplay;
