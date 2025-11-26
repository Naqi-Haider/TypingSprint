import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

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

  const login = (email, password) => {
    // Mock login - in real app, this would call an API
    const mockUser = {
      id: Date.now(),
      name: email.split('@')[0],
      email: email,
      avatar: email.charAt(0).toUpperCase(),
      bestWPM: localStorage.getItem('bestWPM') || 0,
      gamesPlayed: 0,
      joinedDate: new Date().toISOString()
    };
    
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('hasVisited', 'true');
    setIsFirstVisit(false);
    setShowAuthModal(false);
    
    return { success: true, user: mockUser };
  };

  const signup = (name, email, password) => {
    // Mock signup - in real app, this would call an API
    const mockUser = {
      id: Date.now(),
      name: name,
      email: email,
      avatar: name.charAt(0).toUpperCase(),
      bestWPM: 0,
      gamesPlayed: 0,
      joinedDate: new Date().toISOString()
    };
    
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('hasVisited', 'true');
    setIsFirstVisit(false);
    setShowAuthModal(false);
    
    return { success: true, user: mockUser };
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

  const updateUserStats = (stats) => {
    if (user && user !== 'guest') {
      const updatedUser = { ...user, ...stats };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    loading,
    isFirstVisit,
    showAuthModal,
    setShowAuthModal,
    login,
    signup,
    logout,
    continueAsGuest,
    updateUserStats,
    isGuest: user === 'guest',
    isLoggedIn: user && user !== 'guest'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
