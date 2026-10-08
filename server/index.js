const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Configs and Middleware imports
const pool = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurant');
const foodRoutes = require('./routes/food');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment');
const deliveryRoutes = require('./routes/delivery');
const reviewRoutes = require('./routes/review');
const adminRoutes = require('./routes/admin');

// Express App Initialization
const app = express();
const PORT = process.env.PORT || 3000;

// Apply Middlewares
app.use(cors()); // Allow requests from any origin (e.g. client pages running locally)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve client HTML pages as static files (fixes CORS & file:// issues)
const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'client')));

// Mount REST API Routers
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'Food Order & Restaurant Management API'
  });
});

// Root Route — serve the client landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Silence browser's automatic favicon.ico request (avoids noisy 404 error logs)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// 404 Route handler
app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
});

// Mount Global Error Handling Middleware
app.use(errorHandler);

// Launch Web Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
  console.log(`🌐 Open in browser:  http://localhost:${PORT}`);
  console.log(`🔗 API Health:       http://localhost:${PORT}/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Run this command to free it:  npx kill-port ${PORT}`);
    console.error(`   Then run:  npm start\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
