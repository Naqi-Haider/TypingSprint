import { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';
import { supabase } from '../supabaseClient';

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
  const [error, setError] = useState(null);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    const savedUser = localStorage.getItem('user');

    if (!hasVisited) {
      setIsFirstVisit(true);
    }

    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchSupabaseUserData(session.user.id);
        } else if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            console.error(e);
          }
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await fetchSupabaseUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('user');
        }
      });

      return () => subscription.unsubscribe();
    } else {
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing saved user:', error);
        }
      }
      setLoading(false);
    }
  }, []);

  const fetchSupabaseUserData = async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      const userData = {
        id: userId,
        name: profile?.username || 'Typist',
        email: profile?.email || '',
        avatar: profile?.avatar || 'T',
        avatarUrl: profile?.avatar_url || '',
        bannerUrl: profile?.banner_url || '',
        bio: profile?.bio || '',
        theme: profile?.theme || 'retro',
        avatarPosition: profile?.avatar_position || { x: 50, y: 50 },
        bannerPosition: profile?.banner_position || { x: 50, y: 50 },
        bestWPM: stats?.best_wpm || 0,
        avgWPM: stats?.avg_wpm || 0,
        matchesWon: stats?.matches_won || 0,
        gamesPlayed: stats?.games_played || 0,
        accuracy: stats?.accuracy || 0,
        hoursPlayed: stats?.hours_played || 0,
        joinedDate: profile?.created_at || new Date().toISOString()
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.error('Error fetching Supabase user data:', err);
      return null;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) {
          setLoading(false);
          const errorMsg = authError.message.includes('Email not confirmed')
            ? 'Please verify your email address before logging in.'
            : authError.message;
          setError(errorMsg);
          throw new Error(errorMsg);
        }

        const userData = await fetchSupabaseUserData(data.user.id);
        localStorage.setItem('hasVisited', 'true');
        setIsFirstVisit(false);
        setShowAuthModal(false);
        setLoading(false);
        return { success: true, user: userData };
      }

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.message || 'Login failed';
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
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    try {
      setError(null);
      setLoading(true);

      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: name },
            emailRedirectTo: `${window.location.origin}/verify-email`
          }
        });

        if (authError) {
          setLoading(false);
          setError(authError.message);
          throw authError;
        }

        if (data.user) {
          // If Supabase has email confirmation enabled, session is null until verified
          if (!data.session) {
            setLoading(false);
            return {
              success: true,
              requiresVerification: true,
              email: data.user.email,
              message: 'Please check your email for the verification link.'
            };
          }

          const userData = await fetchSupabaseUserData(data.user.id);
          localStorage.setItem('hasVisited', 'true');
          setIsFirstVisit(false);
          setShowAuthModal(false);
          setLoading(false);
          return { success: true, user: userData };
        }
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: name, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.message || 'Registration failed';
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

      throw new Error('Registration failed');

    } catch (err) {
      setLoading(false);
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    }
  };

  const logout = async () => {
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  const continueAsGuest = () => {
    setUser('guest');
    localStorage.setItem('user', JSON.stringify('guest'));
    localStorage.setItem('hasVisited', 'true');
    setIsFirstVisit(false);
  };

  const refreshCurrentUser = async () => {
    if (!user || user === 'guest') return null;

    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
      return await fetchSupabaseUserData(user.id);
    }

    try {
      const response = await fetch(`${API_URL}/auth/me?userId=${user.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (response.ok) {
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
          return userData;
        }
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
    return null;
  };

  const updateUserStats = async (stats) => {
    if (!user || user === 'guest') return;

    const updatedUser = { ...user, ...stats };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
      try {
        await supabase
          .from('profiles')
          .update({
            username: stats.name,
            bio: stats.bio,
            avatar_url: stats.avatarUrl,
            banner_url: stats.bannerUrl,
            theme: stats.theme,
            avatar_position: stats.avatarPosition,
            banner_position: stats.bannerPosition
          })
          .eq('id', user.id);
        console.log('✅ Profile synced to Supabase Postgres');
      } catch (err) {
        console.error('Failed to sync profile to Supabase:', err);
      }
      return;
    }

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
    } catch (err) {
      console.error('Failed to sync profile to backend:', err);
    }
  };

  const saveGameStats = async (gameStats) => {
    if (!user || user === 'guest') return { success: false, reason: 'guest' };

    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
      try {
        const { data: currentStats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const currentGamesPlayed = currentStats?.games_played || 0;
        const currentTotalWords = currentStats?.total_words || 0;
        const currentAvgWPM = currentStats?.avg_wpm || 0;
        const currentBestWPM = currentStats?.best_wpm || 0;
        const currentAccuracy = currentStats?.accuracy || 0;

        const newGamesPlayed = currentGamesPlayed + 1;
        const newTotalWords = currentTotalWords + (gameStats.wordsTyped || 0);
        const newAvgWPM = Math.round(((currentAvgWPM * currentGamesPlayed) + gameStats.wpm) / newGamesPlayed);
        const newBestWPM = Math.max(currentBestWPM, gameStats.wpm);
        const newAccuracy = Math.round(((currentAccuracy * currentGamesPlayed) + gameStats.accuracy) / newGamesPlayed);

        const { data: updatedStats, error: updateErr } = await supabase
          .from('user_stats')
          .upsert({
            user_id: user.id,
            games_played: newGamesPlayed,
            total_words: newTotalWords,
            avg_wpm: newAvgWPM,
            best_wpm: newBestWPM,
            accuracy: newAccuracy
          })
          .select()
          .single();

        if (updateErr) throw updateErr;

        const updatedUser = {
          ...user,
          bestWPM: newBestWPM,
          avgWPM: newAvgWPM,
          gamesPlayed: newGamesPlayed,
          accuracy: newAccuracy
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        return { success: true, stats: updatedStats };
      } catch (err) {
        console.error('❌ Supabase stats save error:', err.message);
        return { success: false, error: err.message };
      }
    }

    try {
      const response = await fetch(`${API_URL}/stats/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        return { success: false, error: data.message };
      }

      const data = await response.json();
      if (data.success) {
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
    } catch (err) {
      console.error('❌ Error saving stats:', err.message);
      return { success: false, error: err.message };
    }
  };

  const clearError = () => setError(null);

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
