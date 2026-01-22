const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['super_admin', 'doctor'],
    default: 'doctor',
  },
  accountStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending', // Default pending for new registrations
  },
  subscription: {
    plan: {
      type: String,
      enum: ['trial', 'monthly', 'yearly', 'lifetime'],
      default: 'trial',
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    trialEndsAt: {
      type: Date,
    },
    subscriptionEndsAt: {
      type: Date,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Method to compare password (keep this if you want, or handle manually in controller)
// Ideally, we move all logic to controller to avoid implicit magic that is breaking
// But let's keep comparePassword as it just reads data, doesn't use hooks.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
