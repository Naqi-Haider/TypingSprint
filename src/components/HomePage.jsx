import { useRef, useState } from 'react';
import './HomePage.css';
import TypewriterText from './TypewriterText';

const HomePage = ({ onStartGame }) => {
  const modesSectionRef = useRef(null);
  const [previewMode, setPreviewMode] = useState(null); // null, 'speed-bullet', or 'paragraph'

  const scrollToModes = () => {
    modesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePlayMode = (mode) => {
    onStartGame(mode); // Pass 'speed-bullet' or 'paragraph' to parent
  };

  const handlePreviewMode = (mode) => {
    setPreviewMode(previewMode === mode ? null : mode);
  };

  return (
    <div className="home-page">
      {/* Hero/Intro Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Ready to Sprint?</h1>
            <p className="hero-description">
              Type the words as fast as you can. You have 60 seconds!
            </p>
            <button className="cta-button" onClick={scrollToModes}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
              </svg>
              <span>Start Typing</span>
            </button>
          </div>

          <div className="hero-divider"></div>

          <div className="hero-image-container">
            <img
              src="/src/assets/typingKeyboard.gif"
              alt="Typing Animation"
              className="keyboard-gif"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Features</h2>
        <p className="features-description">
          Typing Sprint is a modern, fast-paced typing game designed to improve your typing speed and accuracy.
          With real-time feedback, character-level error detection, and a sleek terminal-inspired interface,
          you'll experience typing practice like never before. Track your Words Per Minute (WPM), monitor your
          mistakes, and watch as your skills improve with every session. The game features a 60-second sprint
          mode where every keystroke counts, penalties for errors to keep you sharp, <TypewriterText text="and a beautiful visual experience with smooth animations and responsive design" speed={80} deleteSpeed={40} pauseDuration={2000} /><span className="blinking-cursor">_</span>
        </p>
        <div className="section-divider"></div>
      </section>

      {/* Game Modes Section */}
      <section className="modes-section" ref={modesSectionRef}>
        <h2 className="section-title">Game Modes</h2>
        <div className="modes-container">
          {/* LEFT SIDE: Speed Bullet Mode Card OR Paragraph Preview */}
          {previewMode === 'paragraph' ? (
            <div className="preview-container">
              <div className="preview-header">
                <h3 className="preview-title">Paragraph Mode - Demo</h3>
              </div>
              <div className="preview-media">
                <div className="preview-placeholder">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="2" fill="var(--accent-primary)" />
                    <line x1="7" y1="8" x2="17" y2="8" stroke="var(--bg-primary)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="7" y1="12" x2="17" y2="12" stroke="var(--bg-primary)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="7" y1="16" x2="13" y2="16" stroke="var(--bg-primary)" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <p>Paragraph Mode Demo</p>
                  <span className="preview-note">Demo video will be placed here</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mode-card">
              <div className="mode-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <h3 className="mode-title">Speed Bullet Mode</h3>
              <p className="mode-description">
                Race against the clock in this intense 60-second challenge. Type as many words as you can
                with precision and speed. Every mistake costs you a second, so accuracy is key. Perfect for
                quick practice sessions and pushing your limits.
              </p>
              <div className="mode-buttons">
                <button className="mode-play-button" onClick={() => handlePlayMode('speed-bullet')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                  </svg>
                  <span>Play</span>
                </button>
                <button
                  className={`mode-preview-button ${previewMode === 'speed-bullet' ? 'active' : ''}`}
                  onClick={() => handlePreviewMode('speed-bullet')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  <span>{previewMode === 'speed-bullet' ? 'Close Preview' : 'Preview Mode'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="mode-divider"></div>

          {/* RIGHT SIDE: Paragraph Mode Card OR Speed Bullet Preview */}
          {previewMode === 'speed-bullet' ? (
            <div className="preview-container">
              <div className="preview-header">
                <h3 className="preview-title">Speed Bullet Mode - Demo</h3>
              </div>
              <div className="preview-media">
                <div className="preview-placeholder">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="5 3 19 12 5 21 5 3" fill="var(--accent-primary)" />
                  </svg>
                  <p>Speed Bullet Mode Demo</p>
                  <span className="preview-note">Demo video will be placed here</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mode-card">
              <div className="mode-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--accent-primary)" strokeWidth="2" fill="none" />
                  <line x1="7" y1="8" x2="17" y2="8" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="7" y1="12" x2="17" y2="12" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="7" y1="16" x2="13" y2="16" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="mode-title">Paragraph Mode</h3>
              <p className="mode-description">
                Type complete paragraphs with progressive difficulty. Start with 3-line paragraphs and advance to 6-line challenges.
                Features a 20-second timer with time bonuses for quick completion. Perfect for improving accuracy and building
                typing endurance with varied content.
              </p>
              <div className="mode-buttons">
                <button className="mode-play-button" onClick={() => handlePlayMode('paragraph')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                  </svg>
                  <span>Play</span>
                </button>
                <button
                  className={`mode-preview-button ${previewMode === 'paragraph' ? 'active' : ''}`}
                  onClick={() => handlePreviewMode('paragraph')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  <span>{previewMode === 'paragraph' ? 'Close Preview' : 'Preview Mode'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Multiplayer Section */}
      <section className="multiplayer-section">
        <div className="multiplayer-content">
          <div className="multiplayer-info">
            <h2 className="section-title">Multiplayer Mode</h2>
            <p className="multiplayer-description">
              Challenge your friends or compete with typists from around the world in real-time typing battles.
              Join multiplayer rooms, race head-to-head, and climb the global leaderboards. See how you stack up
              against the best typists and prove your speed and accuracy in competitive matches. Coming soon with
              live matchmaking, custom rooms, and tournament support.
            </p>
          </div>
          <button className="multiplayer-button">
            <span>Play Multiplayer</span>
            <span className="coming-soon">Coming Soon</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">© 2024 Typing Sprint. Built with passion for typing enthusiasts.</p>
          <div className="footer-links">
            <a href="#" className="footer-link">About</a>
            <span className="footer-separator">•</span>
            <a href="#" className="footer-link">Privacy</a>
            <span className="footer-separator">•</span>
            <a href="#" className="footer-link">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
