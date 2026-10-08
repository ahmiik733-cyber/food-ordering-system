const db = require('../config/db');
const Restaurant = require('./Restaurant');

class Review {
  // Add a review for a restaurant and recalculate average rating
  static async add({ userId, restaurantId, rating, comment }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insert or replace review (1 review per user per restaurant)
      const query = `
        INSERT INTO reviews (user_id, restaurant_id, rating, comment) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), created_at = CURRENT_TIMESTAMP
      `;
      const [result] = await connection.execute(query, [userId, restaurantId, rating, comment]);

      // Commit the review
      await connection.commit();

      // Update the restaurant's average rating (non-blocking)
      await Restaurant.updateAverageRating(restaurantId);

      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get reviews for a specific restaurant
  static async getByRestaurant(restaurantId) {
    const query = `
      SELECT r.id, r.user_id, u.name AS user_name, r.rating, r.comment, r.created_at
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.restaurant_id = ?
      ORDER BY r.created_at DESC
    `;
    const [rows] = await db.execute(query, [restaurantId]);
    return rows;
  }
}

module.exports = Review;
