const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Helper to generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Please provide name, email, password, and phone.' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in DB
    const userId = await User.create({
      name,
      email,
      passwordHash,
      role, // Default: 'customer'
      phone,
      address
    });

    const user = { id: userId, name, email, role: role || 'customer' };
    const token = generateToken(user);

    res.status(218).json({
      message: 'User registered successfully.',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Login User
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    // Check user existence
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    // Verify password match
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    // Generate JWT
    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get User Profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

// Update User Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and Phone are required.' });
    }

    const success = await User.updateProfile(req.user.id, { name, phone, address });
    if (!success) {
      return res.status(404).json({ message: 'User not found or profile details unchanged.' });
    }

    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Get user order history
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await User.getOrderHistory(req.user.id);
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};
