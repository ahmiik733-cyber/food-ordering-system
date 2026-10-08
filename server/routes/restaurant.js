const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { auth, isOwner } = require('../middleware/auth');

// Owner / secure endpoints (MUST be before /:id to avoid 'owner' being captured as param)
router.get('/owner/my', auth, isOwner, restaurantController.getMyRestaurants);
router.post('/', auth, isOwner, restaurantController.createRestaurant);
router.put('/:id', auth, isOwner, restaurantController.updateRestaurant);

// Public endpoints (/:id must come AFTER named routes)
router.get('/', restaurantController.getAllRestaurants);
router.get('/cuisines', restaurantController.getCuisines);
router.get('/:id', restaurantController.getRestaurantById);

module.exports = router;
