// Utility: Seed database with sample data (or check DB state)
// Usage:
//   node fix_db.js          — seeds sample data (clears existing)
//   node fix_db.js --check  — only checks DB status without modifying
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const checkOnly = process.argv.includes('--check');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'food_order_db',
    multipleStatements: true
  });

  console.log('✅ Connected to database:', process.env.DB_NAME || 'food_order_db');

  if (!checkOnly) {
    const sqlFile = path.join(__dirname, 'database', 'sample_data.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('📂 Loading sample_data.sql...');
    await conn.query(sql);
    console.log('✅ Sample data loaded successfully!');

    // Also expand image_url columns to TEXT (safe to run multiple times)
    await conn.execute(`ALTER TABLE restaurants MODIFY COLUMN image_url TEXT`);
    await conn.execute(`ALTER TABLE food_items MODIFY COLUMN image_url TEXT`);
    console.log('✅ image_url columns set to TEXT.');
  }

  // Status report
  const [users] = await conn.execute('SELECT COUNT(*) AS cnt FROM users');
  const [restaurants] = await conn.execute('SELECT COUNT(*) AS cnt FROM restaurants');
  const [foodItems] = await conn.execute('SELECT COUNT(*) AS cnt FROM food_items');
  const [categories] = await conn.execute('SELECT COUNT(*) AS cnt FROM food_categories');

  console.log(`\n📊 Database Status:`);
  console.log(`   Users:           ${users[0].cnt}`);
  console.log(`   Restaurants:     ${restaurants[0].cnt}`);
  console.log(`   Food Categories: ${categories[0].cnt}`);
  console.log(`   Food Items:      ${foodItems[0].cnt}`);

  const [rests] = await conn.execute('SELECT id, name, status, cuisine_type FROM restaurants');
  console.log(`\n🍽️  Restaurants:`);
  rests.forEach(r => console.log(`   #${r.id} [${r.status.toUpperCase()}] ${r.name} — ${r.cuisine_type}`));

  await conn.end();

  if (!checkOnly) {
    console.log('\n✅ Done! Open http://localhost:3000 to see your restaurants and menus.');
  }
}

run().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
