import './App.css';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GameEngine from './components/GameEngine';
import HomePage from './components/HomePage';
import RippleCursor from './components/RippleCursor';

function App() {
  const [resetKey, setResetKey] = useState(0);
  const [bestWPM, setBestWPM] = useState(localStorage.getItem('bestWPM') || '--');
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'game'

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
    setResetKey(prev => prev + 1);
  };

  const handleStartGame = () => {
    setCurrentView('game');
  };

  const handleBestWPMUpdate = (newBestWPM) => {
    setBestWPM(newBestWPM.toString());
  };

  return (
    <>
      <RippleCursor maxSize={30} duration={800} blur={true} />
      <div className="app">
        <Navbar onLogoClick={handleLogoClick} bestWPM={bestWPM} />
        <main className="main-content">
          {currentView === 'home' ? (
            <HomePage onStartGame={handleStartGame} />
          ) : (
            <GameEngine key={resetKey} onBestWPMUpdate={handleBestWPMUpdate} autoStart={true} />
          )}
        </main>
      </div>
    </>
  );
}

export default App;
