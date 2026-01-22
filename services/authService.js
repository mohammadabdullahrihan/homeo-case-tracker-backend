const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_change_me', {
    expiresIn: '30d',
  });
};

const authService = {
  register: async (userData) => {
    const { username, password, firstName, lastName, adminSecret } = userData;

    const userExists = await User.findOne({ username });
    if (userExists) {
      throw new Error('User already exists');
    }

    // Manual Hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check for admin secret to create Super Admin user directly
    const role =
      adminSecret === (process.env.ADMIN_SECRET || 'rayyan_master_key')
        ? 'super_admin'
        : 'doctor';
        
    // Auto-approve and start trial for everyone
    const accountStatus = 'approved';
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const user = await User.create({
      firstName,
      lastName,
      username,
      password: hashedPassword,
      role,
      accountStatus,
      subscription: {
        plan: 'trial',
        status: 'active',
        trialEndsAt: trialEndsAt,
        subscriptionEndsAt: trialEndsAt,
      }
    });

    return {
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    };
  },

  login: async (username, password) => {
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    // Check Account Status
    if (user.accountStatus === 'pending') {
      throw new Error('Your account is pending approval by the Admin.');
    }
    if (user.accountStatus === 'rejected') {
      throw new Error('Your account has been rejected. Contact support.');
    }
    if (user.accountStatus === 'suspended') {
      throw new Error('Your account has been suspended. Contact support.');
    }

    return {
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.accountStatus,
      }
    };
  }
};

module.exports = authService;
