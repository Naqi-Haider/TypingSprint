import { useState, useEffect } from 'react';
import './TerminalLoader.css';

const TerminalLoader = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0: Ready, 1: Set, 2: Go
  const words = ['Ready', 'Set', 'Go'];

  useEffect(() => {
    // Cycle through steps every 1 second
    if (step < 2) {
      const timer = setTimeout(() => {
        setStep(step + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // After "Go" is shown, wait 1 second then call onComplete
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, onComplete]);

  return (
    <div className="terminal-loader">
      <div className="loader-text-container">
        <h1 className="loader-text" key={step}>
          {words[step]}
        </h1>
      </div>
    </div>
  );
};

export default TerminalLoader;
