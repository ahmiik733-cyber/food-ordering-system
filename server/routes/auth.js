const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Secure endpoints
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.get('/orders', auth, authController.getOrders);

module.exports = router;
