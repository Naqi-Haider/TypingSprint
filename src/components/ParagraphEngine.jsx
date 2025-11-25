import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ParagraphResults from './ParagraphResults';
import { getRandomParagraph, getNextDifficulty, DIFFICULTY_CONFIG } from '../data/ParagraphBank';
import './ParagraphEngine.css';

const BASE_TIME = 50;

// Combo thresholds based on correct words per minute
const COMBO_LEVELS = {
  START: { min: 0, max: 0, label: 'START', color: '#888' },
  NORMAL: { min: 1, max: 20, label: 'NORMAL', color: '#4e8c43' },
  GOOD: { min: 21, max: 40, label: 'GOOD', color: '#6ba85e' },
  PERFECT: { min: 41, max: 60, label: 'PERFECT', color: '#f39c12' },
  EXCELLENT: { min: 61, max: Infinity, label: 'EXCELLENT', color: '#e74c3c' }
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
  const [correctWords, setCorrectWords] = useState(0);
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
    setCorrectWords(0);
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

  // Calculate combo level based on correct words per minute
  useEffect(() => {
    if (gameState === 'playing' && startTime) {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      if (elapsedMinutes > 0) {
        const correctWPM = correctWords / elapsedMinutes;

        let newCombo = 'START';
        for (const [level, config] of Object.entries(COMBO_LEVELS)) {
          if (correctWPM >= config.min && correctWPM <= config.max) {
            newCombo = level;
            break;
          }
        }
        setComboLevel(newCombo);
      }
    }
  }, [correctWords, startTime, gameState]);

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
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [timeLeft, paragraphsCompleted, usedParagraphs]);

  const handleInputChange = (e) => {
    if (gameState !== 'playing') return;

    const input = e.target.value;
    const currentLength = input.length;

    if (currentLength > userInput.length) {
      setTotalCharacters(prev => prev + 1);

      const lastChar = input[currentLength - 1];
      const expectedChar = currentParagraph[currentLength - 1];

      if (lastChar !== expectedChar) {
        setTotalErrors(prev => prev + 1);
      }

      // Check for completed words (space or end of paragraph)
      if (lastChar === ' ' || input === currentParagraph) {
        const words = input.trim().split(/\s+/);
        const expectedWords = currentParagraph.substring(0, currentLength).trim().split(/\s+/);

        let correct = 0;
        for (let i = 0; i < words.length; i++) {
          if (words[i] === expectedWords[i]) {
            correct++;
          }
        }
        setCorrectWords(correct);
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
            className="paragraph-game-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Header */}
            <div className="paragraph-header">
              <div
                className="difficulty-badge"
                style={{ backgroundColor: DIFFICULTY_CONFIG[difficulty].color }}
              >
                {DIFFICULTY_CONFIG[difficulty].label}
              </div>

              <div className="timer-display">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <div className="paragraph-main-content">
              {/* Paragraph Display */}
              <div className="paragraph-display-section">
                <div className="paragraph-text">
                  {currentParagraph.split('').map((char, index) => (
                    <span key={index} className={getCharClass(index)}>
                      {char}
                    </span>
                  ))}
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

              {/* Combo Status */}
              <motion.div
                className="combo-status"
                key={comboLevel}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ color: COMBO_LEVELS[comboLevel].color }}
              >
                {COMBO_LEVELS[comboLevel].label}
              </motion.div>

              {/* Stats Bar */}
              <div className="stats-bar-compact">
                <div className="stat-compact">
                  <span className="stat-label-compact">Paragraphs:</span>
                  <span className="stat-value-compact">{paragraphsCompleted}</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-compact">
                  <span className="stat-label-compact">Mistakes:</span>
                  <span className="stat-value-compact">{totalErrors}</span>
                </div>
              </div>
            </div>
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
