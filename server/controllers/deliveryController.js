const Delivery = require('../models/Delivery');
const Order = require('../models/Order');

// Assign delivery staff to an order (Owner or Admin)
exports.assignDelivery = async (req, res, next) => {
  try {
    const { orderId, deliveryStaffId, estimatedMinutes } = req.body;

    if (!orderId || !deliveryStaffId) {
      return res.status(400).json({ message: 'Order ID and Delivery Staff ID are required.' });
    }

    // Assign
    await Delivery.assign(orderId, deliveryStaffId, estimatedMinutes || 30);
    
    // Set order status to preparing
    await Order.updateStatus(orderId, 'preparing');

    res.status(200).json({ message: 'Delivery staff assigned and order marked as preparing.' });
  } catch (error) {
    next(error);
  }
};

// Update delivery tracking milestone (Delivery Staff or Admin)
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'assigned', 'picked_up', 'delivered'
    const orderId = req.params.orderId;

    if (!status) {
      return res.status(400).json({ message: 'Delivery status is required.' });
    }

    const success = await Delivery.updateStatus(orderId, status);
    if (!success) {
      return res.status(404).json({ message: 'Delivery assignment not found.' });
    }

    res.status(200).json({ message: `Delivery marked as ${status} successfully.`, status });
  } catch (error) {
    next(error);
  }
};

// List available delivery agents (for owners/admin to pick)
exports.getAvailableStaff = async (req, res, next) => {
  try {
    const staff = await Delivery.getAvailableStaff();
    res.status(200).json({ staff });
  } catch (error) {
    next(error);
  }
};

// Update delivery staff profile status (e.g. going online/offline)
exports.updateStaffStatus = async (req, res, next) => {
  try {
    const { status, vehicleType } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    const success = await Delivery.updateStaffStatus(req.user.id, status, vehicleType);
    if (!success) {
      return res.status(404).json({ message: 'Delivery staff profile not found.' });
    }

    res.status(200).json({ message: 'Delivery staff profile status updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Get current delivery staff status info
exports.getStaffStatus = async (req, res, next) => {
  try {
    const profile = await Delivery.getStaffStatus(req.user.id);
    if (!profile) {
      return res.status(404).json({ message: 'Delivery staff profile not found.' });
    }
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
};
