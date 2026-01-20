const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userRole: {
    type: String,
    enum: ['super_admin', 'doctor'],
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Admin Actions
      'doctor_approved',
      'doctor_rejected',
      'doctor_suspended',
      'subscription_updated',
      'password_reset',
      'system_config_updated',
      'broadcast_sent',
      'backup_created',

      // Doctor Actions
      'login',
      'logout',
      'case_created',
      'case_updated',
      'case_deleted',
      'case_analyzed',
      'profile_updated',
    ],
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  targetCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
  },
  details: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index for faster queries
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
