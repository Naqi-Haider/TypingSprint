import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MultiplayerGame.css';

// Player theme colors
const PLAYER_THEMES = {
  green: { primary: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)' },
  blue: { primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)' },
  gold: { primary: '#eab308', glow: 'rgba(234, 179, 8, 0.5)' },
  sunset: { primary: '#f97316', glow: 'rgba(249, 115, 22, 0.5)' }
};

const MultiplayerGame = ({
  targetText = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
  timeLimit = 60,
  players = [],
  currentPlayer = null,
  onProgress,
  onComplete,
  onLeave
}) => {
  // Game States
  const [gamePhase, setGamePhase] = useState('countdown'); // 'countdown', 'playing', 'finished'
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  
  // Typing States
  const [typedText, setTypedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Refs
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const words = targetText.split(' ');

  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    if (!typedText) return 0;
    const wordsTyped = typedText.trim().split(' ').length;
    return Math.min((wordsTyped / words.length) * 100, 100);
  }, [typedText, words.length]);

  // Countdown effect
  useEffect(() => {
    if (gamePhase === 'countdown') {
      if (countdownNumber > 0) {
        const timer = setTimeout(() => {
          setCountdownNumber(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // Start the game
        setGamePhase('playing');
        startTimeRef.current = Date.now();
        inputRef.current?.focus();
      }
    }
  }, [gamePhase, countdownNumber]);

  // Game timer
  useEffect(() => {
    if (gamePhase === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setGamePhase('finished');
            clearInterval(timerRef.current);
            onComplete?.({
              progress: calculateProgress(),
              wpm: calculateWPM(),
              accuracy: calculateAccuracy(),
              time: timeLimit
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [gamePhase, timeLimit]);

  // Calculate WPM
  const calculateWPM = useCallback(() => {
    if (!startTimeRef.current) return 0;
    const elapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
    const wordsTyped = typedText.trim().split(' ').filter(w => w).length;
    return Math.round(wordsTyped / elapsedMinutes) || 0;
  }, [typedText]);

  // Calculate accuracy
  const calculateAccuracy = useCallback(() => {
    const totalChars = typedText.length;
    if (totalChars === 0) return 100;
    return Math.round(((totalChars - errors) / totalChars) * 100);
  }, [typedText, errors]);

  // Handle input change
  const handleInputChange = (e) => {
    if (gamePhase !== 'playing') return;

    const value = e.target.value;
    const targetUpToCursor = targetText.substring(0, value.length);
    
    // Check for errors
    let newErrors = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== targetText[i]) {
        newErrors++;
      }
    }
    setErrors(newErrors);
    setTypedText(value);

    // Update current word index
    const currentLength = value.length;
    let charCount = 0;
    for (let i = 0; i < words.length; i++) {
      charCount += words[i].length + 1; // +1 for space
      if (currentLength < charCount) {
        setCurrentWordIndex(i);
        break;
      }
    }

    // Emit progress
    const progress = (value.length / targetText.length) * 100;
    onProgress?.({ progress, wpm: calculateWPM() });

    // Check if completed
    if (value === targetText) {
      setGamePhase('finished');
      clearInterval(timerRef.current);
      onComplete?.({
        progress: 100,
        wpm: calculateWPM(),
        accuracy: calculateAccuracy(),
        time: timeLimit - timeRemaining
      });
    }
  };

  // Render text with highlighting
  const renderText = () => {
    let charIndex = 0;
    
    return words.map((word, wordIndex) => {
      const wordStart = charIndex;
      const wordEnd = charIndex + word.length;
      charIndex = wordEnd + 1; // +1 for space

      const isCurrentWord = wordIndex === currentWordIndex;
      const isPastWord = wordIndex < currentWordIndex;

      // Build character spans
      const chars = word.split('').map((char, i) => {
        const globalIndex = wordStart + i;
        let className = 'char';
        
        if (globalIndex < typedText.length) {
          className += typedText[globalIndex] === char ? ' correct' : ' incorrect';
        }
        
        return (
          <span key={i} className={className}>
            {char}
          </span>
        );
      });

      // Add space if not last word
      const space = wordIndex < words.length - 1 && (
        <span 
          key={`space-${wordIndex}`} 
          className={`char ${wordEnd < typedText.length ? (typedText[wordEnd] === ' ' ? 'correct' : 'incorrect') : ''}`}
        >
          {' '}
        </span>
      );

      return (
        <span 
          key={wordIndex} 
          className={`word ${isCurrentWord ? 'current' : ''} ${isPastWord ? 'past' : ''}`}
          style={isCurrentWord ? { 
            '--underline-color': PLAYER_THEMES[currentPlayer?.theme || 'green'].primary 
          } : {}}
        >
          {chars}
          {space}
        </span>
      );
    });
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="multiplayer-game">
      {/* Opponents Progress Section */}
      <div className="opponents-section">
        {players.filter(p => p.id !== currentPlayer?.id).map((player) => (
          <div 
            key={player.id} 
            className="opponent-bar"
            style={{ '--opponent-color': PLAYER_THEMES[player.theme]?.primary || PLAYER_THEMES.green.primary }}
          >
            <div className="opponent-info">
              <div className="opponent-avatar">
                {player.avatarUrl ? (
                  <img src={player.avatarUrl} alt={player.name} />
                ) : (
                  <span>{player.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="opponent-name">{player.name}</span>
              <span className="opponent-wpm">{player.wpm || 0} WPM</span>
            </div>
            <div className="opponent-progress-track">
              <motion.div 
                className="opponent-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${player.progress || 0}%` }}
                transition={{ duration: 0.5, ease: 'linear' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Main Game Area */}
      <div className="game-area">
        {/* Timer */}
        <div className={`game-timer ${timeRemaining <= 10 ? 'warning' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{formatTime(timeRemaining)}</span>
        </div>

        {/* Typing Area */}
        <div 
          className={`typing-area ${isInputFocused ? 'focused' : ''}`}
          onClick={() => inputRef.current?.focus()}
        >
          <div className="paragraph-display">
            {renderText()}
          </div>
          <input
            ref={inputRef}
            type="text"
            className="hidden-input"
            value={typedText}
            onChange={handleInputChange}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            disabled={gamePhase !== 'playing'}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>

        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">WPM</span>
            <span className="stat-value">{calculateWPM()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">{calculateAccuracy()}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Progress</span>
            <span className="stat-value">{Math.round(calculateProgress())}%</span>
          </div>
        </div>
      </div>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {gamePhase === 'countdown' && (
          <motion.div
            className="countdown-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="countdown-content"
              key={countdownNumber}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {countdownNumber > 0 ? (
                <>
                  <span className="countdown-label">
                    {countdownNumber === 3 ? 'Ready' : countdownNumber === 2 ? 'Set' : ''}
                  </span>
                  <span className="countdown-number">{countdownNumber}</span>
                </>
              ) : (
                <span className="countdown-go">GO!</span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gamePhase === 'finished' && (
          <motion.div
            className="gameover-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="gameover-content"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring' }}
            >
              <h2 className="gameover-title">Race Complete!</h2>
              <div className="gameover-stats">
                <div className="gameover-stat">
                  <span className="gameover-value">{calculateWPM()}</span>
                  <span className="gameover-label">WPM</span>
                </div>
                <div className="gameover-stat">
                  <span className="gameover-value">{calculateAccuracy()}%</span>
                  <span className="gameover-label">Accuracy</span>
                </div>
                <div className="gameover-stat">
                  <span className="gameover-value">{Math.round(calculateProgress())}%</span>
                  <span className="gameover-label">Completed</span>
                </div>
              </div>
              <button className="gameover-btn" onClick={onLeave}>
                Return to Lobby
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiplayerGame;
