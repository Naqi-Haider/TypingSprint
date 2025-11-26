import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

const AuthModal = () => {
  const { isFirstVisit, showAuthModal, setShowAuthModal, login, signup, continueAsGuest } = useAuth();
  const [mode, setMode] = useState('choice'); // 'choice', 'login', 'signup'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  // Scroll lock effect when modal is visible
  useEffect(() => {
    const isModalOpen = isFirstVisit || showAuthModal;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isFirstVisit, showAuthModal]);

  if (!isFirstVisit && !showAuthModal) return null;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    const result = login(formData.email, formData.password);
    if (!result.success) {
      setError('Login failed');
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const result = signup(formData.name, formData.email, formData.password);
    if (!result.success) {
      setError('Signup failed');
    }
  };

  const handleGuestContinue = () => {
    continueAsGuest();
    setShowAuthModal(false);
  };

  const modalContent = (
    <AnimatePresence>
      <motion.div
        className="auth-overlay-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="auth-modal glass"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          {mode === 'choice' && (
            <div className="auth-choice">
              <div className="auth-header">
                <h2 className="auth-title gradient-text">Welcome to Typing Sprint!</h2>
                <p className="auth-subtitle">Choose how you'd like to continue</p>
              </div>

              <div className="auth-buttons">
                <button
                  className="auth-btn guest-btn glass"
                  onClick={handleGuestContinue}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Continue as Guest</span>
                </button>

                <button
                  className="auth-btn login-btn"
                  onClick={() => setMode('login')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Login / Signup</span>
                </button>
              </div>

              <p className="auth-note">Guest mode: Your progress won't be saved</p>
            </div>
          )}

          {mode === 'login' && (
            <div className="auth-form-container">
              <div className="auth-header">
                <h2 className="auth-title gradient-text">Login</h2>
                <p className="auth-subtitle">Welcome back! Enter your credentials</p>
              </div>

              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-row">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="auth-input glass"
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="auth-input glass"
                    required
                  />
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button type="submit" className="auth-submit-btn">
                  Login
                </button>
              </form>

              <div className="auth-footer">
                <p>
                  Don't have an account?{' '}
                  <span className="auth-link" onClick={() => setMode('signup')}>
                    Sign up
                  </span>
                </p>
                <span className="auth-link" onClick={() => setMode('choice')}>
                  ← Back
                </span>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="auth-form-container">
              <div className="auth-header">
                <h2 className="auth-title gradient-text">Sign Up</h2>
                <p className="auth-subtitle">Create your account to track your progress</p>
              </div>

              <form onSubmit={handleSignup} className="auth-form">
                <div className="form-row">
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="auth-input glass"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="auth-input glass"
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password (6+ chars)"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="auth-input glass"
                    required
                  />
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button type="submit" className="auth-submit-btn">
                  Sign Up
                </button>
              </form>

              <div className="auth-footer">
                <p>
                  Already have an account?{' '}
                  <span className="auth-link" onClick={() => setMode('login')}>
                    Login
                  </span>
                </p>
                <span className="auth-link" onClick={() => setMode('choice')}>
                  ← Back
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default AuthModal;
