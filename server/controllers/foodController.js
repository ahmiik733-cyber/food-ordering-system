const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');

// Helper to verify if the owner owns the category/restaurant
const verifyOwnership = async (userId, restaurantId) => {
  const ownedRestaurants = await Restaurant.getByOwnerId(userId);
  return ownedRestaurants.some(r => r.id === parseInt(restaurantId));
};

// Get restaurant menu (categorized)
exports.getMenu = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId;
    const menuItems = await Food.getMenu(restaurantId);
    
    // Structure items by category
    const menu = {};
    menuItems.forEach(item => {
      if (!menu[item.category_name]) {
        menu[item.category_name] = {
          categoryId: item.category_id,
          items: []
        };
      }
      menu[item.category_name].items.push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        isAvailable: item.is_available,
        imageUrl: item.image_url
      });
    });

    res.status(200).json({ menu });
  } catch (error) {
    next(error);
  }
};

// Get categories of a restaurant
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Food.getCategoriesByRestaurant(req.params.restaurantId);
    res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
};

// Add category to restaurant
exports.addCategory = async (req, res, next) => {
  try {
    const { restaurantId, name } = req.body;
    if (!restaurantId || !name) {
      return res.status(400).json({ message: 'Restaurant ID and Category Name are required.' });
    }

    const isOwner = await verifyOwnership(req.user.id, restaurantId);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You do not own this restaurant.' });
    }

    const categoryId = await Food.addCategory(restaurantId, name);
    res.status(218).json({ message: 'Category added successfully.', categoryId });
  } catch (error) {
    next(error);
  }
};

// Add food item
exports.addFoodItem = async (req, res, next) => {
  try {
    const { categoryId, name, description, price, imageUrl, isAvailable, restaurantId } = req.body;
    
    if (!categoryId || !name || !price || !restaurantId) {
      return res.status(400).json({ message: 'Please provide categoryId, name, price, and restaurantId.' });
    }

    const isOwner = await verifyOwnership(req.user.id, restaurantId);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You do not own this restaurant.' });
    }

    const itemId = await Food.addItem({
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isAvailable
    });

    res.status(218).json({ message: 'Food item added successfully.', itemId });
  } catch (error) {
    next(error);
  }
};

// Update food item
exports.updateFoodItem = async (req, res, next) => {
  try {
    const { name, description, price, imageUrl, isAvailable, restaurantId } = req.body;
    const itemId = req.params.id;

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required.' });
    }

    const isOwner = await verifyOwnership(req.user.id, restaurantId);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You do not own this restaurant.' });
    }

    const success = await Food.updateItem(itemId, {
      name,
      description,
      price,
      imageUrl,
      isAvailable
    });

    if (!success) {
      return res.status(404).json({ message: 'Food item not found or details unchanged.' });
    }

    res.status(200).json({ message: 'Food item updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Toggle item availability
exports.toggleAvailability = async (req, res, next) => {
  try {
    const { isAvailable, restaurantId } = req.body;
    const itemId = req.params.id;

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required.' });
    }

    const isOwner = await verifyOwnership(req.user.id, restaurantId);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You do not own this restaurant.' });
    }

    const success = await Food.toggleAvailability(itemId, isAvailable);
    if (!success) {
      return res.status(404).json({ message: 'Food item not found.' });
    }

    res.status(200).json({ message: 'Food availability status toggled.' });
  } catch (error) {
    next(error);
  }
};

// Delete food item
exports.deleteFoodItem = async (req, res, next) => {
  try {
    const { restaurantId } = req.query; // Send restaurantId as query parameter for verification
    const itemId = req.params.id;

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID query parameter is required.' });
    }

    const isOwner = await verifyOwnership(req.user.id, restaurantId);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You do not own this restaurant.' });
    }

    const success = await Food.deleteItem(itemId);
    if (!success) {
      return res.status(404).json({ message: 'Food item not found.' });
    }

    res.status(200).json({ message: 'Food item deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
