const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, isAdmin } = require('../middleware/auth');

// All payment routes require active login
router.use(auth);

router.post('/', paymentController.createPayment);
router.put('/:orderId/verify', paymentController.verifyPayment);
router.get('/history', isAdmin, paymentController.getTransactions);

module.exports = router;
