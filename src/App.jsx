import './App.css';
import { useState } from 'react';
import Navbar from './components/Navbar';
import GameEngine from './components/GameEngine';

function App() {
  const [resetKey, setResetKey] = useState(0);
  const [bestWPM, setBestWPM] = useState(localStorage.getItem('bestWPM') || '--');

  const handleLogoClick = () => {
    // Force reset by changing key
    setResetKey(prev => prev + 1);
  };

  const handleBestWPMUpdate = (newBestWPM) => {
    setBestWPM(newBestWPM.toString());
  };

  return (
    <div className="app">
      <Navbar onLogoClick={handleLogoClick} bestWPM={bestWPM} />
      <main className="main-content">
        <GameEngine key={resetKey} onBestWPMUpdate={handleBestWPMUpdate} />
      </main>
    </div>
  );
}

export default App;
