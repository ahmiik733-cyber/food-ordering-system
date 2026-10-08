const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, isDelivery } = require('../middleware/auth');

// All order routes require active login
router.use(auth);

router.post('/', orderController.placeOrder);
router.get('/delivery/my', isDelivery, orderController.getDeliveryStaffOrders);
router.get('/restaurant/:restaurantId', orderController.getRestaurantOrders);
router.get('/:id', orderController.getOrderDetails);
router.put('/:id/status', orderController.updateOrderStatus);

module.exports = router;
