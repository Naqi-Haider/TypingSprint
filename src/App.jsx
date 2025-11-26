import './App.css';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GameEngine from './components/GameEngine';
import ParagraphEngine from './components/ParagraphEngine';
import HomePage from './components/HomePage';
import RippleCursor from './components/RippleCursor';
import TerminalLoader from './components/TerminalLoader';
import { AuthProvider, AuthModal } from './components/AuthSystem';

function App() {
  const [resetKey, setResetKey] = useState(0);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'loading', or 'game'
  const [gameMode, setGameMode] = useState(null); // 'speed-bullet' or 'paragraph'
  const [isLoading, setIsLoading] = useState(false);

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
    setResetKey(prev => prev + 1);
  };

  const handleStartGame = (mode) => {
    setGameMode(mode);
    setIsLoading(true);
    setCurrentView('loading');
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setCurrentView('game');
  };

  return (
    <AuthProvider>
      <AuthModal />
      <RippleCursor maxSize={30} duration={800} blur={true} />
      <div className="app">
        <Navbar onLogoClick={handleLogoClick} />
        <main className="main-content">
          {currentView === 'home' ? (
            <HomePage onStartGame={handleStartGame} />
          ) : currentView === 'loading' ? (
            <TerminalLoader onComplete={handleLoadingComplete} />
          ) : (
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
          )}
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
