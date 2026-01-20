const express = require('express');
const router = express.Router();
const {
  getDoctors,
  updateDoctorStatus,
  updateDoctorSubscription,
  resetDoctorPassword,
  getAnalytics,
  getSystemConfig,
  updateSystemConfig,
  setBroadcastMessage,
  getActivityLogsController,
  getActivityStatsController,
  getSystemHealthController,
  createBackupController,
  listBackupsController,
  exportDataController,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Protect all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Doctor Management
router.get('/doctors', getDoctors);
router.put('/doctor/:id/status', updateDoctorStatus);
router.put('/doctor/:id/subscription', updateDoctorSubscription);
router.put('/doctor/:id/reset-password', resetDoctorPassword);

// Analytics
router.get('/analytics', getAnalytics);

// System Configuration
router.get('/system-config', getSystemConfig);
router.put('/system-config', updateSystemConfig);

// Broadcast
router.post('/broadcast', setBroadcastMessage);

// Activity Logs
router.get('/activity-logs', getActivityLogsController);
router.get('/activity-stats', getActivityStatsController);

// System Health
router.get('/system-health', getSystemHealthController);

// Backup & Export
router.post('/backup', createBackupController);
router.get('/backups', listBackupsController);
router.get('/export/:model', exportDataController);

module.exports = router;
