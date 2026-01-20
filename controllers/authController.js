const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_change_me', {
    expiresIn: '30d',
  });
};

exports.register = async (req, res) => {
  // console.log('Register request received:', req.body);
  try {
    const { username, password, firstName, lastName } = req.body;

    if (!username || !password || !firstName || !lastName) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'All fields (First Name, Last Name, Username, Password) are required',
        });
    }

    if (typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Password must be a string' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Manual Hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check for admin secret to create Super Admin user directly
    const role =
      req.body.adminSecret === (process.env.ADMIN_SECRET || 'rayyan_master_key')
        ? 'super_admin'
        : 'doctor';
    const accountStatus = role === 'super_admin' ? 'approved' : 'pending';

    const user = await User.create({
      firstName,
      lastName,
      username,
      password: hashedPassword,
      role,
      accountStatus,
    });

    if (user) {
      // If auto-approved (Super Admin), send token immediately
      if (accountStatus === 'approved') {
        res.status(201).json({
          success: true,
          token: generateToken(user._id),
          user: {
            id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
        });
      } else {
        // For Doctors, send "Pending" response without token
        res.status(201).json({
          success: true,
          message: 'Registration successful. Waiting for Admin Approval.',
          requiresApproval: true,
        });
      }
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error during registration',
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Check Account Status
      if (user.accountStatus === 'pending') {
        return res
          .status(403)
          .json({ success: false, message: 'Your account is pending approval by the Admin.' });
      }
      if (user.accountStatus === 'rejected') {
        return res
          .status(403)
          .json({ success: false, message: 'Your account has been rejected. Contact support.' });
      }

      // Success
      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role, // Send role to frontend for routing
          status: user.accountStatus,
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
