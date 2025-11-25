import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import WordDisplay from './WordDisplay';
import Results from './Results';
import './GameEngine.css';

// Organized word bank by grammatical type
const WORD_TYPES = {
  prepositions: [
    'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around', 'before',
    'behind', 'below', 'beneath', 'beside', 'between', 'beyond', 'during', 'except',
    'inside', 'into', 'near', 'outside', 'over', 'through', 'toward', 'under', 'until',
    'upon', 'with', 'within', 'without'
  ],
  verbs: [
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
    'watch', 'wear', 'win', 'wish', 'wonder', 'work', 'worry', 'write'
  ],
  adjectives: [
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
  ]
};

const WORD_TYPE_KEYS = Object.keys(WORD_TYPES);

// Helper function to get word type
const getWordType = (word) => {
  for (const type of WORD_TYPE_KEYS) {
    if (WORD_TYPES[type].includes(word)) {
      return type;
    }
  }
  return null;
};

const GAME_DURATION = 60; // 60 seconds
const VISIBLE_WORDS = 8; // Increased lookahead - show more words

const GameEngine = ({ onBestWPMUpdate, onGoHome, autoStart = false }) => {
  const [gameState, setGameState] = useState('idle'); // idle, playing, finished
  const [words, setWords] = useState([]);
  const [wordTypes, setWordTypes] = useState([]); // Track word types for consecutive limit
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [totalWords, setTotalWords] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shakeWord, setShakeWord] = useState(false);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [incorrectCharacters, setIncorrectCharacters] = useState(0);
  const [showPenalty, setShowPenalty] = useState(false);
  const [errorCharIndex, setErrorCharIndex] = useState(-1);

  // Get random word with consecutive type limit (max 2 of same type)
  const getRandomWord = useCallback((usedWords = [], lastTwoTypes = []) => {
    // If last two words are same type, exclude that type
    let availableTypes = WORD_TYPE_KEYS;
    if (lastTwoTypes.length >= 2 && lastTwoTypes[0] === lastTwoTypes[1]) {
      availableTypes = WORD_TYPE_KEYS.filter(type => type !== lastTwoTypes[0]);
    }

    // Select random type from available types
    const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const typeWords = WORD_TYPES[selectedType];

    // Get words of that type that haven't been used recently
    const availableWords = typeWords.filter(word => !usedWords.includes(word));
    const wordPool = availableWords.length > 0 ? availableWords : typeWords;

    // Select random word from pool
    const selectedWord = wordPool[Math.floor(Math.random() * wordPool.length)];

    return { word: selectedWord, type: selectedType };
  }, []);

  // Generate initial unique words with type tracking
  const generateWords = useCallback(() => {
    const initialWords = [];
    const initialTypes = [];
    const usedWords = [];

    for (let i = 0; i < VISIBLE_WORDS + 10; i++) {
      const lastTwoTypes = initialTypes.slice(-2);
      const { word, type } = getRandomWord(usedWords, lastTwoTypes);
      initialWords.push(word);
      initialTypes.push(type);
      usedWords.push(word);
    }

    setWordTypes(initialTypes);
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
    setMistakes(0);
    setHasError(false);
    setErrorMessage('');
    setShakeWord(false);
    setTotalCharacters(0);
    setIncorrectCharacters(0);
  }, [generateWords]);

  // Auto-start effect
  useEffect(() => {
    if (autoStart && gameState === 'idle') {
      startGame();
    }
  }, [autoStart, gameState, startGame]);

  // Timer effect - isolated from game state changes for consistent timing
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

  // Handle game end and WPM update
  useEffect(() => {
    if (timeLeft === 0 && gameState === 'finished') {
      const currentWPM = Math.round(totalWords / (GAME_DURATION / 60));
      const bestWPM = parseInt(localStorage.getItem('bestWPM') || '0');
      if (currentWPM > bestWPM) {
        localStorage.setItem('bestWPM', currentWPM.toString());
        if (onBestWPMUpdate) {
          onBestWPMUpdate(currentWPM);
        }
      }
    }
  }, [timeLeft, gameState, totalWords, onBestWPMUpdate]);

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
          setTotalWords((prev) => prev + 1);
          setCurrentWordIndex((prev) => prev + 1);
          setUserInput('');
          setHasError(false);
          setErrorMessage('');
          setShakeWord(false);

          // Add new unique word to the end with type tracking
          setWords((prev) => {
            const usedWords = prev.slice(-20);
            const lastTwoTypes = wordTypes.slice(-2);
            const { word, type } = getRandomWord(usedWords, lastTwoTypes);
            setWordTypes(prevTypes => [...prevTypes, type]);
            return [...prev, word];
          });
        } else {
          // Mistake: incomplete word
          setMistakes((prev) => prev + 1);
          setShowPenalty(true);
          setTimeout(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1)); // 1 second penalty
            setShowPenalty(false);
          }, 100);
          setHasError(true);
          setShakeWord(true);
          setTimeout(() => {
            setHasError(false);
            setShakeWord(false);
          }, 500);
        }
      } else {
        // STRICT TYPING: Only allow the character if it matches the next expected character
        const nextCharIndex = userInput.length;
        const expectedChar = currentWord[nextCharIndex];

        if (e.key === expectedChar) {
          // Correct character - allow it
          setUserInput(userInput + e.key);
          setTotalCharacters((prev) => prev + 1);
          setHasError(false);
          setErrorCharIndex(-1);
          setShakeWord(false);
        } else {
          // Mistake: wrong character
          setMistakes((prev) => prev + 1);
          setShowPenalty(true);
          setTimeout(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1)); // 1 second penalty
            setShowPenalty(false);
          }, 100);
          setHasError(true);
          setErrorCharIndex(nextCharIndex);
          setIncorrectCharacters((prev) => prev + 1);
          setTotalCharacters((prev) => prev + 1);
          setTimeout(() => {
            setHasError(false);
            setErrorCharIndex(-1);
          }, 500);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, userInput, words, currentWordIndex, getRandomWord]);

  // Calculate WPM and accuracy
  const calculateStats = () => {
    const minutes = GAME_DURATION / 60;
    const wpm = Math.round(totalWords / minutes);
    const accuracy = totalCharacters > 0 ? Math.round(((totalCharacters - incorrectCharacters) / totalCharacters) * 100) : 100;
    return { wpm, accuracy };
  };

  // Get timer class based on time left
  const getTimerClass = () => {
    if (timeLeft <= 10) return 'danger';
    if (timeLeft <= 20) return 'warning';
    return '';
  };

  // Get visible words for display - show 3 words on each side
  const visibleWords = words.slice(
    Math.max(0, currentWordIndex - 3),
    currentWordIndex + 4  // Current word + 3 ahead
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
            <div className={`timer-display ${getTimerClass()} ${showPenalty ? 'penalty' : ''}`}>
              {timeLeft}s
              {showPenalty && <span className="penalty-indicator">-1</span>}
            </div>

            {/* Error Message Display - Removed, using character-level highlighting instead */}
            {/* {hasError && errorMessage && (
              <div className="error-prompt">
                <span className="error-icon">⚠</span>
                <span className="error-text">{errorMessage}</span>
              </div>
            )} */}

            <WordDisplay
              words={visibleWords}
              currentWordIndex={Math.min(3, currentWordIndex)}  // Adjust for the slice offset
              userInput={userInput}
              hasError={hasError}
              errorCharIndex={errorCharIndex}
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
                <span className="stat-label">Mistakes</span>
                <span className="stat-value">{mistakes}</span>
              </div>
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <Results
            key="results"
            {...calculateStats()}
            totalWords={totalWords}
            mistakes={mistakes}
            onRestart={startGame}
            onGoHome={onGoHome}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameEngine;
