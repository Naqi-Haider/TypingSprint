import './styles/App.css';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import GameEngine from './components/GameEngine';
import ParagraphEngine from './components/ParagraphEngine';
import HomePage from './components/HomePage';
import LobbyRoom from './components/LobbyRoom';
import TerminalLoader from './components/TerminalLoader';
import { AuthProvider, AuthModal } from './components/AuthSystem';

// Theme mapping - defined outside component to avoid recreation
const THEME_CLASSES = {
  'retro': '',
  'blue': 'theme-blue',
  'sakura': 'theme-sakura',
  'paper': 'theme-paper',
  'gold': 'theme-gold',
  'obsidian': 'theme-obsidian'
};

function AppContent() {
  const navigate = useNavigate();
  const [resetKey, setResetKey] = useState(0);
  const [currentView, setCurrentView] = useState('home');
  const [gameMode, setGameMode] = useState(null);
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

  // Mouse position tracking for gradient effects
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

  // Memoized event handlers
  const handleLogoClick = useCallback(() => {
    setCurrentView('home');
    setIsLoading(false);
    setIsGameReady(false);
    setResetKey(prev => prev + 1);
    navigate('/');
  }, [navigate]);

  const handleStartGame = useCallback((mode) => {
    setGameMode(mode);
    setIsLoading(true);
    setIsGameReady(false);
    setCurrentView('loading');
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
    setIsGameReady(true);
    setCurrentView('game');
  }, []);

  // Memoize theme class
  const themeClass = useMemo(() => THEME_CLASSES[currentTheme] || '', [currentTheme]);

  return (
    <div className={`app-wrapper ${themeClass}`}>
      <AuthModal />
      <div className="app">
        <Navbar onLogoClick={handleLogoClick} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              currentView === 'home' ? (
                <HomePage
                  onStartGame={handleStartGame}
                  currentTheme={currentTheme}
                />
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
              )
            } />
            <Route path="/lobby/:roomId" element={
              <LobbyRoom
                onLeave={handleLogoClick}
                currentTheme={currentTheme}
              />
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
