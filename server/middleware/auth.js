const jwt = require('jsonwebtoken');
require('dotenv').config();

// Authentication middleware to verify JWT
const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Authorization denied.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_me');
    
    req.user = decoded; // Contains id, email, role, name
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid. Authentication failed.', error: error.message });
  }
};

// Check if user has an Admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
};

// Check if user has a Restaurant Owner role
const isOwner = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Restaurant Owner privileges required.' });
  }
};

// Check if user has a Delivery Staff role
const isDelivery = (req, res, next) => {
  if (req.user && req.user.role === 'delivery') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Delivery Staff privileges required.' });
  }
};

// Check if user is either Admin or Owner (e.g. for managing menu items)
const isAdminOrOwner = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'owner')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin or Owner privilege required.' });
  }
};

module.exports = {
  auth,
  isAdmin,
  isOwner,
  isDelivery,
  isAdminOrOwner
};
