import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import '../styles/Results.css';

// Format number with commas - outside component to avoid recreation
const formatScore = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const Results = memo(({
  wpm,
  accuracy,
  totalWords,
  mistakes,
  score = 0,
  bestScore = 0,
  isNewHighScore = false,
  onRestart,
  onGoHome,
  opponents = [],
  opponentProgress = {},
  isMultiplayer = false
}) => {
  // Memoize animation config
  const containerAnimation = useMemo(() => ({
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.4 }
  }), []);

  // Memoize formatted scores
  const formattedScore = useMemo(() => formatScore(score), [score]);
  const formattedBestScore = useMemo(() => formatScore(bestScore), [bestScore]);

  return (
    <motion.div className="results-container" {...containerAnimation}>
      <div className="results-card glass">
        <div className="results-header">
          <h1 className="results-title gradient-text">SPRINT COMPLETE</h1>
          <p className="results-subtitle">Here's your performance summary</p>
        </div>

        <div className="results-content">
          <div className="results-report">
            <div className="report-line">
              <span className="report-label">Words Per Minute</span>
              <span className="report-value">{wpm}</span>
            </div>
            <div className="report-divider"></div>
            <div className="report-line">
              <span className="report-label">Accuracy</span>
              <span className="report-value">{accuracy}%</span>
            </div>
            <div className="report-divider"></div>
            <div className="report-line">
              <span className="report-label">Words Typed</span>
              <span className="report-value">{totalWords}</span>
            </div>
            <div className="report-divider"></div>
            <div className="report-line">
              <span className="report-label">Mistakes</span>
              <span className="report-value mistakes">{mistakes}</span>
            </div>
            <div className="report-divider"></div>
            <div className={`report-line ${isNewHighScore ? 'highlight' : ''}`}>
              <span className="report-label">
                Score
                {isNewHighScore && <span className="new-record-badge">🏆 NEW!</span>}
              </span>
              <span className="report-value score">{formattedScore}</span>
            </div>
            {bestScore > 0 && (
              <>
                <div className="report-divider"></div>
                <div className="report-line best-score-line">
                  <span className="report-label">Best Score</span>
                  <span className="report-value best">{formattedBestScore}</span>
                </div>
              </>
            )}
          </div>

          <div className="results-vertical-divider"></div>

          <div className="results-buttons">
            <button className="restart-button glass" onClick={onRestart}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Play Again</span>
            </button>
            {onGoHome && (
              <button className="home-button glass" onClick={onGoHome}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Go to Home</span>
              </button>
            )}
          </div>
        </div>

        {isMultiplayer && opponents.length > 0 && (
          <div className="opponents-progress-section">
            <h3 className="opponents-progress-title">Opponent Progress</h3>
            {opponents.map((opponent) => {
              const progress = opponentProgress[opponent.id]?.progress || 0;
              return (
                <div key={opponent.id} className="opponent-progress-row">
                  <div className="opponent-avatar-small">
                    {opponent.avatarUrl ? (
                      <img src={opponent.avatarUrl} alt={opponent.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      opponent.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <div className="opponent-progress-info">
                    <span className="opponent-progress-name">{opponent.name}</span>
                    <div className="opponent-progress-bar-track">
                      <motion.div
                        className="opponent-progress-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  <span className="opponent-progress-percent">{Math.round(progress)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
});

Results.displayName = 'Results';

export default Results;
