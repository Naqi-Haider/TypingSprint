import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendVerificationEmail, generateVerificationToken } from '../utils/emailService.js';

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

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: username.charAt(0).toUpperCase(),
      isVerified: false,
      verificationToken,
      verificationTokenExpires
    });

    console.log('📝 Saving new user to MongoDB:', { username, email: email.toLowerCase() });
    const savedUser = await newUser.save();
    console.log('✅ User saved successfully:', { id: savedUser._id, username: savedUser.username });

    // Send verification email in background (non-blocking)
    // Don't await - let it run asynchronously so response is instant
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    sendVerificationEmail(
      savedUser.email,
      savedUser.username,
      verificationToken,
      frontendUrl
    ).then(result => {
      if (!result.success) {
        console.error('⚠️ Verification email failed to send:', result.error);
      }
    }).catch(err => {
      console.error('⚠️ Verification email error:', err.message);
    });

    // Return success immediately without waiting for email
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true,
      email: savedUser.email
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

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
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

// GET /api/auth/verify-email/:token - Verify user email with token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user by verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link'
      });
    }

    // Mark user as verified and clear token
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    console.log('✅ Email verified for user:', user.username);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      username: user.username
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This email is already verified'
      });
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Send new verification email
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const emailResult = await sendVerificationEmail(
      user.email,
      user.username,
      verificationToken,
      frontendUrl
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resend'
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

