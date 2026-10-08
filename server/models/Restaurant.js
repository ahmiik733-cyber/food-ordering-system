const db = require('../config/db');

class Restaurant {
  // Get all active restaurants with optional search/filtering
  static async getAll({ search, cuisine, minRating }) {
    let query = `SELECT * FROM restaurants WHERE status = 'active'`;
    const params = [];

    if (search) {
      query += ` AND (name LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (cuisine) {
      query += ` AND cuisine_type = ?`;
      params.push(cuisine);
    }

    if (minRating) {
      query += ` AND rating >= ?`;
      params.push(parseFloat(minRating));
    }

    query += ` ORDER BY rating DESC, name ASC`;

    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Find a specific restaurant by ID
  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM restaurants WHERE id = ?', [id]);
    return rows[0];
  }

  // Create a new restaurant profile
  static async create({ name, description, address, phone, cuisineType, imageUrl, ownerId }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insert restaurant
      const [restResult] = await connection.execute(
        `INSERT INTO restaurants (name, description, address, phone, cuisine_type, image_url, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [name, description, address, phone, cuisineType, imageUrl || null]
      );
      
      const restaurantId = restResult.insertId;

      // Associate with owner
      await connection.execute(
        'INSERT INTO restaurant_owners (owner_id, restaurant_id) VALUES (?, ?)',
        [ownerId, restaurantId]
      );

      await connection.commit();
      return restaurantId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update restaurant profile
  static async update(id, { name, description, address, phone, cuisineType, imageUrl }) {
    const [result] = await db.execute(
      `UPDATE restaurants 
       SET name = ?, description = ?, address = ?, phone = ?, cuisine_type = ?, image_url = ? 
       WHERE id = ?`,
      [name, description, address, phone, cuisineType, imageUrl, id]
    );
    return result.affectedRows > 0;
  }

  // Get restaurants owned by a user
  static async getByOwnerId(ownerId) {
    const query = `
      SELECT r.* 
      FROM restaurants r
      JOIN restaurant_owners ro ON r.id = ro.restaurant_id
      WHERE ro.owner_id = ?
    `;
    const [rows] = await db.execute(query, [ownerId]);
    return rows;
  }

  // Get distinct list of cuisines (for filtering)
  static async getCuisines() {
    const [rows] = await db.execute(
      `SELECT DISTINCT cuisine_type FROM restaurants WHERE status = 'active' AND cuisine_type IS NOT NULL`
    );
    return rows.map(r => r.cuisine_type);
  }

  // Update rating (typically triggered on review post)
  static async updateAverageRating(restaurantId) {
    const query = `
      UPDATE restaurants r
      SET r.rating = COALESCE(
        (SELECT AVG(rating) FROM reviews WHERE restaurant_id = ?),
        0.0
      )
      WHERE r.id = ?
    `;
    await db.execute(query, [restaurantId, restaurantId]);
  }
}

module.exports = Restaurant;
