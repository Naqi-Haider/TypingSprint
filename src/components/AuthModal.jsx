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
              {/* Left Column - Guest */}
              <div className="auth-guest-column">
                <svg className="guest-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 className="guest-title">Quick Play</h3>
                <p className="guest-subtitle">Jump straight into the action. No account needed.</p>
                <button className="guest-btn" onClick={handleGuestContinue}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                  </svg>
                  <span>Play Now</span>
                </button>
              </div>

              {/* Center Divider */}
              <div className="auth-or-divider">
                <span className="or-circle">OR</span>
              </div>

              {/* Right Column - Login */}
              <div className="auth-login-column">
                <div className="login-header">
                  <h3 className="login-title">Sign In</h3>
                  <p className="login-subtitle">Track your progress & compete</p>
                </div>
                <form onSubmit={handleLogin} className="auth-mini-form">
                  <div className="floating-input-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="floating-input"
                    />
                  </div>
                  <div className="floating-input-group">
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="floating-input"
                    />
                  </div>
                  {error && <div className="auth-error">{error}</div>}
                  <button type="submit" className="login-submit-btn">
                    Login
                  </button>
                </form>
                <p className="auth-toggle-link">
                  New here? <span onClick={() => setMode('signup')}>Create Account</span>
                </p>
              </div>
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
