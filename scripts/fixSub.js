const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homeo-case-tracker';

async function fixSub() {
  try {
    await mongoose.connect(MONGODB_URI);

    const user = await User.findOne({ username: { $regex: /ziaul/i } });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    // Force update subscription
    user.subscription = {
      plan: 'trial',
      status: 'active',
      trialEndsAt: nextMonth,
      subscriptionEndsAt: nextMonth,
    };

    await user.save();
    console.log('✅ Subscription FIXED for:', user.username);
    console.log('📅 Valid until:', nextMonth);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fixSub();
