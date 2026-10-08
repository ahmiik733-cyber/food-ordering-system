const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');

// Public endpoint
router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);

// Secure endpoint
router.post('/', auth, reviewController.addReview);

module.exports = router;
