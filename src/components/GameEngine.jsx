import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import WordDisplay from './WordDisplay';
import Results from './Results';
import './GameEngine.css';

// Expanded English word bank - common words for typing practice
const WORD_BANK = [
  // Common prepositions
  'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around', 'before',
  'behind', 'below', 'beneath', 'beside', 'between', 'beyond', 'during', 'except',
  'inside', 'into', 'near', 'outside', 'over', 'through', 'toward', 'under', 'until',
  'upon', 'with', 'within', 'without',

  // Common verbs
  'accept', 'achieve', 'allow', 'appear', 'apply', 'arrange', 'arrive', 'ask', 'attend',
  'avoid', 'become', 'begin', 'believe', 'belong', 'break', 'bring', 'build', 'call',
  'carry', 'catch', 'cause', 'change', 'choose', 'claim', 'clean', 'clear', 'climb',
  'close', 'collect', 'come', 'compare', 'complete', 'consider', 'contain', 'continue',
  'control', 'cook', 'copy', 'count', 'cover', 'create', 'cross', 'dance', 'decide',
  'deliver', 'depend', 'describe', 'design', 'destroy', 'develop', 'discover', 'discuss',
  'divide', 'draw', 'dream', 'drink', 'drive', 'drop', 'earn', 'eat', 'enable', 'encourage',
  'enjoy', 'enter', 'establish', 'examine', 'exist', 'expect', 'explain', 'express',
  'extend', 'face', 'fail', 'fall', 'feel', 'fight', 'fill', 'find', 'finish', 'follow',
  'force', 'forget', 'form', 'gain', 'gather', 'give', 'grow', 'guess', 'handle', 'hang',
  'happen', 'hate', 'have', 'hear', 'help', 'hide', 'hold', 'hope', 'hurry', 'identify',
  'imagine', 'improve', 'include', 'increase', 'indicate', 'influence', 'inform', 'intend',
  'introduce', 'invite', 'involve', 'join', 'jump', 'keep', 'kill', 'know', 'lack', 'land',
  'last', 'laugh', 'lead', 'learn', 'leave', 'lend', 'lie', 'lift', 'like', 'limit', 'listen',
  'live', 'look', 'lose', 'love', 'maintain', 'make', 'manage', 'mark', 'matter', 'mean',
  'measure', 'meet', 'mention', 'mind', 'miss', 'move', 'need', 'notice', 'obtain', 'occur',
  'offer', 'open', 'operate', 'order', 'organize', 'pass', 'pay', 'perform', 'pick', 'place',
  'plan', 'play', 'point', 'prepare', 'present', 'prevent', 'produce', 'promise', 'protect',
  'prove', 'provide', 'pull', 'push', 'put', 'raise', 'reach', 'read', 'realize', 'receive',
  'recognize', 'record', 'reduce', 'refer', 'reflect', 'refuse', 'regard', 'relate', 'release',
  'remain', 'remember', 'remove', 'repeat', 'replace', 'reply', 'report', 'represent', 'require',
  'rest', 'result', 'return', 'reveal', 'rise', 'run', 'save', 'say', 'search', 'seem', 'sell',
  'send', 'sense', 'serve', 'set', 'settle', 'share', 'shoot', 'show', 'shut', 'sing', 'sit',
  'sleep', 'slip', 'smile', 'solve', 'sort', 'sound', 'speak', 'spend', 'spread', 'stand',
  'start', 'state', 'stay', 'step', 'stick', 'stop', 'study', 'succeed', 'suffer', 'suggest',
  'suit', 'supply', 'support', 'suppose', 'survive', 'take', 'talk', 'teach', 'tell', 'tend',
  'test', 'thank', 'think', 'throw', 'touch', 'train', 'travel', 'treat', 'trust', 'try',
  'turn', 'understand', 'unite', 'use', 'visit', 'wait', 'walk', 'want', 'warn', 'wash',
  'watch', 'wear', 'win', 'wish', 'wonder', 'work', 'worry', 'write',

  // Common adjectives
  'able', 'active', 'actual', 'afraid', 'alive', 'alone', 'angry', 'aware', 'bad', 'basic',
  'beautiful', 'best', 'better', 'big', 'black', 'blue', 'brave', 'brief', 'bright', 'broad',
  'broken', 'busy', 'calm', 'capable', 'careful', 'certain', 'cheap', 'clean', 'clear', 'close',
  'cold', 'common', 'complete', 'complex', 'correct', 'crazy', 'critical', 'curious', 'current',
  'dangerous', 'dark', 'dead', 'deep', 'different', 'difficult', 'direct', 'dirty', 'double',
  'dry', 'early', 'easy', 'economic', 'effective', 'empty', 'entire', 'equal', 'essential',
  'even', 'exact', 'excellent', 'exciting', 'expensive', 'extra', 'fair', 'false', 'famous',
  'far', 'fast', 'fat', 'federal', 'few', 'final', 'fine', 'firm', 'first', 'flat', 'foreign',
  'formal', 'former', 'forward', 'free', 'fresh', 'friendly', 'front', 'full', 'funny', 'future',
  'general', 'glad', 'global', 'good', 'grand', 'great', 'green', 'gross', 'guilty', 'half',
  'happy', 'hard', 'healthy', 'heavy', 'high', 'historical', 'holy', 'honest', 'hot', 'huge',
  'human', 'ideal', 'ill', 'illegal', 'immediate', 'important', 'impossible', 'independent',
  'individual', 'industrial', 'initial', 'inner', 'intelligent', 'interesting', 'internal',
  'international', 'joint', 'just', 'key', 'kind', 'large', 'last', 'late', 'leading', 'least',
  'left', 'legal', 'less', 'level', 'light', 'likely', 'little', 'live', 'local', 'long', 'loose',
  'lost', 'loud', 'low', 'lucky', 'main', 'major', 'medical', 'mental', 'middle', 'military',
  'minor', 'modern', 'moral', 'narrow', 'national', 'native', 'natural', 'near', 'necessary',
  'negative', 'nervous', 'new', 'next', 'nice', 'normal', 'northern', 'obvious', 'odd', 'official',
  'old', 'only', 'open', 'opposite', 'ordinary', 'original', 'other', 'outside', 'overall', 'own',
  'particular', 'past', 'patient', 'perfect', 'permanent', 'personal', 'physical', 'plain', 'pleasant',
  'plenty', 'political', 'poor', 'popular', 'positive', 'possible', 'powerful', 'practical', 'present',
  'pretty', 'previous', 'primary', 'private', 'probable', 'professional', 'proper', 'proud', 'public',
  'pure', 'quick', 'quiet', 'rare', 'raw', 'ready', 'real', 'recent', 'red', 'regular', 'relative',
  'relevant', 'religious', 'remaining', 'remote', 'responsible', 'rich', 'right', 'rough', 'round',
  'royal', 'sad', 'safe', 'same', 'scientific', 'second', 'secret', 'secure', 'senior', 'separate',
  'serious', 'several', 'severe', 'sexual', 'sharp', 'short', 'sick', 'significant', 'silent',
  'similar', 'simple', 'single', 'slight', 'slow', 'small', 'smart', 'smooth', 'social', 'soft',
  'solid', 'sorry', 'southern', 'spare', 'special', 'specific', 'spiritual', 'standard', 'still',
  'straight', 'strange', 'strict', 'strong', 'stupid', 'subsequent', 'substantial', 'successful',
  'sudden', 'sufficient', 'suitable', 'super', 'sure', 'sweet', 'tall', 'technical', 'terrible',
  'thick', 'thin', 'third', 'tight', 'tiny', 'top', 'total', 'tough', 'traditional', 'true', 'typical',
  'ugly', 'unable', 'unfair', 'unhappy', 'unique', 'universal', 'unknown', 'unlikely', 'unusual',
  'upper', 'upset', 'urban', 'useful', 'usual', 'valuable', 'various', 'vast', 'violent', 'visible',
  'visual', 'vital', 'warm', 'weak', 'wealthy', 'weird', 'western', 'wet', 'white', 'whole', 'wide',
  'wild', 'willing', 'wise', 'wonderful', 'wooden', 'working', 'worth', 'wrong', 'yellow', 'young'
];

const GAME_DURATION = 60; // 60 seconds
const VISIBLE_WORDS = 8; // Increased lookahead - show more words

const GameEngine = ({ onBestWPMUpdate }) => {
  const [gameState, setGameState] = useState('idle'); // idle, playing, finished
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [totalWords, setTotalWords] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shakeWord, setShakeWord] = useState(false);

  // Get random unique word
  const getRandomWord = useCallback((usedWords = []) => {
    const availableWords = WORD_BANK.filter(word => !usedWords.includes(word));
    if (availableWords.length === 0) return WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    return availableWords[Math.floor(Math.random() * availableWords.length)];
  }, []);

  // Generate initial unique words
  const generateWords = useCallback(() => {
    const initialWords = [];
    const usedWords = [];
    for (let i = 0; i < VISIBLE_WORDS + 10; i++) {
      const word = getRandomWord(usedWords);
      initialWords.push(word);
      usedWords.push(word);
    }
    return initialWords;
  }, [getRandomWord]);

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setWords(generateWords());
    setCurrentWordIndex(0);
    setUserInput('');
    setTimeLeft(GAME_DURATION);
    setTotalWords(0);
    setCorrectWords(0);
    setHasError(false);
    setErrorMessage('');
    setShakeWord(false);
  }, [generateWords]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('finished');
      // Update best WPM
      const currentWPM = Math.round(correctWords / (GAME_DURATION / 60));
      const bestWPM = parseInt(localStorage.getItem('bestWPM') || '0');
      if (currentWPM > bestWPM) {
        localStorage.setItem('bestWPM', currentWPM.toString());
        // Notify parent to update navbar
        if (onBestWPMUpdate) {
          onBestWPMUpdate(currentWPM);
        }
      }
    }
  }, [gameState, timeLeft, correctWords, onBestWPMUpdate]);

  // Handle keyboard input
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyPress = (e) => {
      // Ignore special keys
      if (e.key.length > 1 && e.key !== 'Backspace' && e.key !== 'Enter') return;

      const currentWord = words[currentWordIndex];

      if (e.key === 'Backspace') {
        setUserInput((prev) => prev.slice(0, -1));
        setHasError(false);
        setErrorMessage('');
        setShakeWord(false);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();

        // Only allow moving to next word if current word is complete and correct
        if (userInput === currentWord) {
          setCorrectWords((prev) => prev + 1);
          setTotalWords((prev) => prev + 1);
          setCurrentWordIndex((prev) => prev + 1);
          setUserInput('');
          setHasError(false);
          setErrorMessage('');
          setShakeWord(false);

          // Add new unique word to the end
          setWords((prev) => {
            const usedWords = prev.slice(-20); // Check last 20 words for uniqueness
            return [...prev, getRandomWord(usedWords)];
          });
        } else {
          // Show error - word not complete or incorrect
          setHasError(true);
          setShakeWord(true);
          setErrorMessage('Complete the word correctly!');
          setTimeout(() => {
            setHasError(false);
            setErrorMessage('');
            setShakeWord(false);
          }, 1000);
        }
      } else {
        // STRICT TYPING: Only allow the character if it matches the next expected character
        const nextCharIndex = userInput.length;
        const expectedChar = currentWord[nextCharIndex];

        if (e.key === expectedChar) {
          // Correct character - allow it
          setUserInput(userInput + e.key);
          setHasError(false);
          setErrorMessage('');
          setShakeWord(false);
        } else {
          // Wrong character - block it and show error with shake
          setHasError(true);
          setShakeWord(true);
          setErrorMessage(`Wrong key! Expected: "${expectedChar}"`);
          setTimeout(() => {
            setHasError(false);
            setErrorMessage('');
            setShakeWord(false);
          }, 800);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, userInput, words, currentWordIndex, getRandomWord]);

  // Calculate WPM and accuracy
  const calculateStats = () => {
    const wpm = Math.round(correctWords / (GAME_DURATION / 60));
    const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
    return { wpm, accuracy };
  };

  // Get timer class based on time left
  const getTimerClass = () => {
    if (timeLeft <= 10) return 'danger';
    if (timeLeft <= 20) return 'warning';
    return '';
  };

  // Get visible words for display
  const visibleWords = words.slice(
    Math.max(0, currentWordIndex - 1),
    currentWordIndex + VISIBLE_WORDS
  );

  return (
    <div className="game-engine">
      <AnimatePresence mode="wait">
        {gameState === 'idle' && (
          <div className="start-screen" key="start">
            <div className="start-content glass">
              <h1 className="start-title gradient-text">Ready to Sprint?</h1>
              <p className="start-description">
                Type the words as fast as you can. You have 60 seconds!
              </p>
              <button className="start-button glass" onClick={startGame}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Start Game</span>
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="game-screen" key="game">
            <div className={`timer-display ${getTimerClass()}`}>
              {timeLeft}s
            </div>

            {/* Error Message Display */}
            {hasError && errorMessage && (
              <div className="error-prompt">
                <span className="error-icon">⚠</span>
                <span className="error-text">{errorMessage}</span>
              </div>
            )}

            <WordDisplay
              words={visibleWords}
              currentWordIndex={Math.min(1, currentWordIndex)}
              userInput={userInput}
              hasError={hasError}
              shakeWord={shakeWord}
            />

            <div className="input-display">
              {userInput || 'Start typing...'}
            </div>

            <div className="game-stats glass">
              <div className="stat">
                <span className="stat-label">Words</span>
                <span className="stat-value">{totalWords}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Correct</span>
                <span className="stat-value">{correctWords}</span>
              </div>
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <Results
            key="results"
            {...calculateStats()}
            totalWords={totalWords}
            correctWords={correctWords}
            onRestart={startGame}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameEngine;
