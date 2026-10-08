const db = require('../config/db');

class Order {
  // Place an order using transactional safety
  static async place(userId, { deliveryAddress, contactPhone }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Get cart items
      const [cartItems] = await connection.execute(
        `SELECT ci.food_item_id, ci.quantity, fi.price, fc.restaurant_id 
         FROM cart_items ci
         JOIN food_items fi ON ci.food_item_id = fi.id
         JOIN food_categories fc ON fi.category_id = fc.id
         JOIN cart c ON ci.cart_id = c.id
         WHERE c.user_id = ?`,
        [userId]
      );

      if (cartItems.length === 0) {
        throw new Error('Your cart is empty.');
      }

      const restaurantId = cartItems[0].restaurant_id;

      // 2. Calculate total amount
      let totalAmount = 0;
      cartItems.forEach(item => {
        totalAmount += parseFloat(item.price) * item.quantity;
      });

      // 3. Create order record
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (user_id, restaurant_id, total_amount, status, delivery_address, contact_phone) 
         VALUES (?, ?, ?, 'placed', ?, ?)`,
        [userId, restaurantId, totalAmount, deliveryAddress, contactPhone]
      );
      const orderId = orderResult.insertId;

      // 4. Create order items records
      for (const item of cartItems) {
        await connection.execute(
          `INSERT INTO order_items (order_id, food_item_id, quantity, price_at_order) 
           VALUES (?, ?, ?, ?)`,
          [orderId, item.food_item_id, item.quantity, item.price]
        );
      }

      // 5. Clear user cart
      const [cartRows] = await connection.execute('SELECT id FROM cart WHERE user_id = ?', [userId]);
      if (cartRows.length > 0) {
        await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartRows[0].id]);
      }

      await connection.commit();
      return orderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get order profile and order items
  static async getDetails(orderId) {
    const orderQuery = `
      SELECT o.id, o.user_id, u.name AS user_name, o.restaurant_id, r.name AS restaurant_name, 
             o.total_amount, o.status, o.delivery_address, o.contact_phone, o.created_at,
             p.status AS payment_status, p.payment_method
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.id = ?
    `;
    const [orderRows] = await db.execute(orderQuery, [orderId]);
    if (orderRows.length === 0) return null;

    const itemsQuery = `
      SELECT oi.id, oi.food_item_id, fi.name AS food_name, oi.quantity, oi.price_at_order, fi.image_url
      FROM order_items oi
      JOIN food_items fi ON oi.food_item_id = fi.id
      WHERE oi.order_id = ?
    `;
    const [itemRows] = await db.execute(itemsQuery, [orderId]);

    // Check delivery info if assigned
    const [deliveryRows] = await db.execute(
      `SELECT d.id AS delivery_id, d.delivery_staff_id, u.name AS delivery_name, u.phone AS delivery_phone, 
              d.status AS delivery_status, d.estimated_delivery_time
       FROM deliveries d
       LEFT JOIN users u ON d.delivery_staff_id = u.id
       WHERE d.order_id = ?`,
      [orderId]
    );

    return {
      ...orderRows[0],
      items: itemRows,
      delivery: deliveryRows[0] || null
    };
  }

  // Update order status
  static async updateStatus(orderId, status) {
    const [result] = await db.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    return result.affectedRows > 0;
  }

  // Get orders by Restaurant ID (for Owners)
  static async getByRestaurant(restaurantId) {
    const query = `
      SELECT o.id, o.user_id, u.name AS user_name, o.total_amount, o.status, o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.restaurant_id = ?
      ORDER BY o.created_at DESC
    `;
    const [rows] = await db.execute(query, [restaurantId]);
    return rows;
  }

  // Get orders assigned to a delivery person
  static async getByDeliveryStaff(deliveryStaffId) {
    const query = `
      SELECT o.id, o.user_id, u.name AS customer_name, o.restaurant_id, r.name AS restaurant_name,
             r.address AS restaurant_address, o.delivery_address, o.total_amount, o.status,
             d.status AS delivery_status, d.estimated_delivery_time
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN deliveries d ON o.id = d.order_id
      WHERE d.delivery_staff_id = ?
      ORDER BY o.created_at DESC
    `;
    const [rows] = await db.execute(query, [deliveryStaffId]);
    return rows;
  }
}

module.exports = Order;
