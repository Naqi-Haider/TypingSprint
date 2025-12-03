import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './HomePage.css';
import TypewriterText from './TypewriterText';
import HeroTypewriter from './HeroTypewriter';
import sbPreview from '../assets/sb_preview.mp4';
import paraPreview from '../assets/para_preview.mp4';

// Theme-based GIF filters
const THEME_GIF_FILTERS = {
  'retro': 'sepia(1) hue-rotate(70deg) saturate(2) brightness(0.8) contrast(1.2)',
  'blue': 'hue-rotate(180deg) brightness(1.2) saturate(1.5)',
  'gold': 'sepia(1) hue-rotate(50deg) saturate(3) brightness(1.1)',
  'sunset': 'sepia(1) hue-rotate(-50deg) saturate(4) brightness(1.1)',
  'obsidian': 'grayscale(1) brightness(1.1) contrast(1.3)'
};

const HomePage = ({ onStartGame, onJoinLobby, onCreateLobby, currentTheme = 'retro' }) => {
  const modesSectionRef = useRef(null);
  const [previewMode, setPreviewMode] = useState(null); // null, 'speed-bullet', or 'paragraph'
  
  // Multiplayer State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinMode, setJoinMode] = useState('id'); // 'id' or 'url'
  const [joinUrl, setJoinUrl] = useState('');
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [lobbyConfig, setLobbyConfig] = useState({
    username: '',
    mode: 'random', // 'random' or 'tier'
    maxPlayers: 2,
    password: ''
  });
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [gameIdCopied, setGameIdCopied] = useState(false);

  const scrollToModes = () => {
    modesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePlayMode = (mode) => {
    onStartGame(mode); // Pass 'speed-bullet' or 'paragraph' to parent
  };

  const handlePreviewMode = (mode) => {
    setPreviewMode(previewMode === mode ? null : mode);
  };

  // Multiplayer handlers
  const handleCreateLobby = () => {
    // Generate room ID when opening modal
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedRoomId(newRoomId);
    setShowCreateModal(true);
    setShowJoinInput(false);
    setInviteLinkCopied(false);
    setGameIdCopied(false);
  };

  const handleQuickJoin = () => {
    setShowJoinInput(true);
    setShowCreateModal(false);
    setJoinCode('');
    setJoinUrl('');
    setJoinMode('id');
  };

  // Generate invite link based on room ID
  const getInviteLink = () => {
    return `${window.location.origin}/lobby/${generatedRoomId}`;
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(getInviteLink());
    setInviteLinkCopied(true);
    setTimeout(() => setInviteLinkCopied(false), 2000);
  };

  const handleCopyGameId = () => {
    navigator.clipboard.writeText(generatedRoomId);
    setGameIdCopied(true);
    setTimeout(() => setGameIdCopied(false), 2000);
  };

  const handleGenerateRoom = () => {
    if (!lobbyConfig.username.trim()) return;
    setIsConnecting(true);
    // TODO: Connect to socket and create room
    console.log('Creating room with config:', { ...lobbyConfig, roomId: generatedRoomId });
    setTimeout(() => {
      setIsConnecting(false);
      setShowCreateModal(false);
      // Callback to parent to navigate to lobby
      if (onCreateLobby) {
        onCreateLobby({
          roomId: generatedRoomId,
          ...lobbyConfig
        });
      }
    }, 2000);
  };

  // Validate join URL and extract room ID
  const extractRoomIdFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const lobbyIndex = pathParts.indexOf('lobby');
      if (lobbyIndex !== -1 && pathParts[lobbyIndex + 1]) {
        return pathParts[lobbyIndex + 1].toUpperCase();
      }
      return null;
    } catch {
      return null;
    }
  };

  const isValidJoinInput = () => {
    if (joinMode === 'id') {
      // 6 character alphanumeric
      return /^[A-Z0-9]{6}$/.test(joinCode);
    } else {
      // Valid URL with room ID
      return extractRoomIdFromUrl(joinUrl) !== null;
    }
  };

  const handleJoinRoom = () => {
    if (!isValidJoinInput()) return;
    
    setIsConnecting(true);
    const roomId = joinMode === 'id' ? joinCode : extractRoomIdFromUrl(joinUrl);
    
    // TODO: Connect to socket and join room
    console.log('Joining room:', roomId);
    setTimeout(() => {
      setIsConnecting(false);
      setShowJoinInput(false);
      // Callback to parent to navigate to lobby
      if (onJoinLobby) {
        onJoinLobby(roomId);
      }
    }, 2000);
  };

  const handleJoinCodeChange = (value) => {
    // Only allow alphanumeric, uppercase, max 6 chars
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setJoinCode(sanitized);
  };

  const handleCloseModal = () => {
    if (!isConnecting) {
      setShowCreateModal(false);
      setShowJoinInput(false);
    }
  };

  // Get filter for current theme
  const gifFilter = THEME_GIF_FILTERS[currentTheme] || THEME_GIF_FILTERS['retro'];

  return (
    <div className="home-page">
      {/* Hero/Intro Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Ready to Sprint?</h1>
            <div className="hero-typewriter-container">
              <HeroTypewriter
                strings={[
                  'Dominate the 60-second Speed-Bullet Challenge.',
                  'Climb the Difficulty Tiers in Paragraph Mode.',
                  'Build Perfect Streaks and Ignite Your Combo Meter.',
                  'Test your WPM against the clock.'
                ]}
                typingSpeed={50}
                deletingSpeed={30}
                pauseDuration={1500}
              />
            </div>
            <div className="hero-cta-wrapper">
              <button className="cta-button" onClick={scrollToModes}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>
                <span>Start Typing</span>
              </button>
            </div>
          </div>

          <div className="hero-divider"></div>

          <div className="hero-image-container">
            <img
              src="/src/assets/typingKeyboard.gif"
              alt="Typing Animation"
              className="keyboard-gif"
              style={{ filter: gifFilter }}
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
                <video
                  className="w-full h-full object-cover"
                  src={paraPreview}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
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
                <video
                  className="w-full h-full object-cover"
                  src={sbPreview}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
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

      {/* Multiplayer Section - Split Screen Hero */}
      <section className="multiplayer-section">
        <h2 className="section-title multiplayer-heading">Multiplayer Modes</h2>
        <div className="multiplayer-split-container">
          {/* Left Section - Paragraph Race */}
          <div className="multiplayer-panel paragraph-race-panel">
            <div className="panel-content">
              <div className="panel-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="panel-title">PARAGRAPH RACE</h3>
              <p className="panel-description">
                Race against friends to complete paragraphs first. The fastest and most accurate typist wins. 
                Perfect for competitive practice with real-time progress tracking.
              </p>
              <div className="panel-buttons">
                {!showJoinInput ? (
                  <>
                    <button className="panel-btn primary-btn" onClick={handleCreateLobby}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>Create Lobby</span>
                    </button>
                    <button className="panel-btn secondary-btn" onClick={handleQuickJoin}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>Quick Join</span>
                    </button>
                  </>
                ) : (
                  <div className="join-input-container">
                    {/* Join Mode Tabs */}
                    <div className="join-mode-tabs">
                      <button 
                        className={`join-tab ${joinMode === 'id' ? 'active' : ''}`}
                        onClick={() => setJoinMode('id')}
                        disabled={isConnecting}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M7 9h4M7 13h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span>Join by ID</span>
                      </button>
                      <button 
                        className={`join-tab ${joinMode === 'url' ? 'active' : ''}`}
                        onClick={() => setJoinMode('url')}
                        disabled={isConnecting}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span>Join by URL</span>
                      </button>
                    </div>

                    <div className="join-input-group">
                      {joinMode === 'id' ? (
                        <input
                          type="text"
                          className={`join-code-input ${joinCode && !isValidJoinInput() ? 'invalid' : ''}`}
                          placeholder="ABCDEF"
                          value={joinCode}
                          onChange={(e) => handleJoinCodeChange(e.target.value)}
                          maxLength={6}
                          disabled={isConnecting}
                        />
                      ) : (
                        <input
                          type="url"
                          className={`join-code-input join-url-input ${joinUrl && !isValidJoinInput() ? 'invalid' : ''}`}
                          placeholder="https://example.com/lobby/ABCDEF"
                          value={joinUrl}
                          onChange={(e) => setJoinUrl(e.target.value)}
                          disabled={isConnecting}
                        />
                      )}
                      <button 
                        className="panel-btn primary-btn connect-btn" 
                        onClick={handleJoinRoom}
                        disabled={isConnecting || !isValidJoinInput()}
                      >
                        {isConnecting ? (
                          <span className="connecting-text">Connecting...</span>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Connect</span>
                          </>
                        )}
                      </button>
                      <button className="panel-btn cancel-btn" onClick={() => setShowJoinInput(false)} disabled={isConnecting}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {joinMode === 'id' && joinCode && !isValidJoinInput() && (
                      <p className="join-validation-hint">Room ID must be 6 characters (A-Z, 0-9)</p>
                    )}
                    {joinMode === 'url' && joinUrl && !isValidJoinInput() && (
                      <p className="join-validation-hint">Invalid URL or missing room ID in path</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center Divider */}
          <div className="multiplayer-divider">
            <span className="divider-text">VS</span>
          </div>

          {/* Right Section - Debuff Mode */}
          <div className="multiplayer-panel debuff-mode-panel">
            <div className="panel-content">
              <div className="panel-icon danger">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="panel-title danger">DEBUFF MODE</h3>
              <p className="panel-description">
                Chaos unleashed! Apply debuffs to opponents - scrambled letters, reversed text, hidden words. 
                Survive the madness and emerge victorious in this intense battle mode.
              </p>
              <div className="panel-buttons">
                <button className="panel-btn danger-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Create Chaos</span>
                </button>
                <button className="panel-btn danger-outline-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Join Chaos</span>
                </button>
              </div>
            </div>
            <div className="coming-soon-badge">Coming Soon</div>
          </div>
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

      {/* Create Lobby Modal */}
      {showCreateModal && createPortal(
        <AnimatePresence>
          <motion.div
            className="lobby-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className="lobby-modal lobby-modal-wide"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              {isConnecting ? (
                <div className="lobby-connecting">
                  <div className="connecting-animation">
                    <div className="connecting-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <p className="connecting-label">Creating Room...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="lobby-modal-header">
                    <h2 className="lobby-modal-title">CREATE LOBBY</h2>
                    <button className="lobby-close-btn" onClick={handleCloseModal}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>

                  <div className="lobby-modal-content lobby-modal-grid">
                    {/* Left Column - Room Settings */}
                    <div className="lobby-column">
                      <h3 className="lobby-column-title">Room Settings</h3>
                      
                      {/* Username Input */}
                      <div className="lobby-field">
                        <label className="lobby-label">Username <span className="required-star">*</span></label>
                        <input
                          type="text"
                          className="lobby-input"
                          placeholder="Enter your name"
                          value={lobbyConfig.username}
                          onChange={(e) => setLobbyConfig({...lobbyConfig, username: e.target.value})}
                          maxLength={15}
                        />
                      </div>

                      {/* Game Mode Toggle */}
                      <div className="lobby-field">
                        <label className="lobby-label">Game Mode</label>
                        <div className="lobby-toggle-group">
                          <button
                            className={`lobby-toggle ${lobbyConfig.mode === 'random' ? 'active' : ''}`}
                            onClick={() => setLobbyConfig({...lobbyConfig, mode: 'random'})}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                              <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                              <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                              <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            <span>Random</span>
                          </button>
                          <button
                            className={`lobby-toggle ${lobbyConfig.mode === 'tier' ? 'active' : ''}`}
                            onClick={() => setLobbyConfig({...lobbyConfig, mode: 'tier'})}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Tier Mode</span>
                          </button>
                        </div>
                      </div>

                      {/* Max Players Slider */}
                      <div className="lobby-field">
                        <label className="lobby-label">
                          Max Players: <span className="lobby-value">{lobbyConfig.maxPlayers}</span>
                        </label>
                        <div className="lobby-slider-container">
                          <input
                            type="range"
                            className="lobby-slider"
                            min="2"
                            max="4"
                            value={lobbyConfig.maxPlayers}
                            onChange={(e) => setLobbyConfig({...lobbyConfig, maxPlayers: parseInt(e.target.value)})}
                          />
                          <div className="lobby-slider-marks">
                            <span>2</span>
                            <span>3</span>
                            <span>4</span>
                          </div>
                        </div>
                      </div>

                      {/* Password (Optional) */}
                      <div className="lobby-field">
                        <label className="lobby-label">Password <span className="optional-tag">(Optional)</span></label>
                        <input
                          type="password"
                          className="lobby-input"
                          placeholder="Leave empty for public room"
                          value={lobbyConfig.password}
                          onChange={(e) => setLobbyConfig({...lobbyConfig, password: e.target.value})}
                          maxLength={20}
                        />
                      </div>
                    </div>

                    {/* Right Column - Room Info */}
                    <div className="lobby-column lobby-column-info">
                      <h3 className="lobby-column-title">Room Info</h3>
                      
                      {/* Game ID Display */}
                      <div className="lobby-field">
                        <label className="lobby-label">Game ID</label>
                        <div className="lobby-copyable-field">
                          <input
                            type="text"
                            className="lobby-input lobby-input-readonly"
                            value={generatedRoomId}
                            readOnly
                          />
                          <button 
                            className="lobby-copy-btn"
                            onClick={handleCopyGameId}
                            title="Copy Game ID"
                          >
                            {gameIdCopied ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Invite Link Display */}
                      <div className="lobby-field">
                        <label className="lobby-label">Invite Link</label>
                        <div className="lobby-copyable-field">
                          <input
                            type="text"
                            className="lobby-input lobby-input-readonly lobby-input-url"
                            value={getInviteLink()}
                            readOnly
                          />
                          <button 
                            className="lobby-copy-btn"
                            onClick={handleCopyInviteLink}
                            title="Copy Invite Link"
                          >
                            {inviteLinkCopied ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            )}
                          </button>
                        </div>
                        <p className="lobby-field-hint">Share this link with friends to join your game</p>
                      </div>

                      {/* Room Preview */}
                      <div className="lobby-room-preview">
                        <div className="lobby-preview-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                            <path d="M20 21a8 8 0 10-16 0" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{lobbyConfig.maxPlayers} Players Max</span>
                        </div>
                        <div className="lobby-preview-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {lobbyConfig.mode === 'random' ? (
                              <>
                                <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                                <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                              </>
                            ) : (
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2"/>
                            )}
                          </svg>
                          <span>{lobbyConfig.mode === 'random' ? 'Random Mode' : 'Tier Mode'}</span>
                        </div>
                        <div className="lobby-preview-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {lobbyConfig.password ? (
                              <path d="M17 11V7a5 5 0 00-10 0v4M5 11h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z" stroke="currentColor" strokeWidth="2"/>
                            ) : (
                              <path d="M17 11V7a5 5 0 00-9.9-1M3 11h18a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2v-7a2 2 0 012-2z" stroke="currentColor" strokeWidth="2"/>
                            )}
                          </svg>
                          <span>{lobbyConfig.password ? 'Private Room' : 'Public Room'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lobby-modal-footer">
                    <button 
                      className="lobby-generate-btn"
                      onClick={handleGenerateRoom}
                      disabled={!lobbyConfig.username.trim()}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Create Room</span>
                    </button>
                    {!lobbyConfig.username.trim() && (
                      <p className="lobby-footer-hint">Enter a username to create the room</p>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default HomePage;
