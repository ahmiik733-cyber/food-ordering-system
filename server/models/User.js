const db = require('../config/db');

class User {
  // Find user by email
  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  // Find user by ID (excluding password_hash)
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Create a new user (during registration)
  static async create({ name, email, passwordHash, role, phone, address }) {
    const userRole = role || 'customer';
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, userRole, phone, address || null]
    );
    
    // Auto-create a cart if the user is a customer
    if (userRole === 'customer') {
      await db.execute('INSERT INTO cart (user_id) VALUES (?)', [result.insertId]);
    }
    
    // Auto-create delivery_staff profile if role is delivery
    if (userRole === 'delivery') {
      await db.execute('INSERT INTO delivery_staff (user_id, status) VALUES (?, ?)', [result.insertId, 'offline']);
    }

    return result.insertId;
  }

  // Update user profile
  static async updateProfile(id, { name, phone, address }) {
    const [result] = await db.execute(
      'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
      [name, phone, address, id]
    );
    return result.affectedRows > 0;
  }

  // Retrieve user order history
  static async getOrderHistory(userId) {
    const query = `
      SELECT o.id, o.restaurant_id, r.name AS restaurant_name, o.total_amount, o.status, o.created_at 
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
  }
}

module.exports = User;
