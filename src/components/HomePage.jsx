import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';
import TypewriterText from './TypewriterText';
import HeroTypewriter from './HeroTypewriter';
import sbPreview from '../assets/sb_preview.mp4';
import paraPreview from '../assets/para_preview.mp4';

const socket = io('http://localhost:5000');

// Theme-based GIF filters
const THEME_GIF_FILTERS = {
  'retro': 'sepia(1) hue-rotate(70deg) saturate(2) contrast(1.2)',
  'blue': 'hue-rotate(180deg) saturate(1.5)',
  'gold': 'sepia(1) hue-rotate(50deg) saturate(3)',
  'sunset': 'sepia(1) hue-rotate(-50deg) saturate(4)',
  'obsidian': 'grayscale(1) contrast(1.3)',
  'sakura': 'sepia(1) hue-rotate(290deg) saturate(2.5) contrast(1.1)',
  'paper': 'sepia(0.4) hue-rotate(140deg) saturate(0.8) contrast(1.1)'
};

const HomePage = ({ onStartGame, currentTheme = 'retro' }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const modesSectionRef = useRef(null);
  const multiplayerSectionRef = useRef(null);
  const contributeSectionRef = useRef(null);
  const [previewMode, setPreviewMode] = useState(null); // null, 'speed-bullet', or 'paragraph'

  // Multiplayer State
  const [activeModal, setActiveModal] = useState(null); // null, 'create', or 'join'
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

  // Optimized lobby config handlers to prevent input freezing
  const handleLobbyNameChange = useCallback((e) => {
    const value = e.target.value;
    setLobbyConfig(prev => ({ ...prev, username: value }));
  }, []);

  const handleLobbyPasswordChange = useCallback((e) => {
    const value = e.target.value;
    setLobbyConfig(prev => ({ ...prev, password: value }));
  }, []);

  const handleLobbyModeChange = useCallback((mode) => {
    setLobbyConfig(prev => ({ ...prev, mode }));
  }, []);

  const handleLobbyMaxPlayersChange = useCallback((maxPlayers) => {
    setLobbyConfig(prev => ({ ...prev, maxPlayers }));
  }, []);

  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [gameIdCopied, setGameIdCopied] = useState(false);

  // Task 2: Lobby search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Password modal state for protected lobbies
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [lobbyPassword, setLobbyPassword] = useState('');
  const [pendingLobbyId, setPendingLobbyId] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  const passwordInputRef = useRef(null);

  // Socket listeners for lobby search and creation
  useEffect(() => {
    socket.on('lobbies_found', (data) => {
      setSearchResults(data.lobbies);
      setIsSearching(false);
    });

    socket.on('search_error', (error) => {
      console.error('Search error:', error.message);
      setSearchResults([]);
      setIsSearching(false);
    });

    // Listen for lobby creation confirmation
    socket.on('lobby_created', ({ roomId }) => {
      setIsConnecting(false);
      setActiveModal(null);
      navigate(`/lobby/${roomId}`);
    });

    // Listen for lobby status check response
    socket.on('lobby_status', ({ roomId, protected: isProtected, exists, full }) => {
      if (!exists) {
        setIsConnecting(false);
        alert('Lobby not found');
        return;
      }
      if (full) {
        setIsConnecting(false);
        alert('Lobby is full');
        return;
      }
      if (isProtected) {
        // Show password modal
        setPendingLobbyId(roomId);
        setShowPasswordModal(true);
        setIsConnecting(false);
        setTimeout(() => passwordInputRef.current?.focus(), 100);
      } else {
        // No password needed, navigate directly
        setActiveModal(null);
        navigate(`/lobby/${roomId}`);
      }
    });

    // Listen for password validation result - includes session token
    socket.on('password_validated', ({ success, roomId, sessionToken, error }) => {
      if (success) {
        // Store session token for later use (e.g., rejoin)
        if (sessionToken) {
          sessionStorage.setItem(`lobby_session_${roomId}`, sessionToken);
        }
        // Immediately unmount modal and navigate
        setShowPasswordModal(false);
        setLobbyPassword('');
        setPendingLobbyId(null);
        setPasswordError('');
        setActiveModal(null);
        setIsConnecting(false);
        navigate(`/lobby/${roomId}`);
      } else {
        setPasswordError(error || 'Incorrect password');
        setIsConnecting(false);
      }
    });

    // Listen for lobby join success (after password validation)
    socket.on('lobby_join_success', ({ roomId, sessionToken }) => {
      // Store session token if provided
      if (sessionToken) {
        sessionStorage.setItem(`lobby_session_${roomId}`, sessionToken);
      }
      setIsConnecting(false);
      setActiveModal(null);
      setShowPasswordModal(false);
      navigate(`/lobby/${roomId}`);
    });

    socket.on('lobby_error', (error) => {
      console.error('Lobby error:', error.message);
      alert(error.message);
      setIsConnecting(false);
    });

    return () => {
      socket.off('lobbies_found');
      socket.off('search_error');
      socket.off('lobby_created');
      socket.off('lobby_status');
      socket.off('password_validated');
      socket.off('lobby_join_success');
      socket.off('lobby_error');
    };
  }, [navigate]);

  // Scroll animation observer
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15 // Trigger when 15% of element is visible
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe both sections
    if (multiplayerSectionRef.current) {
      observer.observe(multiplayerSectionRef.current);
    }
    if (contributeSectionRef.current) {
      observer.observe(contributeSectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scrollToModes = () => {
    modesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToMultiplayer = () => {
    multiplayerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    setActiveModal('create');
    setInviteLinkCopied(false);
    setGameIdCopied(false);
  };

  const handleQuickJoin = () => {
    setActiveModal('join');
    setJoinCode('');
    setJoinUrl('');
    setJoinMode('id');
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
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
    const trimmedName = lobbyConfig.username.trim();
    if (!trimmedName || trimmedName.length < 5) {
      alert('Room name must be at least 5 characters long');
      return;
    }
    setIsConnecting(true);

    // Get the saved theme
    const savedTheme = localStorage.getItem('selectedTheme') || 'retro';

    // Emit create_lobby event to server with all settings and user profile
    socket.emit('create_lobby', {
      roomId: generatedRoomId,
      lobbyName: lobbyConfig.username,
      mode: lobbyConfig.mode,
      maxPlayers: lobbyConfig.maxPlayers,
      password: lobbyConfig.password,
      // Send host user profile
      hostUser: {
        name: isLoggedIn && user?.name ? user.name : `Guest_${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        theme: savedTheme,
        avatarUrl: user?.avatar || null,
        stats: {
          wpm: user?.bestWPM || 0,
          accuracy: 95
        }
      }
    });
    // Navigation happens in lobby_created listener
  };

  // Extract room ID from URL
  const extractRoomIdFromUrl = (input) => {
    try {
      const trimmed = input.trim();
      // Check if it's a valid URL
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const urlObj = new URL(trimmed);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        // Get the last segment as the ID
        const lastSegment = pathParts[pathParts.length - 1];
        if (lastSegment && /^[A-Z0-9]{6}$/i.test(lastSegment)) {
          return lastSegment.toUpperCase();
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  // Parse and validate room ID from any input (ID or URL)
  const parseRoomId = (input) => {
    const trimmed = input.trim().toUpperCase();

    // Check if it's a direct 6-character alphanumeric ID
    if (/^[A-Z0-9]{6}$/.test(trimmed)) {
      return trimmed;
    }

    // Try to extract from URL
    return extractRoomIdFromUrl(input);
  };

  // Check if the current join code is valid
  const isValidJoinInput = () => {
    const trimmed = joinCode.trim();
    if (!trimmed) return false;
    return parseRoomId(trimmed) !== null;
  };

  const handleJoinRoom = () => {
    const trimmedInput = joinCode.trim();
    if (!trimmedInput) return;

    const roomId = parseRoomId(trimmedInput);

    if (!roomId) {
      alert('Invalid Room ID or URL format');
      return;
    }

    // Check lobby status first (password protected?)
    setIsConnecting(true);
    socket.emit('check_lobby_status', { roomId });
  };

  // Handle password submission for protected lobbies
  const handlePasswordSubmit = () => {
    if (!lobbyPassword.trim() || !pendingLobbyId) return;
    setIsConnecting(true);
    setPasswordError('');
    socket.emit('validate_lobby_password', {
      roomId: pendingLobbyId,
      password: lobbyPassword
    });
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setLobbyPassword('');
    setPendingLobbyId(null);
    setPasswordError('');
  };

  const handleJoinCodeChange = (value) => {
    // Allow raw input - parseRoomId will handle extraction
    // If it looks like a URL (has http/slashes), keep as-is
    // Otherwise, sanitize as room ID
    if (value.includes('http') || value.includes('/')) {
      setJoinCode(value);
    } else {
      // Direct ID input - only allow alphanumeric, uppercase, max 6 chars
      const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      setJoinCode(sanitized);
    }
  };

  // Task 2: Search lobbies by name
  const handleSearchLobbies = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    socket.emit('search_lobbies', { query: searchQuery });
  };

  // Dynamic search - debounced effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Debounce search by 300ms
    const timer = setTimeout(() => {
      setIsSearching(true);
      socket.emit('search_lobbies', { query: searchQuery });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleJoinSearchResult = (lobbyId) => {
    setIsConnecting(true);
    setActiveModal(null);
    navigate(`/lobby/${lobbyId}`);
  };

  const handleCloseModal = () => {
    if (!isConnecting) {
      setActiveModal(null);
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
              <button className="cta-button secondary" onClick={scrollToMultiplayer}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Play Multiplayer</span>
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
      <section className="multiplayer-section scroll-animate-left" ref={multiplayerSectionRef}>
        <h2 className="section-title multiplayer-heading">Multiplayer Modes</h2>
        <div className="multiplayer-split-container">
          {/* Paragraph Race - Full Width */}
          <div className="multiplayer-panel paragraph-race-panel full-width">
            <div className="panel-content">
              <div>
                <div className="panel-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="panel-title">PARAGRAPH RACE</h3>
                <p className="panel-description">
                  Race against friends to complete paragraphs first. The fastest and most accurate typist wins.
                  Perfect for competitive practice with real-time progress tracking.
                </p>
              </div>
              <div className="panel-buttons">
                <button className="panel-btn primary-btn" onClick={handleCreateLobby}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Create Lobby</span>
                </button>
                <button className="panel-btn secondary-btn" onClick={handleQuickJoin}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Quick Join</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub Contribution Section */}
      <section className="contribute-section scroll-animate-bottom" ref={contributeSectionRef}>
        <div className="contribute-content">
          <h2 className="contribute-title">Open Source & Community Driven</h2>
          <p className="contribute-description">
            TypingSprint is an open-source project built for the typing community.
            We welcome contributions, bug reports, and feature suggestions from developers and enthusiasts alike. Would love to see you contribute to this project.
          </p>
          <a
            href="https://github.com/Naqi-Haider/TypingSprint"
            target="_blank"
            rel="noopener noreferrer"
            className="contribute-button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span>Contribute on GitHub</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">© 2024 Typing Sprint. Built with passion for typing enthusiasts.</p>
        </div>
      </footer>

      {/* Create Lobby Modal */}
      {activeModal === 'create' && createPortal(
        <AnimatePresence>
          <motion.div
            className="lobby-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className="lobby-modal lobby-modal-compact"
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
                        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="lobby-modal-content-split">
                    {/* 2-Column Split Layout */}
                    <div className="lobby-split-grid">
                      {/* Left Column - Basic Info */}
                      <div className="lobby-split-col">
                        {/* Lobby Name Input */}
                        <div className="lobby-field">
                          <label className="lobby-label">Lobby Name <span className="required-star">*</span></label>
                          <input
                            type="text"
                            className="lobby-input lobby-input-compact"
                            placeholder="Min 5 characters"
                            value={lobbyConfig.username}
                            onChange={handleLobbyNameChange}
                            maxLength={20}
                            autoComplete="off"
                          />
                        </div>

                        {/* Password (Optional) */}
                        <div className="lobby-field">
                          <label className="lobby-label">Password <span className="optional-tag">(Optional)</span></label>
                          <input
                            type="password"
                            className="lobby-input lobby-input-compact"
                            placeholder="Leave empty for public"
                            value={lobbyConfig.password}
                            onChange={handleLobbyPasswordChange}
                            maxLength={20}
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      {/* Vertical Divider */}
                      <div className="lobby-divider"></div>

                      {/* Right Column - Game Settings */}
                      <div className="lobby-split-col">
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
                              onChange={(e) => setLobbyConfig({ ...lobbyConfig, maxPlayers: parseInt(e.target.value) })}
                            />
                            <div className="lobby-slider-marks">
                              <span>2</span>
                              <span>3</span>
                              <span>4</span>
                            </div>
                          </div>
                        </div>

                        {/* Game Mode Selection */}
                        <div className="lobby-field">
                          <label className="lobby-label">Game Mode</label>
                          <div className="lobby-toggle-group">
                            <button
                              type="button"
                              className={`lobby-toggle ${lobbyConfig.mode === 'random' ? 'active' : ''}`}
                              onClick={() => handleLobbyModeChange('random')}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                                <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                              </svg>
                              <span>Random</span>
                            </button>
                            <button
                              type="button"
                              className={`lobby-toggle ${lobbyConfig.mode === 'tier' ? 'active' : ''}`}
                              onClick={() => handleLobbyModeChange('tier')}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" />
                              </svg>
                              <span>Tier Mode</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lobby-modal-footer">
                    <button
                      className="lobby-generate-btn"
                      onClick={handleGenerateRoom}
                      disabled={!lobbyConfig.username.trim() || lobbyConfig.username.trim().length < 5}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Create Room</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Join Lobby Modal */}
      {activeModal === 'join' && createPortal(
        <AnimatePresence>
          <motion.div
            className="lobby-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className="lobby-modal"
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
                    <p className="connecting-label">Connecting...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="lobby-modal-header">
                    <h2 className="lobby-modal-title">JOIN LOBBY</h2>
                    <button className="lobby-close-btn" onClick={handleCloseModal}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="lobby-modal-content">
                    {/* Join Mode Tabs */}
                    <div className="join-mode-tabs">
                      <button
                        className={`join-tab ${joinMode === 'id' ? 'active' : ''}`}
                        onClick={() => { setJoinMode('id'); setSearchResults([]); }}
                        disabled={isConnecting}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>Search Lobbies</span>
                      </button>
                      <button
                        className={`join-tab ${joinMode === 'url' ? 'active' : ''}`}
                        onClick={() => { setJoinMode('url'); setSearchResults([]); }}
                        disabled={isConnecting}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                          <path d="M7 9h4M7 13h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>Direct ID</span>
                      </button>
                    </div>

                    {/* Input Field */}
                    <div className="lobby-field">
                      <label className="lobby-label">
                        {joinMode === 'id' ? 'Search by Lobby Name' : 'Enter Room ID (6 chars) or Paste URL'}
                      </label>
                      {joinMode === 'id' ? (
                        <>
                          <div className="search-input-group">
                            <input
                              type="text"
                              className="lobby-input"
                              placeholder="Type lobby name..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              disabled={isConnecting || isSearching}
                              onKeyDown={(e) => e.key === 'Enter' && handleSearchLobbies()}
                            />
                            <button
                              className="search-btn"
                              onClick={handleSearchLobbies}
                              disabled={!searchQuery.trim() || isSearching}
                            >
                              {isSearching ? (
                                <div className="search-spinner"></div>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                              )}
                              <span>Search</span>
                            </button>
                          </div>

                          {/* Search Results */}
                          {searchResults.length > 0 && (
                            <div className="search-results">
                              {searchResults.map((lobby) => (
                                <div
                                  key={lobby.id}
                                  className="search-result-item"
                                  onClick={() => handleJoinSearchResult(lobby.id)}
                                >
                                  <div className="result-info">
                                    <span className="result-name">{lobby.name}</span>
                                    <span className="result-details">{lobby.players}/{lobby.maxPlayers} Players • {lobby.mode === 'random' ? 'Random' : 'Tier Mode'}</span>
                                  </div>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              ))}
                            </div>
                          )}
                          {searchResults.length === 0 && searchQuery && !isSearching && (
                            <p className="no-results">No lobbies found matching "{searchQuery}"</p>
                          )}
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            className={`lobby-input ${joinCode && !isValidJoinInput() ? 'invalid' : ''}`}
                            placeholder="ABCDEF or https://example.com/lobby/ABCDEF"
                            value={joinCode}
                            onChange={(e) => handleJoinCodeChange(e.target.value)}
                            disabled={isConnecting}
                          />
                          {joinCode && !isValidJoinInput() && (
                            <p className="join-validation-hint">Enter a 6-character Room ID or valid lobby URL</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="lobby-modal-footer">
                    <button
                      className="lobby-generate-btn"
                      onClick={handleJoinRoom}
                      disabled={!isValidJoinInput()}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Connect</span>
                    </button>
                    {!isValidJoinInput() && (joinCode || joinUrl) && (
                      <p className="lobby-footer-hint">Enter a valid {joinMode === 'id' ? 'Room ID' : 'URL'} to connect</p>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Password Modal for Protected Lobbies */}
      {showPasswordModal && createPortal(
        <AnimatePresence>
          <motion.div
            className="lobby-modal-overlay password-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handlePasswordModalClose}
            style={{ zIndex: 10000 }}
          >
            <motion.div
              className="lobby-modal password-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lobby-modal-header">
                <h2 className="lobby-modal-title">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Password</span>
                </h2>
                <button className="lobby-close-btn" onClick={handlePasswordModalClose}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="lobby-modal-content">
                <p className="password-modal-text">This lobby is password protected. Enter the password to join.</p>
                <div className="lobby-field">
                  <label className="lobby-label">Password</label>
                  <input
                    ref={passwordInputRef}
                    type="password"
                    className={`lobby-input ${passwordError ? 'invalid' : ''}`}
                    placeholder="Enter lobby password"
                    value={lobbyPassword}
                    onChange={(e) => {
                      setLobbyPassword(e.target.value);
                      setPasswordError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    disabled={isConnecting}
                    autoFocus
                  />
                  {passwordError && (
                    <p className="join-validation-hint">{passwordError}</p>
                  )}
                </div>
              </div>

              <div className="lobby-modal-footer">
                <button
                  className="lobby-generate-btn"
                  onClick={handlePasswordSubmit}
                  disabled={!lobbyPassword.trim() || isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <div className="btn-spinner"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Join Lobby</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default HomePage;
