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

        {/* Horizontal Layout: Report Left, Buttons Right */}
        <div className="results-content">
          {/* Left: Performance Report */}
          <div className="results-report">
            <div className="report-line">
              <span className="report-label">Success Rate</span>
              <span className="report-value">{successRate}%</span>
            </div>

            <div className="report-divider"></div>

            <div className="report-line">
              <span className="report-label">Errors Per Minute</span>
              <span className="report-value">{errorsPerMinute}</span>
            </div>

            <div className="report-divider"></div>

            <div className="report-line">
              <span className="report-label">Paragraphs Completed</span>
              <span className="report-value">{paragraphsCompleted}</span>
            </div>

            <div className="report-divider"></div>

            <div className="report-line">
              <span className="report-label">Avg Time/Paragraph</span>
              <span className="report-value">{avgTimePerParagraph}s</span>
            </div>

            <div className="report-divider"></div>

            <div className="report-line">
              <span className="report-label">Total Characters</span>
              <span className="report-value">{totalCharacters}</span>
            </div>

            <div className="report-divider"></div>

            <div className="report-line">
              <span className="report-label">Total Errors</span>
              <span className="report-value">{totalErrors}</span>
            </div>

            <div className="report-divider"></div>

            <div className="report-line">
              <span className="report-label">Total Time</span>
              <span className="report-value">{totalTime}s</span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="results-vertical-divider"></div>

          {/* Right: Buttons */}
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
      </div>
    </motion.div>
  );
};

export default ParagraphResults;
