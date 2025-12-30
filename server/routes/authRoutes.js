import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 20 characters'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: username.charAt(0).toUpperCase()
    });

    console.log('📝 Saving new user to MongoDB:', { username, email: email.toLowerCase() });
    const savedUser = await newUser.save();
    console.log('✅ User saved successfully:', { id: savedUser._id, username: savedUser.username });

    // Return user object (without password)
    const userResponse = {
      id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      avatar: savedUser.avatar,
      avatarUrl: savedUser.avatarUrl || '',
      bannerUrl: savedUser.bannerUrl || '',
      bio: savedUser.bio || '',
      theme: savedUser.theme || 'retro',
      avatarPosition: savedUser.avatarPosition || { x: 50, y: 50 },
      bannerPosition: savedUser.bannerPosition || { x: 50, y: 50 },
      stats: savedUser.stats,
      joinedDate: savedUser.joinedDate
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    console.log('📝 Updating last login for user:', { id: user._id, username: user.username });
    await user.save();
    console.log('✅ Last login updated successfully');

    // Return user object (without password)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      avatarUrl: user.avatarUrl || '',
      bannerUrl: user.bannerUrl || '',
      bio: user.bio || '',
      theme: user.theme || 'retro',
      avatarPosition: user.avatarPosition || { x: 50, y: 50 },
      bannerPosition: user.bannerPosition || { x: 50, y: 50 },
      stats: user.stats,
      joinedDate: user.joinedDate,
      lastLogin: user.lastLogin
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// GET /api/auth/me - Get current user data (for refreshing stats)
router.get('/me', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      avatarUrl: user.avatarUrl || '',
      bannerUrl: user.bannerUrl || '',
      bio: user.bio || '',
      theme: user.theme || 'retro',
      avatarPosition: user.avatarPosition || { x: 50, y: 50 },
      bannerPosition: user.bannerPosition || { x: 50, y: 50 },
      stats: user.stats,
      joinedDate: user.joinedDate
    };

    res.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user data'
    });
  }
});

// GET /api/auth/verify - Verify user session (optional for JWT)
router.get('/verify', async (req, res) => {
  try {
    // This endpoint can be used with JWT tokens in the future
    // For now, just return a success response
    res.status(200).json({
      success: true,
      message: 'Session valid'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { userId, username, bio, avatarUrl, bannerUrl, theme, avatarPosition, bannerPosition } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (username !== undefined && username.length >= 3 && username.length <= 20) {
      // Check if new username is already taken by another user
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      user.username = username;
      user.avatar = username.charAt(0).toUpperCase();
    }
    if (bio !== undefined) user.bio = bio.substring(0, 150);
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (bannerUrl !== undefined) user.bannerUrl = bannerUrl;
    if (theme !== undefined) user.theme = theme;
    if (avatarPosition !== undefined) {
      user.avatarPosition = {
        x: avatarPosition.x ?? 50,
        y: avatarPosition.y ?? 50
      };
    }
    if (bannerPosition !== undefined) {
      user.bannerPosition = {
        x: bannerPosition.x ?? 50,
        y: bannerPosition.y ?? 50
      };
    }

    await user.save();
    console.log('✅ Profile updated for user:', user.username);

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      bio: user.bio,
      theme: user.theme,
      avatarPosition: user.avatarPosition,
      bannerPosition: user.bannerPosition,
      stats: user.stats,
      joinedDate: user.joinedDate
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

// POST /api/stats/update-playtime - Update user play time
router.post('/stats/update-playtime', async (req, res) => {
  try {
    const { userId, hoursPlayed } = req.body;

    if (!userId || hoursPlayed === undefined) {
      return res.status(400).json({
        success: false,
        message: 'User ID and hours played are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Increment hours played
    user.stats.hoursPlayed = (user.stats.hoursPlayed || 0) + hoursPlayed;
    await user.save();

    console.log(`✅ Play time updated for ${user.username}: +${hoursPlayed.toFixed(2)}h (Total: ${user.stats.hoursPlayed.toFixed(2)}h)`);

    res.status(200).json({
      success: true,
      hoursPlayed: user.stats.hoursPlayed
    });

  } catch (error) {
    console.error('Play time update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during play time update'
    });
  }
});

export default router;

