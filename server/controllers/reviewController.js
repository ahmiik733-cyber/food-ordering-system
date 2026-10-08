const Review = require('../models/Review');

// Add a review for a restaurant
exports.addReview = async (req, res, next) => {
  try {
    const { restaurantId, rating, comment } = req.body;

    if (!restaurantId || !rating) {
      return res.status(400).json({ message: 'Restaurant ID and rating (1-5) are required.' });
    }

    const val = parseInt(rating);
    if (val < 1 || val > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    }

    await Review.add({
      userId: req.user.id,
      restaurantId,
      rating: val,
      comment
    });

    res.status(218).json({ message: 'Review submitted and rating calculated.' });
  } catch (error) {
    next(error);
  }
};

// Get reviews for a restaurant
exports.getRestaurantReviews = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId;
    const reviews = await Review.getByRestaurant(restaurantId);
    res.status(200).json({ reviews });
  } catch (error) {
    next(error);
  }
};
