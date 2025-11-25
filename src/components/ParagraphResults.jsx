import { motion } from 'framer-motion';
import './ParagraphResults.css';

const ParagraphResults = ({
  successRate,
  errorsPerMinute,
  avgTimePerParagraph,
  paragraphsCompleted,
  totalErrors,
  totalCharacters,
  totalTime,
  onRestart,
  onGoHome
}) => {
  return (
    <motion.div
      className="paragraph-results-container"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="paragraph-results-card glass">
        <div className="results-header">
          <h1 className="results-title gradient-text">PARAGRAPH MODE COMPLETE</h1>
          <p className="results-subtitle">Here's your performance summary</p>
        </div>

        <div className="results-stats">
          <div className="stat-card glass">
            <svg className="stat-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="stat-content">
              <div className="stat-value gradient-text">{successRate}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>

          <div className="stat-card glass">
            <svg className="stat-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="stat-content">
              <div className="stat-value gradient-text">{errorsPerMinute}</div>
              <div className="stat-label">Errors Per Minute</div>
            </div>
          </div>

          <div className="stat-card glass">
            <svg className="stat-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
              <line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="7" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="stat-content">
              <div className="stat-value gradient-text">{paragraphsCompleted}</div>
              <div className="stat-label">Paragraphs Completed</div>
            </div>
          </div>

          <div className="stat-card glass">
            <svg className="stat-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="stat-content">
              <div className="stat-value gradient-text">{avgTimePerParagraph}s</div>
              <div className="stat-label">Avg Time/Paragraph</div>
            </div>
          </div>
        </div>

        <div className="additional-stats">
          <div className="additional-stat">
            <span className="stat-label-small">Total Characters:</span>
            <span className="stat-value-small">{totalCharacters}</span>
          </div>
          <div className="additional-stat">
            <span className="stat-label-small">Total Errors:</span>
            <span className="stat-value-small">{totalErrors}</span>
          </div>
          <div className="additional-stat">
            <span className="stat-label-small">Total Time:</span>
            <span className="stat-value-small">{totalTime}s</span>
          </div>
        </div>

        <div className="results-buttons">
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

          {onGoHome && (
            <button
              className="home-button glass"
              onClick={onGoHome}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Go to Home</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ParagraphResults;
