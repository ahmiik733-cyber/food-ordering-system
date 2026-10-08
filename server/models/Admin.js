const db = require('../config/db');

class Admin {
  // Get dashboard statistics (KPIs)
  static async getDashboardStats() {
    const stats = {};

    // 1. Total Users Count by Role
    const [userCounts] = await db.execute(
      'SELECT role, COUNT(*) AS count FROM users GROUP BY role'
    );
    stats.users = userCounts.reduce((acc, row) => {
      acc[row.role] = row.count;
      return acc;
    }, { customer: 0, owner: 0, delivery: 0, admin: 0 });
    
    // Add total users
    stats.users.total = Object.values(stats.users).reduce((a, b) => a + b, 0);

    // 2. Total Restaurants Count by Status
    const [restCounts] = await db.execute(
      'SELECT status, COUNT(*) AS count FROM restaurants GROUP BY status'
    );
    stats.restaurants = restCounts.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, { pending: 0, active: 0, suspended: 0 });
    stats.restaurants.total = Object.values(stats.restaurants).reduce((a, b) => a + b, 0);

    // 3. Orders Count and Sales Analytics
    const [orderStats] = await db.execute(`
      SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
      FROM orders
    `);
    stats.orders = orderStats[0];

    // 4. Sales by Cuisine Type
    const [cuisineSales] = await db.execute(`
      SELECT r.cuisine_type, COALESCE(SUM(o.total_amount), 0) AS sales
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.status = 'delivered'
      GROUP BY r.cuisine_type
    `);
    stats.cuisineSales = cuisineSales;

    // 5. Recent 5 Orders
    const [recentOrders] = await db.execute(`
      SELECT o.id, u.name AS customer_name, r.name AS restaurant_name, o.total_amount, o.status, o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN restaurants r ON o.restaurant_id = r.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);
    stats.recentOrders = recentOrders;

    return stats;
  }

  // List all users in system
  static async getAllUsers() {
    const [rows] = await db.execute(
      'SELECT id, name, email, role, phone, address, created_at FROM users ORDER BY role ASC, name ASC'
    );
    return rows;
  }

  // List all restaurants in system (for approvals panel)
  static async getAllRestaurants() {
    const [rows] = await db.execute(
      'SELECT * FROM restaurants ORDER BY status DESC, name ASC'
    );
    return rows;
  }

  // Update user role
  static async updateUserRole(userId, role) {
    const [result] = await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    return result.affectedRows > 0;
  }

  // Toggle restaurant status (approve, suspend, pending)
  static async updateRestaurantStatus(restaurantId, status) {
    const [result] = await db.execute(
      'UPDATE restaurants SET status = ? WHERE id = ?',
      [status, restaurantId]
    );
    return result.affectedRows > 0;
  }

  // Generate system report and store details in JSON
  static async generateReport(adminId, reportType) {
    const stats = await this.getDashboardStats();
    let details = {};

    if (reportType === 'sales') {
      details = {
        total_revenue: stats.orders.total_revenue,
        total_orders: stats.orders.total_orders,
        cuisine_breakdown: stats.cuisineSales,
        timestamp: new Date()
      };
    } else if (reportType === 'system') {
      details = {
        user_breakdown: stats.users,
        restaurant_breakdown: stats.restaurants,
        timestamp: new Date()
      };
    } else {
      // General report
      details = {
        overview: stats,
        timestamp: new Date()
      };
    }

    const [result] = await db.execute(
      'INSERT INTO reports (admin_id, report_type, details) VALUES (?, ?, ?)',
      [adminId, reportType, JSON.stringify(details)]
    );
    return {
      reportId: result.insertId,
      reportType,
      details
    };
  }

  // Fetch report logs
  static async getReportLogs() {
    const query = `
      SELECT r.id, r.report_type, r.generated_at, r.details, u.name AS generated_by
      FROM reports r
      JOIN users u ON r.admin_id = u.id
      ORDER BY r.generated_at DESC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }
}

module.exports = Admin;
