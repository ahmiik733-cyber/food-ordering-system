const db = require('../config/db');

class Cart {
  // Get or create user cart ID
  static async getCartId(userId) {
    let [rows] = await db.execute('SELECT id FROM cart WHERE user_id = ?', [userId]);
    if (rows.length === 0) {
      const [result] = await db.execute('INSERT INTO cart (user_id) VALUES (?)', [userId]);
      return result.insertId;
    }
    return rows[0].id;
  }

  // Get all items in a user's cart
  static async getItems(userId) {
    const cartId = await this.getCartId(userId);
    const query = `
      SELECT ci.id AS cart_item_id, ci.food_item_id, ci.quantity, 
             fi.name, fi.price, fi.image_url, fi.is_available,
             fc.restaurant_id, r.name AS restaurant_name
      FROM cart_items ci
      JOIN food_items fi ON ci.food_item_id = fi.id
      JOIN food_categories fc ON fi.category_id = fc.id
      JOIN restaurants r ON fc.restaurant_id = r.id
      WHERE ci.cart_id = ?
    `;
    const [rows] = await db.execute(query, [cartId]);
    return rows;
  }

  // Add item to cart (with restaurant validation)
  static async addItem(userId, foodItemId, quantity) {
    const cartId = await this.getCartId(userId);
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Find restaurant of the new food item
      const [foodRows] = await connection.execute(
        `SELECT fc.restaurant_id 
         FROM food_items fi 
         JOIN food_categories fc ON fi.category_id = fc.id 
         WHERE fi.id = ?`,
        [foodItemId]
      );

      if (foodRows.length === 0) {
        throw new Error('Food item not found.');
      }
      const newRestaurantId = foodRows[0].restaurant_id;

      // Find restaurant of existing cart items
      const [existingRows] = await connection.execute(
        `SELECT fc.restaurant_id 
         FROM cart_items ci 
         JOIN food_items fi ON ci.food_item_id = fi.id 
         JOIN food_categories fc ON fi.category_id = fc.id 
         WHERE ci.cart_id = ? LIMIT 1`,
        [cartId]
      );

      // If restaurant is different, clear existing cart items
      if (existingRows.length > 0 && existingRows[0].restaurant_id !== newRestaurantId) {
        await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
      }

      // Check if item already exists in cart
      const [itemRows] = await connection.execute(
        'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND food_item_id = ?',
        [cartId, foodItemId]
      );

      if (itemRows.length > 0) {
        // Update quantity
        const newQty = itemRows[0].quantity + quantity;
        await connection.execute(
          'UPDATE cart_items SET quantity = ? WHERE id = ?',
          [newQty, itemRows[0].id]
        );
      } else {
        // Insert new item
        await connection.execute(
          'INSERT INTO cart_items (cart_id, food_item_id, quantity) VALUES (?, ?, ?)',
          [cartId, foodItemId, quantity]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update item quantity in cart
  static async updateQuantity(userId, foodItemId, quantity) {
    const cartId = await this.getCartId(userId);
    if (quantity <= 0) {
      return this.removeItem(userId, foodItemId);
    }
    const [result] = await db.execute(
      'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND food_item_id = ?',
      [quantity, cartId, foodItemId]
    );
    return result.affectedRows > 0;
  }

  // Remove item from cart
  static async removeItem(userId, foodItemId) {
    const cartId = await this.getCartId(userId);
    const [result] = await db.execute(
      'DELETE FROM cart_items WHERE cart_id = ? AND food_item_id = ?',
      [cartId, foodItemId]
    );
    return result.affectedRows > 0;
  }

  // Clear cart
  static async clear(userId) {
    const cartId = await this.getCartId(userId);
    const [result] = await db.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    return result.affectedRows > 0;
  }
}

module.exports = Cart;
