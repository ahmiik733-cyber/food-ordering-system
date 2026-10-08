const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const { auth, isOwner } = require('../middleware/auth');

// Public endpoints
router.get('/menu/:restaurantId', foodController.getMenu);
router.get('/categories/:restaurantId', foodController.getCategories);

// Owner secure endpoints
router.post('/category', auth, isOwner, foodController.addCategory);
router.post('/item', auth, isOwner, foodController.addFoodItem);
router.put('/item/:id', auth, isOwner, foodController.updateFoodItem);
router.patch('/item/:id/availability', auth, isOwner, foodController.toggleAvailability);
router.delete('/item/:id', auth, isOwner, foodController.deleteFoodItem);

module.exports = router;
