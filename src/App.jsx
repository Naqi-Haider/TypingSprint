import './App.css';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GameEngine from './components/GameEngine';
import ParagraphEngine from './components/ParagraphEngine';
import HomePage from './components/HomePage';
import RippleCursor from './components/RippleCursor';
import TerminalLoader from './components/TerminalLoader';
import { AuthProvider, AuthModal } from './components/AuthSystem';

// Theme mapping
const THEME_CLASSES = {
  'retro': '',
  'blue': 'theme-blue',
  'sunset': 'theme-sunset',
  'gold': 'theme-gold',
  'obsidian': 'theme-obsidian'
};

function App() {
  const [resetKey, setResetKey] = useState(0);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'loading', or 'game'
  const [gameMode, setGameMode] = useState(null); // 'speed-bullet' or 'paragraph'
  const [isLoading, setIsLoading] = useState(false);
  const [isGameReady, setIsGameReady] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('retro');

  // Load and apply saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme') || 'retro';
    setCurrentTheme(savedTheme);
    const themeClass = THEME_CLASSES[savedTheme] || '';
    document.documentElement.className = themeClass;
  }, []);

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = (e) => {
      const newTheme = e.detail || 'retro';
      setCurrentTheme(newTheme);
      const themeClass = THEME_CLASSES[newTheme] || '';
      document.documentElement.className = themeClass;
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogoClick = () => {
    // Return to home page
    setCurrentView('home');
    setIsLoading(false);
    setIsGameReady(false);
    setResetKey(prev => prev + 1);
  };

  const handleStartGame = (mode) => {
    setGameMode(mode);
    setIsLoading(true);
    setIsGameReady(false);
    setCurrentView('loading');
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setIsGameReady(true);
    setCurrentView('game');
  };

  return (
    <AuthProvider>
      <div className={`app-wrapper ${THEME_CLASSES[currentTheme] || ''}`}>
        <AuthModal />
        <RippleCursor maxSize={30} duration={800} blur={true} />
        <div className="app">
          <Navbar onLogoClick={handleLogoClick} />
          <main className="main-content">
            {currentView === 'home' ? (
              <HomePage onStartGame={handleStartGame} currentTheme={currentTheme} />
            ) : currentView === 'loading' ? (
              <TerminalLoader onComplete={handleLoadingComplete} />
            ) : (
              isGameReady && (
                gameMode === 'speed-bullet' ? (
                  <GameEngine
                    key={resetKey}
                    onGoHome={handleLogoClick}
                    autoStart={true}
                  />
                ) : (
                  <ParagraphEngine
                    key={resetKey}
                    onGoHome={handleLogoClick}
                    autoStart={true}
                  />
                )
              )
            )}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
