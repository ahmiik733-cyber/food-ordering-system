const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, isAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role check
router.use(auth);
router.use(isAdmin);

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/restaurants', adminController.getAllRestaurants);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/restaurant/:id/status', adminController.updateRestaurantStatus);
router.post('/report', adminController.generateReport);
router.get('/reports', adminController.getReports);

module.exports = router;
