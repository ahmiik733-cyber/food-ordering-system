const Admin = require('../models/Admin');

// Get system overview statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const stats = await Admin.getDashboardStats();
    res.status(200).json({ stats });
  } catch (error) {
    next(error);
  }
};

// Get all registered users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await Admin.getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

// Get all registered restaurants (approvals panel)
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Admin.getAllRestaurants();
    res.status(200).json({ restaurants });
  } catch (error) {
    next(error);
  }
};

// Update a user's role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!role) {
      return res.status(400).json({ message: 'Role is required.' });
    }

    const success = await Admin.updateUserRole(userId, role);
    if (!success) {
      return res.status(404).json({ message: 'User not found or role unchanged.' });
    }

    res.status(200).json({ message: 'User role updated successfully.', role });
  } catch (error) {
    next(error);
  }
};

// Approve or Suspend a restaurant (change status)
exports.updateRestaurantStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'active', 'suspended', 'pending'
    const restaurantId = req.params.id;

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    const success = await Admin.updateRestaurantStatus(restaurantId, status);
    if (!success) {
      return res.status(404).json({ message: 'Restaurant not found or status unchanged.' });
    }

    res.status(200).json({ message: `Restaurant status updated to ${status}.`, status });
  } catch (error) {
    next(error);
  }
};

// Generate a system report (stored as JSON in Database)
exports.generateReport = async (req, res, next) => {
  try {
    const { reportType } = req.body; // 'sales', 'system', 'restaurant'

    if (!reportType) {
      return res.status(400).json({ message: 'Report type is required.' });
    }

    const report = await Admin.generateReport(req.user.id, reportType);
    res.status(218).json({ message: 'System report generated successfully.', report });
  } catch (error) {
    next(error);
  }
};

// Retrieve reports logs list
exports.getReports = async (req, res, next) => {
  try {
    const reports = await Admin.getReportLogs();
    res.status(200).json({ reports });
  } catch (error) {
    next(error);
  }
};
