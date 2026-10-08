const Cart = require('../models/Cart');

// Get cart items for logged in user
exports.getCart = async (req, res, next) => {
  try {
    const items = await Cart.getItems(req.user.id);
    
    // Calculate summaries
    let subtotal = 0;
    items.forEach(item => {
      if (item.is_available) {
        subtotal += parseFloat(item.price) * item.quantity;
      }
    });

    res.status(200).json({
      items,
      subtotal,
      restaurantId: items.length > 0 ? items[0].restaurant_id : null,
      restaurantName: items.length > 0 ? items[0].restaurant_name : null
    });
  } catch (error) {
    next(error);
  }
};

// Add item to cart
exports.addToCart = async (req, res, next) => {
  try {
    const { foodItemId, quantity } = req.body;
    
    if (!foodItemId) {
      return res.status(400).json({ message: 'Food Item ID is required.' });
    }

    const qty = parseInt(quantity) || 1;
    await Cart.addItem(req.user.id, foodItemId, qty);
    
    res.status(200).json({ message: 'Item added to cart successfully.' });
  } catch (error) {
    next(error);
  }
};

// Update item quantity
exports.updateCartItem = async (req, res, next) => {
  try {
    const { foodItemId, quantity } = req.body;
    
    if (!foodItemId || quantity === undefined) {
      return res.status(400).json({ message: 'Food Item ID and quantity are required.' });
    }

    const qty = parseInt(quantity);
    const success = await Cart.updateQuantity(req.user.id, foodItemId, qty);

    if (!success) {
      return res.status(404).json({ message: 'Cart item not found or quantity unchanged.' });
    }

    res.status(200).json({ message: 'Cart item quantity updated.' });
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const { foodItemId } = req.body;

    if (!foodItemId) {
      return res.status(400).json({ message: 'Food Item ID is required.' });
    }

    const success = await Cart.removeItem(req.user.id, foodItemId);
    if (!success) {
      return res.status(404).json({ message: 'Item not found in cart.' });
    }

    res.status(200).json({ message: 'Item removed from cart.' });
  } catch (error) {
    next(error);
  }
};

// Clear cart
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.clear(req.user.id);
    res.status(200).json({ message: 'Cart cleared successfully.' });
  } catch (error) {
    next(error);
  }
};
