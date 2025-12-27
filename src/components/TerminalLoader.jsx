import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TerminalLoader.css';

const TerminalLoader = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0); // 0: Ready, 1: Set, 2: Go!, 3: Done
  const [isExiting, setIsExiting] = useState(false);
  const words = ['Ready', 'Set', 'Go!'];

  useEffect(() => {
    // Prevent body scrolling when loader is active
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (currentStep < 3) {
      // Each word: slide in (0.4s) + pause (0.6s) + slide out (0.4s) = 1.4s total
      const timer = setTimeout(() => {
        setIsExiting(true);

        // Wait for exit animation then move to next step
        setTimeout(() => {
          setIsExiting(false);
          setCurrentStep(prev => prev + 1);
        }, 400); // Exit animation duration
      }, 1000); // Display duration (slide-in + pause)

      return () => clearTimeout(timer);
    } else {
      // All words shown, call onComplete
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentStep, onComplete]);

  // Animation variants for slide in/out from bottom
  const textVariants = {
    initial: {
      y: 100,
      opacity: 0
    },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        duration: 0.4
      }
    },
    exit: {
      y: -100,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: 'easeIn'
      }
    }
  };

  return (
    <div className="terminal-loader">
      <div className="loader-text-container">
        <AnimatePresence mode="wait">
          {currentStep < 3 && !isExiting && (
            <motion.h1
              key={currentStep}
              className="loader-text"
              variants={textVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {words[currentStep]}
            </motion.h1>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TerminalLoader;
