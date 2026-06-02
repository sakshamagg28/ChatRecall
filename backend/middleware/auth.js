const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getBearerToken = (authHeader) => {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

const serializeUser = (user) => ({
  id: user._id.toString(),
  _id: user._id,
  username: user.username,
  email: user.email,
});

const requireAuth = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured' });
    }

    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    req.authUser = serializeUser(user);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = {
  getBearerToken,
  requireAuth,
  serializeUser,
};
