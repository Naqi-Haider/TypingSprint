import { useState, useEffect, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/TerminalLoader.css';

const TerminalLoader = memo(({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const words = useMemo(() => ['Ready', 'Set', 'Go!'], []);

  // Animation variants
  const textVariants = useMemo(() => ({
    initial: { y: 100, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 25, duration: 0.4 }
    },
    exit: { y: -100, opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }
  }), []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (currentStep < 3) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsExiting(false);
          setCurrentStep(prev => prev + 1);
        }, 400);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      onComplete?.();
    }
  }, [currentStep, onComplete]);

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
});

TerminalLoader.displayName = 'TerminalLoader';

export default TerminalLoader;
