const db = require('../config/db');

class Payment {
  // Create a payment record
  static async create({ orderId, paymentMethod, transactionId, status, amount }) {
    const [result] = await db.execute(
      `INSERT INTO payments (order_id, payment_method, transaction_id, status, amount) 
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, paymentMethod, transactionId, status || 'pending', amount]
    );
    return result.insertId;
  }

  // Update payment status (e.g. from callback or verification)
  static async updateStatus(orderId, status) {
    const [result] = await db.execute(
      'UPDATE payments SET status = ? WHERE order_id = ?',
      [status, orderId]
    );
    return result.affectedRows > 0;
  }

  // Get transaction details for an order
  static async getByOrderId(orderId) {
    const [rows] = await db.execute(
      'SELECT * FROM payments WHERE order_id = ?',
      [orderId]
    );
    return rows[0];
  }

  // Get all transaction logs (Admin)
  static async getTransactionHistory() {
    const query = `
      SELECT p.*, o.user_id, u.name AS user_name, o.restaurant_id, r.name AS restaurant_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      JOIN restaurants r ON o.restaurant_id = r.id
      ORDER BY p.created_at DESC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }
}

module.exports = Payment;
