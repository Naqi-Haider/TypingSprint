import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// POST /api/stats/save - Save game stats after a game
router.post('/save', async (req, res) => {
  try {
    const { userId, wpm, accuracy, wordsTyped } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (typeof wpm !== 'number' || typeof accuracy !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'WPM and accuracy must be numbers'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('📊 Saving game stats for user:', { 
      userId, 
      username: user.username, 
      wpm, 
      accuracy, 
      wordsTyped 
    });

    // Calculate new stats
    const currentGamesPlayed = user.stats.gamesPlayed || 0;
    const currentTotalWords = user.stats.totalWords || 0;
    const currentAvgWPM = user.stats.avgWPM || 0;
    const currentBestWPM = user.stats.bestWPM || 0;
    const currentAccuracy = user.stats.accuracy || 0;

    // Update stats
    const newGamesPlayed = currentGamesPlayed + 1;
    const newTotalWords = currentTotalWords + (wordsTyped || 0);
    
    // Calculate new average WPM (weighted average)
    const newAvgWPM = Math.round(
      ((currentAvgWPM * currentGamesPlayed) + wpm) / newGamesPlayed
    );
    
    // Update best WPM if this game was better
    const newBestWPM = Math.max(currentBestWPM, wpm);
    
    // Calculate new average accuracy (weighted average)
    const newAccuracy = Math.round(
      ((currentAccuracy * currentGamesPlayed) + accuracy) / newGamesPlayed
    );

    // Apply updates
    user.stats.gamesPlayed = newGamesPlayed;
    user.stats.totalWords = newTotalWords;
    user.stats.avgWPM = newAvgWPM;
    user.stats.bestWPM = newBestWPM;
    user.stats.accuracy = newAccuracy;

    await user.save();
    console.log('✅ Stats saved successfully:', user.stats);

    res.status(200).json({
      success: true,
      message: 'Stats saved successfully',
      stats: user.stats
    });

  } catch (error) {
    console.error('❌ Stats save error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving stats'
    });
  }
});

// GET /api/stats/:userId - Get user stats
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('stats username');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('📊 Fetching stats for user:', user.username);

    res.status(200).json({
      success: true,
      stats: user.stats,
      username: user.username
    });

  } catch (error) {
    console.error('❌ Stats fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stats'
    });
  }
});

export default router;
