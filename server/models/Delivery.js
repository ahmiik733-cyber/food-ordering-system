const db = require('../config/db');

class Delivery {
  // Assign delivery staff to an order
  static async assign(orderId, deliveryStaffId, estMinutes = 30) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Set est timestamp
      const estimatedTime = new Date(Date.now() + estMinutes * 60000);

      // Check if delivery assignment exists
      const [exists] = await connection.execute('SELECT id FROM deliveries WHERE order_id = ?', [orderId]);
      
      if (exists.length > 0) {
        await connection.execute(
          `UPDATE deliveries 
           SET delivery_staff_id = ?, status = 'assigned', estimated_delivery_time = ? 
           WHERE order_id = ?`,
          [deliveryStaffId, estimatedTime, orderId]
        );
      } else {
        await connection.execute(
          `INSERT INTO deliveries (order_id, delivery_staff_id, status, estimated_delivery_time) 
           VALUES (?, ?, 'assigned', ?)`,
          [orderId, deliveryStaffId, estimatedTime]
        );
      }

      // Mark delivery staff as busy
      await connection.execute(
        "UPDATE delivery_staff SET status = 'busy' WHERE user_id = ?",
        [deliveryStaffId]
      );

      // Update order status to out_for_delivery or preparing (usually when assigned it becomes preparing or out_for_delivery depending on the flow)
      // We will let the controller manage order status changes, but setting delivery staff busy is core.
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update delivery status
  static async updateStatus(orderId, status) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      let query = 'UPDATE deliveries SET status = ?';
      const params = [status];

      if (status === 'delivered') {
        query += ', actual_delivery_time = CURRENT_TIMESTAMP';
      }

      query += ' WHERE order_id = ?';
      params.push(orderId);

      const [result] = await connection.execute(query, params);

      // If delivered, mark delivery staff back to available and update order status
      if (status === 'delivered') {
        const [deliveryRows] = await connection.execute(
          'SELECT delivery_staff_id FROM deliveries WHERE order_id = ?',
          [orderId]
        );
        if (deliveryRows.length > 0 && deliveryRows[0].delivery_staff_id) {
          await connection.execute(
            "UPDATE delivery_staff SET status = 'available' WHERE user_id = ?",
            [deliveryRows[0].delivery_staff_id]
          );
        }
        await connection.execute(
          "UPDATE orders SET status = 'delivered' WHERE id = ?",
          [orderId]
        );
      } else if (status === 'picked_up') {
        await connection.execute(
          "UPDATE orders SET status = 'out_for_delivery' WHERE id = ?",
          [orderId]
        );
      }

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get available delivery staff
  static async getAvailableStaff() {
    const query = `
      SELECT ds.user_id, u.name, u.phone, ds.vehicle_type 
      FROM delivery_staff ds
      JOIN users u ON ds.user_id = u.id
      WHERE ds.status = 'available'
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  // Update delivery staff profile status (available, offline, etc.)
  static async updateStaffStatus(userId, status, vehicleType = null) {
    let query = 'UPDATE delivery_staff SET status = ?';
    const params = [status];
    if (vehicleType) {
      query += ', vehicle_type = ?';
      params.push(vehicleType);
    }
    query += ' WHERE user_id = ?';
    params.push(userId);

    const [result] = await db.execute(query, params);
    return result.affectedRows > 0;
  }

  // Get current delivery staff status info
  static async getStaffStatus(userId) {
    const query = `
      SELECT ds.status, ds.vehicle_type, u.name, u.email, u.phone 
      FROM delivery_staff ds
      JOIN users u ON ds.user_id = u.id
      WHERE ds.user_id = ?
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows[0];
  }
}

module.exports = Delivery;
