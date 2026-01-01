import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

import { API_URL } from '../config';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = not set, 'guest' = guest mode, object = logged in
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisited');
    const savedUser = localStorage.getItem('user');

    if (!hasVisited) {
      setIsFirstVisit(true);
    }

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
      }
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      // NOTE: Check vite.config.js for proxy configuration if needed
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies/sessions
        body: JSON.stringify({ email, password }),
      });

      // Check for credential errors (response received but not ok)
      if (!response.ok) {
        const data = await response.json();

        // Check if email verification is required
        if (data.requiresVerification) {
          setLoading(false);
          setError('Please verify your email before logging in. Check your inbox for the verification link.');
          throw new Error('Email not verified');
        }

        const errorMessage = data.message ||
          (response.status === 401 ? 'Invalid email or password' :
            response.status === 400 ? 'Please provide valid credentials' :
              'Login failed');
        setLoading(false);
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success && data.user) {
        const userData = {
          id: data.user.id,
          name: data.user.username,
          email: data.user.email,
          avatar: data.user.avatar,
          avatarUrl: data.user.avatarUrl || '',
          bannerUrl: data.user.bannerUrl || '',
          bio: data.user.bio || '',
          bestWPM: data.user.stats?.bestWPM || 0,
          matchesWon: data.user.stats?.matchesWon || 0,
          gamesPlayed: data.user.stats?.gamesPlayed || 0,
          accuracy: data.user.stats?.accuracy || 0,
          hoursPlayed: data.user.stats?.hoursPlayed || 0,
          joinedDate: data.user.joinedDate,
          theme: data.user.theme || 'retro',
          avatarPosition: data.user.avatarPosition || { x: 50, y: 50 },
          bannerPosition: data.user.bannerPosition || { x: 50, y: 50 }
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('hasVisited', 'true');
        setIsFirstVisit(false);
        setShowAuthModal(false);
        setLoading(false);

        return { success: true, user: userData };
      }

      throw new Error('Login failed');

    } catch (err) {
      setLoading(false);
      // Log error for debugging
      console.error('Login error:', err.message);

      // Network error (server unreachable)
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
        const networkError = 'Server unreachable. Is the backend running?';
        setError(networkError);
        console.error('Network error detected:', networkError);
        throw new Error(networkError);
      }
      // Credential or other errors
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies/sessions
        body: JSON.stringify({
          username: name,
          email,
          password,
        }),
      });

      // Check for credential errors (response received but not ok)
      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.message ||
          (response.status === 400 ? 'Invalid registration data' :
            'Registration failed');
        setLoading(false);
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Check if email verification is required
      if (data.success && data.requiresVerification) {
        setLoading(false);
        // Don't auto-login, show success message about verification
        return {
          success: true,
          requiresVerification: true,
          message: data.message || 'Please check your email to verify your account.',
          email: data.email
        };
      }

      if (data.success && data.user) {
        // Auto-login after successful registration (for non-verification flow)
        const userData = {
          id: data.user.id,
          name: data.user.username,
          email: data.user.email,
          avatar: data.user.avatar,
          avatarUrl: data.user.avatarUrl || '',
          bannerUrl: data.user.bannerUrl || '',
          bio: data.user.bio || '',
          bestWPM: data.user.stats?.bestWPM || 0,
          matchesWon: data.user.stats?.matchesWon || 0,
          gamesPlayed: data.user.stats?.gamesPlayed || 0,
          accuracy: data.user.stats?.accuracy || 0,
          hoursPlayed: data.user.stats?.hoursPlayed || 0,
          joinedDate: data.user.joinedDate,
          theme: data.user.theme || 'retro',
          avatarPosition: data.user.avatarPosition || { x: 50, y: 50 },
          bannerPosition: data.user.bannerPosition || { x: 50, y: 50 }
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('hasVisited', 'true');
        setIsFirstVisit(false);
        setShowAuthModal(false);
        setLoading(false);

        return { success: true, user: userData };
      }

      throw new Error('Registration failed');

    } catch (err) {
      setLoading(false);
      // Log error for debugging
      console.error('Signup error:', err.message);

      // Network error (server unreachable)
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
        const networkError = 'Server unreachable. Is the backend running?';
        setError(networkError);
        console.error('Network error detected:', networkError);
        throw new Error(networkError);
      }
      // Credential or other errors
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const continueAsGuest = () => {
    setUser('guest');
    localStorage.setItem('user', JSON.stringify('guest'));
    localStorage.setItem('hasVisited', 'true');
    setIsFirstVisit(false);
  };

  // Refresh current user data from backend (for real-time stats sync)
  const refreshCurrentUser = async () => {
    if (!user || user === 'guest') {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/auth/me?userId=${user.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to refresh user data');
        return null;
      }

      const data = await response.json();

      if (data.success && data.user) {
        const userData = {
          id: data.user.id,
          name: data.user.username,
          email: data.user.email,
          avatar: data.user.avatar,
          avatarUrl: data.user.avatarUrl,
          bannerUrl: data.user.bannerUrl,
          bio: data.user.bio,
          bestWPM: data.user.stats?.bestWPM || 0,
          matchesWon: data.user.stats?.matchesWon || 0,
          gamesPlayed: data.user.stats?.gamesPlayed || 0,
          accuracy: data.user.stats?.accuracy || 0,
          hoursPlayed: data.user.stats?.hoursPlayed || 0,
          joinedDate: data.user.joinedDate,
          theme: data.user.theme,
          avatarPosition: data.user.avatarPosition,
          bannerPosition: data.user.bannerPosition
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ User data refreshed from backend');
        return userData;
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
    return null;
  };

  const updateUserStats = async (stats) => {
    if (user && user !== 'guest') {
      const updatedUser = { ...user, ...stats };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Sync with backend
      try {
        await fetch(`${API_URL}/auth/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: user.id,
            username: stats.name,
            bio: stats.bio,
            avatarUrl: stats.avatarUrl,
            bannerUrl: stats.bannerUrl,
            theme: stats.theme,
            avatarPosition: stats.avatarPosition,
            bannerPosition: stats.bannerPosition
          })
        });
        console.log('✅ Profile synced to backend');
      } catch (err) {
        console.error('Failed to sync profile to backend:', err);
      }
    }
  };

  // Save game stats to backend
  const saveGameStats = async (gameStats) => {
    // Don't save for guest users
    if (!user || user === 'guest') {
      console.log('📊 Guest user - stats not saved to server');
      return { success: false, reason: 'guest' };
    }

    try {
      console.log('📊 Saving game stats to server:', gameStats);

      const response = await fetch(`${API_URL}/stats/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          wpm: gameStats.wpm,
          accuracy: gameStats.accuracy,
          wordsTyped: gameStats.wordsTyped || 0
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('❌ Failed to save stats:', data.message);
        return { success: false, error: data.message };
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ Stats saved successfully:', data.stats);

        // Update local user with new stats
        const updatedUser = {
          ...user,
          bestWPM: data.stats.bestWPM,
          gamesPlayed: data.stats.gamesPlayed,
          avgWPM: data.stats.avgWPM,
          accuracy: data.stats.accuracy
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        return { success: true, stats: data.stats };
      }

      return { success: false, error: 'Unknown error' };

    } catch (err) {
      console.error('❌ Error saving stats:', err.message);
      // Don't throw - just log and continue, stats saving shouldn't break the game
      return { success: false, error: err.message };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    isFirstVisit,
    showAuthModal,
    setShowAuthModal,
    login,
    signup,
    logout,
    continueAsGuest,
    refreshCurrentUser,
    updateUserStats,
    saveGameStats,
    clearError,
    isGuest: user === 'guest',
    isLoggedIn: user && user !== 'guest'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
