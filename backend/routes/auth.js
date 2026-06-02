const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuth, serializeUser } = require('../middleware/auth');

const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Login Route
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    // Check if password matches stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // Generate JWT token
    const token = signToken(user);

    // Send success response with token and user info
    res.json({ success: true, token, user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register Route
router.post('/register', async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Create and save new user
    user = new User({ username, email, password });
    await user.save();

    // Generate JWT token
    const token = signToken(user);

    res.json({ success: true, token, user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Me Route
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.authUser });
});

router.post('/logout', requireAuth, (_req, res) => {
  res.json({ success: true });
});

module.exports = router;
