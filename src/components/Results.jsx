import { motion } from 'framer-motion';
import './Results.css';

const Results = ({ wpm, accuracy, totalWords, correctWords, onRestart }) => {
  return (
    <motion.div
      className="results-container"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="results-card glass">
        <div className="results-header">
          <h1 className="results-title gradient-text">GAME OVER</h1>
          <p className="results-subtitle">Here's how you performed</p>
        </div>

        <div className="results-stats">
          <div className="stat-card glass">
            <svg className="stat-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="stat-content">
              <div className="stat-value gradient-text">{wpm}</div>
              <div className="stat-label">Words Per Minute</div>
            </div>
          </div>

          <div className="stat-card glass">
            <svg className="stat-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="stat-content">
              <div className="stat-value gradient-text">{accuracy}%</div>
              <div className="stat-label">Accuracy</div>
            </div>
          </div>

          <div className="stat-card glass">
            <svg className="stat-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" />
              <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" />
            </svg>
            <div className="stat-content">
              <div className="stat-value gradient-text">{correctWords}/{totalWords}</div>
              <div className="stat-label">Words Typed</div>
            </div>
          </div>
        </div>

        <button
          className="restart-button glass"
          onClick={onRestart}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Play Again</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Results;
