const Restaurant = require('../models/Restaurant');

// Get all restaurants with search/filtering
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const { search, cuisine, rating } = req.query;
    const restaurants = await Restaurant.getAll({
      search,
      cuisine,
      minRating: rating
    });
    res.status(200).json({ restaurants });
  } catch (error) {
    next(error);
  }
};

// Get single restaurant detail
exports.getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }
    res.status(200).json({ restaurant });
  } catch (error) {
    next(error);
  }
};

// Create a new restaurant profile
exports.createRestaurant = async (req, res, next) => {
  try {
    const { name, description, address, phone, cuisineType, imageUrl } = req.body;
    
    if (!name || !address || !phone) {
      return res.status(400).json({ message: 'Restaurant name, address, and phone are required.' });
    }

    const restaurantId = await Restaurant.create({
      name,
      description,
      address,
      phone,
      cuisineType,
      imageUrl,
      ownerId: req.user.id
    });

    res.status(218).json({
      message: 'Restaurant submission received. Awaiting administrator approval.',
      restaurantId
    });
  } catch (error) {
    next(error);
  }
};

// Update restaurant profile
exports.updateRestaurant = async (req, res, next) => {
  try {
    const { name, description, address, phone, cuisineType, imageUrl } = req.body;
    const restaurantId = req.params.id;

    // Verify restaurant ownership
    const myRestaurants = await Restaurant.getByOwnerId(req.user.id);
    const isMatched = myRestaurants.some(r => r.id === parseInt(restaurantId));

    if (!isMatched && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You do not own this restaurant.' });
    }

    const success = await Restaurant.update(restaurantId, {
      name,
      description,
      address,
      phone,
      cuisineType,
      imageUrl
    });

    if (!success) {
      return res.status(404).json({ message: 'Restaurant not found or details unchanged.' });
    }

    res.status(200).json({ message: 'Restaurant details updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Get restaurants owned by currently logged-in user
exports.getMyRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.getByOwnerId(req.user.id);
    res.status(200).json({ restaurants });
  } catch (error) {
    next(error);
  }
};

// Get list of cuisines
exports.getCuisines = async (req, res, next) => {
  try {
    const cuisines = await Restaurant.getCuisines();
    res.status(200).json({ cuisines });
  } catch (error) {
    next(error);
  }
};
