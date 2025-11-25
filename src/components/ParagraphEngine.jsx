import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ParagraphResults from './ParagraphResults';
import { getRandomParagraph, getNextDifficulty, DIFFICULTY_CONFIG } from '../data/ParagraphBank';
import './ParagraphEngine.css';

const BASE_TIME = 20; // 20 seconds base time per paragraph

const ParagraphEngine = ({ onGoHome, autoStart = false }) => {
  const [gameState, setGameState] = useState('idle'); // idle, playing, finished
  const [difficulty, setDifficulty] = useState('easy');
  const [currentParagraph, setCurrentParagraph] = useState('');
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(BASE_TIME);
  const [bonusTime, setBonusTime] = useState(0);
  const [showBonus, setShowBonus] = useState(false);
  const [paragraphsCompleted, setParagraphsCompleted] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [usedParagraphs, setUsedParagraphs] = useState([]);
  const inputRef = useRef(null);

  // Start game
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
    setDifficulty('easy');
    setUsedParagraphs([firstParagraph]);
    setStartTime(Date.now());
    setGameState('playing');

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Auto-start if specified
  useEffect(() => {
    if (autoStart && gameState === 'idle') {
      startGame();
    }
  }, [autoStart, gameState, startGame]);

  // Timer effect
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

  // Handle paragraph completion
  const handleParagraphComplete = useCallback(() => {
    const bonus = timeLeft;
    setBonusTime(bonus);
    setShowBonus(true);

    // Hide bonus indicator after 2 seconds
    setTimeout(() => setShowBonus(false), 2000);

    const newCompletedCount = paragraphsCompleted + 1;
    setParagraphsCompleted(newCompletedCount);

    // Determine next difficulty
    const nextDiff = getNextDifficulty(newCompletedCount);
    setDifficulty(nextDiff);

    // Get next paragraph
    const nextParagraph = getRandomParagraph(nextDiff, usedParagraphs);
    setCurrentParagraph(nextParagraph);
    setUsedParagraphs(prev => [...prev, nextParagraph]);

    // Reset for next paragraph with bonus
    setTimeLeft(BASE_TIME + bonus);
    setUserInput('');

    // Refocus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [timeLeft, paragraphsCompleted, usedParagraphs]);

  // Handle input change
  const handleInputChange = (e) => {
    if (gameState !== 'playing') return;

    const input = e.target.value;
    const currentLength = input.length;

    // Track total characters typed
    if (currentLength > userInput.length) {
      setTotalCharacters(prev => prev + 1);

      // Check if character is correct
      const lastChar = input[currentLength - 1];
      const expectedChar = currentParagraph[currentLength - 1];

      if (lastChar !== expectedChar) {
        setTotalErrors(prev => prev + 1);
      }
    }

    setUserInput(input);

    // Check if paragraph is complete
    if (input === currentParagraph) {
      handleParagraphComplete();
    }
  };

  // Get character class for styling
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

  // Calculate stats for results
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

            <div className="paragraph-display">
              {currentParagraph.split('').map((char, index) => (
                <span key={index} className={getCharClass(index)}>
                  {char}
                </span>
              ))}
            </div>

            <input
              ref={inputRef}
              type="text"
              className="paragraph-input"
              value={userInput}
              onChange={handleInputChange}
              placeholder="Start typing..."
              autoFocus
            />

            <div className="stats-bar">
              <div className="stat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                  <line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="7" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Paragraphs: {paragraphsCompleted}</span>
              </div>

              <div className="stat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" />
                  <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Errors: {totalErrors}</span>
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
