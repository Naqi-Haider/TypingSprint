import express from 'express';
import User from '../models/User.js';
import { supabaseServer } from '../config/supabase.js';

const router = express.Router();

// POST /api/stats/save - Save game stats after a game
router.post('/save', async (req, res) => {
  try {
    const { userId, wpm, accuracy, wordsTyped } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (typeof wpm !== 'number' || typeof accuracy !== 'number') {
      return res.status(400).json({ success: false, message: 'WPM and accuracy must be numbers' });
    }

    // Check if Supabase is configured
    if (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) {
      const { data: currentStats } = await supabaseServer
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      const currentGamesPlayed = currentStats?.games_played || 0;
      const currentTotalWords = currentStats?.total_words || 0;
      const currentAvgWPM = currentStats?.avg_wpm || 0;
      const currentBestWPM = currentStats?.best_wpm || 0;
      const currentAccuracy = currentStats?.accuracy || 0;

      const newGamesPlayed = currentGamesPlayed + 1;
      const newTotalWords = currentTotalWords + (wordsTyped || 0);
      const newAvgWPM = Math.round(((currentAvgWPM * currentGamesPlayed) + wpm) / newGamesPlayed);
      const newBestWPM = Math.max(currentBestWPM, wpm);
      const newAccuracy = Math.round(((currentAccuracy * currentGamesPlayed) + accuracy) / newGamesPlayed);

      const { data: updatedStats, error } = await supabaseServer
        .from('user_stats')
        .upsert({
          user_id: userId,
          games_played: newGamesPlayed,
          total_words: newTotalWords,
          avg_wpm: newAvgWPM,
          best_wpm: newBestWPM,
          accuracy: newAccuracy
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase stats update error:', error);
        throw error;
      }

      console.log('✅ Stats saved successfully to Supabase:', updatedStats);
      return res.status(200).json({
        success: true,
        message: 'Stats saved successfully',
        stats: {
          bestWPM: updatedStats.best_wpm,
          avgWPM: updatedStats.avg_wpm,
          gamesPlayed: updatedStats.games_played,
          totalWords: updatedStats.total_words,
          accuracy: updatedStats.accuracy
        }
      });
    }

    // Fallback to Mongoose if Supabase is not configured
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentGamesPlayed = user.stats.gamesPlayed || 0;
    const currentTotalWords = user.stats.totalWords || 0;
    const currentAvgWPM = user.stats.avgWPM || 0;
    const currentBestWPM = user.stats.bestWPM || 0;
    const currentAccuracy = user.stats.accuracy || 0;

    const newGamesPlayed = currentGamesPlayed + 1;
    const newTotalWords = currentTotalWords + (wordsTyped || 0);
    const newAvgWPM = Math.round(((currentAvgWPM * currentGamesPlayed) + wpm) / newGamesPlayed);
    const newBestWPM = Math.max(currentBestWPM, wpm);
    const newAccuracy = Math.round(((currentAccuracy * currentGamesPlayed) + accuracy) / newGamesPlayed);

    user.stats.gamesPlayed = newGamesPlayed;
    user.stats.totalWords = newTotalWords;
    user.stats.avgWPM = newAvgWPM;
    user.stats.bestWPM = newBestWPM;
    user.stats.accuracy = newAccuracy;

    await user.save();
    console.log('✅ Stats saved successfully to MongoDB:', user.stats);

    res.status(200).json({
      success: true,
      message: 'Stats saved successfully',
      stats: user.stats
    });

  } catch (error) {
    console.error('❌ Stats save error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving stats' });
  }
});

// GET /api/stats/:userId - Get user stats
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) {
      const { data: profile } = await supabaseServer
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      const { data: stats } = await supabaseServer
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      return res.status(200).json({
        success: true,
        stats: {
          bestWPM: stats?.best_wpm || 0,
          avgWPM: stats?.avg_wpm || 0,
          gamesPlayed: stats?.games_played || 0,
          totalWords: stats?.total_words || 0,
          accuracy: stats?.accuracy || 0,
          matchesWon: stats?.matches_won || 0,
          hoursPlayed: stats?.hours_played || 0
        },
        username: profile?.username || 'Typist'
      });
    }

    const user = await User.findById(userId).select('stats username');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      stats: user.stats,
      username: user.username
    });

  } catch (error) {
    console.error('❌ Stats fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching stats' });
  }
});

export default router;
