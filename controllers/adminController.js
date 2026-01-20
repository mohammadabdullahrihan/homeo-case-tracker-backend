const User = require('../models/User');
const Case = require('../models/Case');
const SystemConfig = require('../models/SystemConfig');
const { logActivity, getActivityLogs, getActivityStats } = require('../utils/activityLogger');
const {
  getSystemHealth,
  createBackup,
  exportDataToJSON,
  listBackups,
} = require('../utils/systemUtils');

// Get all doctors with detailed stats
const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).sort({ createdAt: -1 });

    // Get case count for each doctor
    const doctorsWithStats = await Promise.all(
      doctors.map(async (doctor) => {
        const caseCount = await Case.countDocuments({ user: doctor._id });
        const lastCase = await Case.findOne({ user: doctor._id }).sort({ createdAt: -1 });

        return {
          ...doctor.toObject(),
          stats: {
            totalCases: caseCount,
            lastCaseDate: lastCase?.createdAt || null,
          },
        };
      })
    );

    res.json({ success: true, data: doctorsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update doctor status (approve/reject/suspend)
const updateDoctorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const doctor = await User.findById(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    doctor.accountStatus = status;

    // Initialize subscription if it doesn't exist
    if (!doctor.subscription) {
      doctor.subscription = {
        plan: 'trial',
        status: 'inactive',
        trialEndsAt: null,
        subscriptionEndsAt: null
      };
    }

    // If approving, start trial
    if (status === 'approved' && doctor.subscription.plan === 'trial') {
      const trialDays = 30;
      doctor.subscription.status = 'active';
      doctor.subscription.trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
      doctor.subscription.subscriptionEndsAt = new Date(
        Date.now() + trialDays * 24 * 60 * 60 * 1000
      );
    }

    // If rejecting, cancel subscription
    if (status === 'rejected' && doctor.subscription) {
      doctor.subscription.status = 'cancelled';
    }

    await doctor.save();

    // Log activity
    await logActivity({
      userId: req.user.id,
      userRole: 'super_admin',
      action:
        status === 'approved'
          ? 'doctor_approved'
          : status === 'rejected'
            ? 'doctor_rejected'
            : 'doctor_suspended',
      targetUserId: id,
      details: `Doctor ${doctor.firstName} ${doctor.lastName} status changed to ${status}`,
      req,
    });

    res.json({ success: true, data: doctor });
  } catch (error) {
    console.error('Error updating doctor status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update doctor subscription manually
const updateDoctorSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, duration } = req.body; // plan: 'monthly', 'yearly', 'lifetime', duration: custom days

    const doctor = await User.findById(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Initialize subscription if it doesn't exist
    if (!doctor.subscription) {
      doctor.subscription = {
        plan: 'trial',
        status: 'inactive',
        trialEndsAt: null,
        subscriptionEndsAt: null
      };
    }

    doctor.subscription.plan = plan;
    doctor.subscription.status = 'active';

    let durationDays = duration;
    if (!durationDays) {
      if (plan === 'trial') durationDays = 30;
      else if (plan === 'monthly') durationDays = 30;
      else if (plan === 'yearly') durationDays = 365;
      else if (plan === 'lifetime')
        durationDays = 36500; // 100 years
      else durationDays = 30;
    }
    doctor.subscription.subscriptionEndsAt = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000
    );

    await doctor.save();

    // Log activity
    await logActivity({
      userId: req.user.id,
      userRole: 'super_admin',
      action: 'subscription_updated',
      targetUserId: id,
      details: `Subscription updated to ${plan} for ${doctor.firstName} ${doctor.lastName}`,
      metadata: { plan, duration: durationDays },
      req,
    });

    res.json({ success: true, data: doctor });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset doctor password
const resetDoctorPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const doctor = await User.findById(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const bcrypt = require('bcryptjs');
    doctor.password = await bcrypt.hash(newPassword, 10);
    await doctor.save();

    // Log activity
    await logActivity({
      userId: req.user.id,
      userRole: 'super_admin',
      action: 'password_reset',
      targetUserId: id,
      details: `Password reset for ${doctor.firstName} ${doctor.lastName}`,
      req,
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get system analytics
const getAnalytics = async (req, res) => {
  try {
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const pendingDoctors = await User.countDocuments({ role: 'doctor', accountStatus: 'pending' });
    const approvedDoctors = await User.countDocuments({
      role: 'doctor',
      accountStatus: 'approved',
    });
    const activeTrial = await User.countDocuments({
      role: 'doctor',
      'subscription.plan': 'trial',
      'subscription.status': 'active',
    });
    const paidSubscribers = await User.countDocuments({
      role: 'doctor',
      'subscription.plan': { $in: ['monthly', 'yearly', 'lifetime'] },
      'subscription.status': 'active',
    });

    const totalCases = await Case.countDocuments();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCases = await Case.countDocuments({ createdAt: { $gte: startOfToday } });
    
    // Exact revenue calculation from active subscriptions
    const monthlySubs = await User.countDocuments({ role: 'doctor', 'subscription.plan': 'monthly', 'subscription.status': 'active' });
    const yearlySubs = await User.countDocuments({ role: 'doctor', 'subscription.plan': 'yearly', 'subscription.status': 'active' });
    const lifetimeSubs = await User.countDocuments({ role: 'doctor', 'subscription.plan': 'lifetime', 'subscription.status': 'active' });
    const totalRevenue = (monthlySubs * 500) + (yearlySubs * 5000) + (lifetimeSubs * 15000);

    // Monthly growth (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyGrowth = await User.aggregate([
      {
        $match: {
          role: 'doctor',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalDoctors,
          pendingDoctors,
          approvedDoctors,
          activeTrial,
          paidSubscribers,
          totalCases,
          todayCases,
          totalRevenue,
        },
        monthlyGrowth,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get/Update System Configuration
const getSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSystemConfig = async (req, res) => {
  try {
    const updates = req.body;

    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create(updates);
    } else {
      Object.assign(config, updates);
      config.updatedAt = new Date();
      await config.save();

      // Log activity
      await logActivity({
        userId: req.user.id,
        userRole: 'super_admin',
        action: 'system_config_updated',
        details: 'System configuration updated',
        metadata: updates,
        req,
      });
    }

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Broadcast message to all doctors
const setBroadcastMessage = async (req, res) => {
  try {
    const { message, type, active, expiresInMinutes } = req.body;

    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }

    const expiresAt = expiresInMinutes ? new Date(Date.now() + expiresInMinutes * 60 * 1000) : null;

    config.broadcastMessage = {
      active: active !== undefined ? active : true,
      message,
      type: type || 'info',
      createdAt: new Date(),
      expiresAt,
    };

    await config.save();

    // Log activity
    await logActivity({
      userId: req.user.id,
      userRole: 'super_admin',
      action: 'broadcast_sent',
      details: `Broadcast message sent: ${message.substring(0, 50)}...`,
      metadata: { type, message },
      req,
    });

    res.json({ success: true, data: config.broadcastMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Activity Logs endpoints
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

// System Health endpoint
const getSystemHealthController = async (req, res) => {
  try {
    const health = await getSystemHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Backup endpoints
const createBackupController = async (req, res) => {
  try {
    const result = await createBackup();

    if (result.success) {
      // Log activity
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
    const { model } = req.params; // 'User' or 'Case'
    const result = await exportDataToJSON(model);

    if (result.success) {
      // Log activity
      await logActivity({
        userId: req.user.id,
        userRole: 'super_admin',
        action: 'data_exported',
        details: `Exported ${model} data: ${result.recordCount} records`,
        metadata: result,
        req,
      });

      // Send file for download
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
