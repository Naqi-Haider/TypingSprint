import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ParagraphResults from './ParagraphResults';
import { getRandomParagraph, getNextDifficulty, DIFFICULTY_CONFIG } from '../data/ParagraphBank';
import './ParagraphEngine.css';

const BASE_TIME = 50; // 50 seconds base time per paragraph

// Combo levels based on streak (correct words in a row)
const COMBO_LEVELS = {
  START: { label: 'START', minStreak: 0, color: '#ffffff', glow: true },
  BAD: { label: 'BAD', minStreak: 1, color: '#888888', glow: false },
  NORMAL: { label: 'NORMAL', minStreak: 5, color: '#3498db', glow: false },
  GOOD: { label: 'GOOD', minStreak: 15, color: '#f39c12', glow: false },
  PERFECT: { label: 'PERFECT', minStreak: 30, color: '#e74c3c', glow: true }
};

const ParagraphEngine = ({ onGoHome, autoStart = false }) => {
  const [gameState, setGameState] = useState('idle');
  const [difficulty, setDifficulty] = useState('easy');
  const [currentParagraph, setCurrentParagraph] = useState('');
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(BASE_TIME);
  const [bonusTime, setBonusTime] = useState(0);
  const [showBonus, setShowBonus] = useState(false);
  const [paragraphsCompleted, setParagraphsCompleted] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [usedParagraphs, setUsedParagraphs] = useState([]);
  const [comboLevel, setComboLevel] = useState('START');
  const inputRef = useRef(null);

  const startGame = useCallback(() => {
    const firstParagraph = getRandomParagraph('easy', []);
    setCurrentParagraph(firstParagraph);
    setUserInput('');
    setTimeLeft(BASE_TIME);
    setBonusTime(0);
    setShowBonus(false);
    setParagraphsCompleted(0);
    setTotalErrors(0);
    setTotalCharacters(0);
    setCorrectStreak(0);
    setHasStartedTyping(false);
    setDifficulty('easy');
    setUsedParagraphs([firstParagraph]);
    setStartTime(Date.now());
    setComboLevel('START');
    setGameState('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (autoStart && gameState === 'idle') {
      startGame();
    }
  }, [autoStart, gameState, startGame]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('finished');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  // Update combo level based on correct streak
  useEffect(() => {
    // START only shows when user hasn't started typing
    if (!hasStartedTyping) {
      setComboLevel('START');
      return;
    }

    // Once typing starts, minimum is BAD
    if (correctStreak >= COMBO_LEVELS.PERFECT.minStreak) {
      setComboLevel('PERFECT');
    } else if (correctStreak >= COMBO_LEVELS.GOOD.minStreak) {
      setComboLevel('GOOD');
    } else if (correctStreak >= COMBO_LEVELS.NORMAL.minStreak) {
      setComboLevel('NORMAL');
    } else {
      setComboLevel('BAD');
    }
  }, [correctStreak, hasStartedTyping]);

  const handleParagraphComplete = useCallback(() => {
    const bonus = timeLeft;
    setBonusTime(bonus);
    setShowBonus(true);
    setTimeout(() => setShowBonus(false), 2000);

    const newCompletedCount = paragraphsCompleted + 1;
    setParagraphsCompleted(newCompletedCount);

    const nextDiff = getNextDifficulty(newCompletedCount);
    setDifficulty(nextDiff);

    const nextParagraph = getRandomParagraph(nextDiff, usedParagraphs);
    setCurrentParagraph(nextParagraph);
    setUsedParagraphs(prev => [...prev, nextParagraph]);

    setTimeLeft(BASE_TIME + bonus);
    setUserInput('');
    // DON'T reset streak - carry it to next paragraph
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [timeLeft, paragraphsCompleted, usedParagraphs]);

  const handleInputChange = (e) => {
    if (gameState !== 'playing') return;

    const input = e.target.value;
    const currentLength = input.length;

    // Mark that user has started typing
    if (!hasStartedTyping && currentLength > 0) {
      setHasStartedTyping(true);
    }

    if (currentLength > userInput.length) {
      setTotalCharacters(prev => prev + 1);

      const lastChar = input[currentLength - 1];
      const expectedChar = currentParagraph[currentLength - 1];

      if (lastChar !== expectedChar) {
        setTotalErrors(prev => prev + 1);
        setCorrectStreak(0); // Reset streak on error
      } else {
        // Check if we completed a word
        if (lastChar === ' ' || currentLength === currentParagraph.length) {
          // Get the last word typed
          const words = input.trim().split(/\s+/);
          const expectedWords = currentParagraph.substring(0, currentLength).trim().split(/\s+/);
          const lastWordIndex = words.length - 1;

          if (words[lastWordIndex] === expectedWords[lastWordIndex]) {
            setCorrectStreak(prev => prev + 1); // Increment streak for correct word
          } else {
            setCorrectStreak(0); // Reset streak on incorrect word
          }
        }
      }
    }

    setUserInput(input);

    if (input === currentParagraph) {
      handleParagraphComplete();
    }
  };

  const getCharClass = (index) => {
    if (index < userInput.length) {
      return userInput[index] === currentParagraph[index]
        ? 'char-correct'
        : 'char-incorrect';
    }
    if (index === userInput.length) {
      return 'char-current';
    }
    return 'char-pending';
  };

  const calculateStats = () => {
    const totalTime = startTime ? (Date.now() - startTime) / 1000 : 0;
    const successRate = totalCharacters > 0
      ? ((totalCharacters - totalErrors) / totalCharacters * 100).toFixed(1)
      : 0;
    const timeInMinutes = totalTime / 60;
    const errorsPerMinute = timeInMinutes > 0
      ? (totalErrors / timeInMinutes).toFixed(1)
      : 0;
    const avgTimePerParagraph = paragraphsCompleted > 0
      ? (totalTime / paragraphsCompleted).toFixed(1)
      : 0;

    return {
      successRate,
      errorsPerMinute,
      avgTimePerParagraph,
      totalCharacters,
      paragraphsCompleted,
      totalErrors,
      totalTime: totalTime.toFixed(1)
    };
  };

  return (
    <div className="paragraph-engine-container">
      <AnimatePresence mode="wait">
        {gameState === 'idle' && (
          <motion.div
            key="start"
            className="start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="gradient-text">Paragraph Mode</h1>
            <p>Type complete paragraphs with increasing difficulty</p>
            <button className="start-button glass" onClick={startGame}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
              </svg>
              <span>Start Typing</span>
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div
            key="playing"
            className="paragraph-game-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Header with Difficulty and Timer */}
            <div className="game-header">
              <div
                className="difficulty-badge"
                style={{ backgroundColor: DIFFICULTY_CONFIG[difficulty].color }}
              >
                {DIFFICULTY_CONFIG[difficulty].label}
              </div>

              <div className="timer-display">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className={timeLeft <= 5 ? 'timer-warning' : ''}>{timeLeft}s</span>
              </div>

              {showBonus && bonusTime > 0 && (
                <motion.div
                  className="bonus-indicator"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  +{bonusTime}s Bonus!
                </motion.div>
              )}
            </div>

            {/* Main Content */}
            <div className="game-content">
              {/* Left: Paragraph Display */}
              <div className="paragraph-section">
                <div className="paragraph-display">
                  {currentParagraph.split('').map((char, index) => (
                    <span key={index} className={getCharClass(index)}>
                      {char}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Combo Status */}
              <div className="combo-section">
                {/* Combo Display with Streak Counter */}
                <div className="combo-wrapper">
                  <motion.div
                    className={`combo-display ${COMBO_LEVELS[comboLevel].glow ? 'combo-glow' : ''}`}
                    key={comboLevel}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ color: COMBO_LEVELS[comboLevel].color }}
                  >
                    {COMBO_LEVELS[comboLevel].label}
                  </motion.div>

                  {/* Streak Counter */}
                  {hasStartedTyping && correctStreak > 0 && (
                    <motion.div
                      className="streak-counter"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{ color: COMBO_LEVELS[comboLevel].color }}
                    >
                      x{correctStreak}
                    </motion.div>
                  )}
                </div>

                {/* Horizontal divider */}
                <div className="combo-divider-horizontal"></div>

                {/* Stats with vertical divider */}
                <div className="combo-stats">
                  <div className="combo-stat">
                    <span className="stat-value">{paragraphsCompleted}</span>
                    <span className="stat-label">Paragraphs</span>
                  </div>

                  <div className="combo-divider-vertical"></div>

                  <div className="combo-stat">
                    <span className="stat-value">{totalErrors}</span>
                    <span className="stat-label">Mistakes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden Input */}
            <input
              ref={inputRef}
              type="text"
              className="hidden-input"
              value={userInput}
              onChange={handleInputChange}
              autoFocus
            />
          </motion.div>
        )}

        {gameState === 'finished' && (
          <ParagraphResults
            key="results"
            {...calculateStats()}
            onRestart={startGame}
            onGoHome={onGoHome}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ParagraphEngine;
