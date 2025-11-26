import { useState, useEffect } from 'react';
import './TerminalLoader.css';

// Custom hook for typing effect - runs sequence exactly once
const useTypingEffect = (sequence, onSequenceComplete, typingSpeed = 100, deletingSpeed = 50, pauseDuration = 1000) => {
  const [displayText, setDisplayText] = useState('');
  const [currentPhase, setCurrentPhase] = useState('typing'); // 'typing', 'deleting', or 'complete'
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);

  useEffect(() => {
    if (currentPhase === 'complete') return;

    const currentText = sequence[currentSequenceIndex];
    let timeout;

    if (currentPhase === 'typing') {
      // Typing phase
      if (displayText.length < currentText.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        }, typingSpeed);
      } else {
        // Finished typing current text
        // If this is the last item in sequence, we're done
        if (currentSequenceIndex === sequence.length - 1) {
          // Pause briefly, then trigger completion
          timeout = setTimeout(() => {
            setCurrentPhase('complete');
            if (onSequenceComplete) {
              onSequenceComplete();
            }
          }, pauseDuration);
        } else {
          // Not the last item, pause then start deleting
          timeout = setTimeout(() => {
            setCurrentPhase('deleting');
          }, pauseDuration);
        }
      }
    } else if (currentPhase === 'deleting') {
      // Deleting phase
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, deletingSpeed);
      } else {
        // Finished deleting, move to next sequence item
        const nextIndex = currentSequenceIndex + 1;
        setCurrentSequenceIndex(nextIndex);
        setCurrentPhase('typing');
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, currentPhase, currentSequenceIndex, sequence, typingSpeed, deletingSpeed, pauseDuration, onSequenceComplete]);

  return displayText;
};

const TerminalLoader = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const sequence = ['Initializing...', 'Ready Set Go...'];

  // Fade in on mount
  useEffect(() => {
    // Small delay to ensure CSS transition triggers
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle sequence completion
  const handleSequenceComplete = () => {
    // Start fade-out
    setIsFadingOut(true);
    setIsVisible(false);

    // Wait for fade-out animation to complete, then call onComplete
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 500); // Match CSS transition duration
  };

  const displayText = useTypingEffect(sequence, handleSequenceComplete, 100, 50, 1500);

  return (
    <div className={`terminal-loader ${isVisible ? 'visible' : ''} ${isFadingOut ? 'fading-out' : ''}`}>
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="terminal-button terminal-button-close"></span>
            <span className="terminal-button terminal-button-minimize"></span>
            <span className="terminal-button terminal-button-maximize"></span>
          </div>
          <div className="terminal-title">TYPING_SPRINT.EXE</div>
        </div>
        <div className="terminal-body">
          <div className="terminal-line">
            <span className="terminal-prompt">&gt;</span>
            <span className="terminal-text">{displayText}</span>
            <span className="terminal-cursor"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalLoader;
