const jwt = require('jsonwebtoken');
const { readCollection } = require('../models/db');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'accredchain_demo_secret_2024';
}

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required.' });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const users = await readCollection('users');
    const user = users.find((entry) => entry.id === payload.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found for the supplied token.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication is required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not authorized to perform this action.' });
    }

    return next();
  };
}

module.exports = {
  protect,
  authorize,
  getJwtSecret,
};
