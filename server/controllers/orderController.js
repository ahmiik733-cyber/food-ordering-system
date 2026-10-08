const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

// Place a new order
exports.placeOrder = async (req, res, next) => {
  try {
    const { deliveryAddress, contactPhone } = req.body;

    if (!deliveryAddress || !contactPhone) {
      return res.status(400).json({ message: 'Delivery address and contact phone are required.' });
    }

    const orderId = await Order.place(req.user.id, { deliveryAddress, contactPhone });
    res.status(218).json({
      message: 'Order placed successfully.',
      orderId
    });
  } catch (error) {
    next(error);
  }
};

// Get order detail
exports.getOrderDetails = async (req, res, next) => {
  try {
    const order = await Order.getDetails(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Authorization checks
    // Customers can view their own orders
    // Owners can view orders placed at their restaurants
    // Admin can view any order
    // Delivery staff can view assigned orders
    const isCustomer = order.user_id === req.user.id;
    const isDeliveryStaff = order.delivery && order.delivery.delivery_staff_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    let isOwner = false;
    if (req.user.role === 'owner') {
      const owned = await Restaurant.getByOwnerId(req.user.id);
      isOwner = owned.some(r => r.id === order.restaurant_id);
    }

    if (!isCustomer && !isDeliveryStaff && !isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Access denied. You do not have permission to view this order.' });
    }

    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

// Get orders for a specific restaurant (Owner view)
exports.getRestaurantOrders = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId;
    
    // Verify ownership
    const owned = await Restaurant.getByOwnerId(req.user.id);
    const isMatched = owned.some(r => r.id === parseInt(restaurantId));

    if (!isMatched && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You do not own this restaurant.' });
    }

    const orders = await Order.getByRestaurant(restaurantId);
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

// Get orders assigned to delivery staff
exports.getDeliveryStaffOrders = async (req, res, next) => {
  try {
    const orders = await Order.getByDeliveryStaff(req.user.id);
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

// Update order status (Owner, Admin, or Delivery Staff)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    // Verify order exists
    const order = await Order.getDetails(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Guard matching roles
    const isAdmin = req.user.role === 'admin';
    const isDeliveryStaff = order.delivery && order.delivery.delivery_staff_id === req.user.id;
    
    let isOwner = false;
    if (req.user.role === 'owner') {
      const owned = await Restaurant.getByOwnerId(req.user.id);
      isOwner = owned.some(r => r.id === order.restaurant_id);
    }

    if (!isAdmin && !isOwner && !isDeliveryStaff) {
      return res.status(403).json({ message: 'Access denied. You do not have permissions to modify this order.' });
    }

    const success = await Order.updateStatus(orderId, status);
    if (!success) {
      return res.status(400).json({ message: 'Order status update failed.' });
    }

    res.status(200).json({ message: 'Order status updated successfully.', status });
  } catch (error) {
    next(error);
  }
};
