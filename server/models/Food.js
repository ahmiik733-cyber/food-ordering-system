const db = require('../config/db');

class Food {
  // Get all categories for a restaurant
  static async getCategoriesByRestaurant(restaurantId) {
    const [rows] = await db.execute(
      'SELECT * FROM food_categories WHERE restaurant_id = ? ORDER BY name ASC',
      [restaurantId]
    );
    return rows;
  }

  // Add a new food category
  static async addCategory(restaurantId, name) {
    const [result] = await db.execute(
      'INSERT INTO food_categories (restaurant_id, name) VALUES (?, ?)',
      [restaurantId, name]
    );
    return result.insertId;
  }

  // Get food items by category
  static async getItemsByCategory(categoryId) {
    const [rows] = await db.execute(
      'SELECT * FROM food_items WHERE category_id = ? ORDER BY name ASC',
      [categoryId]
    );
    return rows;
  }

  // Get all food items for a restaurant (structured by category)
  static async getMenu(restaurantId) {
    const query = `
      SELECT fi.*, fc.name AS category_name, fc.id AS category_id
      FROM food_items fi
      JOIN food_categories fc ON fi.category_id = fc.id
      WHERE fc.restaurant_id = ?
      ORDER BY fc.name ASC, fi.name ASC
    `;
    const [rows] = await db.execute(query, [restaurantId]);
    return rows;
  }

  // Find a specific food item
  static async getItemById(id) {
    const [rows] = await db.execute('SELECT * FROM food_items WHERE id = ?', [id]);
    return rows[0];
  }

  // Add a new food item
  static async addItem({ categoryId, name, description, price, imageUrl, isAvailable }) {
    const availability = isAvailable !== undefined ? isAvailable : true;
    const [result] = await db.execute(
      `INSERT INTO food_items (category_id, name, description, price, image_url, is_available) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [categoryId, name, description, price, imageUrl || null, availability]
    );
    return result.insertId;
  }

  // Update a food item
  static async updateItem(id, { name, description, price, imageUrl, isAvailable }) {
    const [result] = await db.execute(
      `UPDATE food_items 
       SET name = ?, description = ?, price = ?, image_url = ?, is_available = ? 
       WHERE id = ?`,
      [name, description, price, imageUrl, isAvailable, id]
    );
    return result.affectedRows > 0;
  }

  // Toggle availability status of a food item
  static async toggleAvailability(id, isAvailable) {
    const [result] = await db.execute(
      'UPDATE food_items SET is_available = ? WHERE id = ?',
      [isAvailable ? 1 : 0, id]
    );
    return result.affectedRows > 0;
  }

  // Delete a food item
  static async deleteItem(id) {
    const [result] = await db.execute('DELETE FROM food_items WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Food;
