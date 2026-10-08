const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool matching user's requested environment variable names
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'food_order_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection and log data status
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully directly through Connection Pool.');

    // Warn if DB is empty (sample_data.sql may not have been loaded)
    const [rows] = await connection.execute('SELECT COUNT(*) AS cnt FROM restaurants');
    const count = rows[0].cnt;
    if (count === 0) {
      console.warn('⚠️  WARNING: No restaurants found in DB. Run: node fix_db.js  to seed sample data.');
    } else {
      console.log(`📦 DB has ${count} restaurant(s) ready.`);
    }

    connection.release();
  } catch (error) {
    console.error('❌ Database connection failure. Please review credentials inside .env.');
    console.error(error.message);
  }
};

testConnection();

module.exports = pool;
