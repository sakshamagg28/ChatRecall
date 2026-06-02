const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { serializeUser } = require('./auth');

const socketAuth = async (socket, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return next(new Error('JWT_SECRET is not configured'));
    }

    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Invalid authentication token'));
    }

    socket.user = user;
    socket.authUser = serializeUser(user);
    next();
  } catch (err) {
    next(new Error('Invalid or expired authentication token'));
  }
};

module.exports = socketAuth;
