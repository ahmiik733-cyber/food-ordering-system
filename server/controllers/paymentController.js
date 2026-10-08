const Payment = require('../models/Payment');
const Order = require('../models/Order');

// Simulate payment creation (checkout phase)
exports.createPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod } = req.body;

    if (!orderId || !paymentMethod) {
      return res.status(400).json({ message: 'Order ID and payment method are required.' });
    }

    // Verify order exists
    const order = await Order.getDetails(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Double check if user matches
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You do not own this order.' });
    }

    // Generate simulated transaction ID
    const transactionId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Set payment status (UPI & Card are auto-completed in mockup, Cash is pending until delivery)
    const paymentStatus = paymentMethod === 'cash' ? 'pending' : 'completed';

    const paymentId = await Payment.create({
      orderId,
      paymentMethod,
      transactionId,
      status: paymentStatus,
      amount: order.total_amount
    });

    res.status(218).json({
      message: paymentStatus === 'completed' ? 'Payment processed successfully.' : 'Order marked as Cash on Delivery.',
      paymentId,
      transactionId,
      status: paymentStatus
    });
  } catch (error) {
    next(error);
  }
};

// Verify/Update payment status
exports.verifyPayment = async (req, res, next) => {
  try {
    const { status } = req.body;
    const orderId = req.params.orderId;

    if (!status) {
      return res.status(400).json({ message: 'Payment status is required.' });
    }

    const success = await Payment.updateStatus(orderId, status);
    if (!success) {
      return res.status(404).json({ message: 'Payment record not found for this order.' });
    }

    res.status(200).json({ message: 'Payment status verified successfully.' });
  } catch (error) {
    next(error);
  }
};

// List transactions (Admin only)
exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await Payment.getTransactionHistory();
    res.status(200).json({ transactions });
  } catch (error) {
    next(error);
  }
};
