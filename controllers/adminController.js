const doctorService = require('../services/doctorService');
const analyticsService = require('../services/analyticsService');
const configService = require('../services/configService');
const { getActivityLogs, getActivityStats, logActivity } = require('../utils/activityLogger');
const { getSystemHealth, createBackup, exportDataToJSON, listBackups } = require('../utils/systemUtils');

// --- Doctor Management ---
const getDoctors = async (req, res) => {
  try {
    const data = await doctorService.getAllDoctorsWithStats();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDoctorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const data = await doctorService.updateStatus(id, status, req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDoctorSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, duration } = req.body;
    const data = await doctorService.updateSubscription(id, plan, duration, req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetDoctorPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    await doctorService.resetPassword(id, newPassword, req.user);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Analytics ---
const getAnalytics = async (req, res) => {
  try {
    const data = await analyticsService.getSystemStats();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- System Config ---
const getSystemConfig = async (req, res) => {
  try {
    const data = await configService.getConfig();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSystemConfig = async (req, res) => {
  try {
    const data = await configService.updateConfig(req.body, req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const setBroadcastMessage = async (req, res) => {
  try {
    const data = await configService.setBroadcast(req.body, req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Utilities ---
const getSystemHealthController = async (req, res) => {
    try {
      const health = await getSystemHealth();
      res.json({ success: true, data: health });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};

const getActivityLogsController = async (req, res) => {
    try {
      const { page, limit, userId, action, startDate, endDate } = req.query;
      const result = await getActivityLogs({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        userId,
        action,
        startDate,
        endDate,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};
  
const getActivityStatsController = async (req, res) => {
    try {
      const stats = await getActivityStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};

const createBackupController = async (req, res) => {
    try {
      const result = await createBackup();
      if (result.success) {
        await logActivity({
          userId: req.user.id,
          userRole: 'super_admin',
          action: 'backup_created',
          details: `Database backup created: ${result.size}`,
          metadata: result,
          req,
        });
      }
      res.json({ success: result.success, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};
  
const listBackupsController = async (req, res) => {
    try {
      const backups = await listBackups();
      res.json({ success: true, data: backups });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};
  
const exportDataController = async (req, res) => {
    try {
      const { model } = req.params;
      const result = await exportDataToJSON(model);
      if (result.success) {
        await logActivity({
          userId: req.user.id,
          userRole: 'super_admin',
          action: 'data_exported',
          details: `Exported ${model} data: ${result.recordCount} records`,
          metadata: result,
          req,
        });
        res.download(result.filepath, result.filename);
      } else {
        res.status(500).json({ success: false, message: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
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
};
