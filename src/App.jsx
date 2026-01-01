import './styles/App.css';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import GameEngine from './components/GameEngine';
import ParagraphEngine from './components/ParagraphEngine';
import HomePage from './components/HomePage';
import LobbyRoom from './components/LobbyRoom';
import TerminalLoader from './components/TerminalLoader';
import NotFound from './components/NotFound';
import GameModal from './components/GameModal';
import VerifyEmail from './components/VerifyEmail';
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
  const location = useLocation();
  const [resetKey, setResetKey] = useState(0);
  const [currentView, setCurrentView] = useState('home');
  const [gameMode, setGameMode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGameReady, setIsGameReady] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('retro');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

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
    // Check if user is in a lobby - show confirmation
    if (location.pathname.startsWith('/lobby/')) {
      setShowExitConfirm(true);
      return;
    }
    setCurrentView('home');
    setIsLoading(false);
    setIsGameReady(false);
    setResetKey(prev => prev + 1);
    navigate('/');
  }, [navigate, location.pathname]);

  const confirmExit = useCallback(() => {
    setShowExitConfirm(false);
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
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>

      {/* Lobby Exit Confirmation Modal */}
      <GameModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Leave Lobby?"
        message="Are you sure you want to leave? You will disconnect from the current game session."
        type="confirm"
        buttons={[
          {
            label: 'Stay',
            variant: 'secondary',
            onClick: () => setShowExitConfirm(false)
          },
          {
            label: 'Leave',
            variant: 'danger',
            onClick: confirmExit
          }
        ]}
      />
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
