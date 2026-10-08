const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { auth } = require('../middleware/auth');

// All delivery routes require active login
router.use(auth);

router.post('/assign', deliveryController.assignDelivery);
router.put('/:orderId/status', deliveryController.updateDeliveryStatus);
router.get('/staff/available', deliveryController.getAvailableStaff);
router.put('/staff/status', deliveryController.updateStaffStatus);
router.get('/staff/profile', deliveryController.getStaffStatus);

module.exports = router;
