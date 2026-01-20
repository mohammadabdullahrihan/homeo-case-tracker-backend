const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  // AI Configuration
  aiProvider: {
    type: String,
    enum: ['gemini', 'bytez', 'openai', 'claude'],
    default: 'bytez',
  },
  aiModel: {
    type: String,
    default: 'google/gemini-2.5-flash',
  },
  aiPrompt: {
    type: String,
    default: `You are a highly skilled homeopathic case analyzer. Analyze the patient data and provide:
1. A comprehensive case summary
2. Extracted symptoms with clinical and friendly names
3. Top 10 remedy suggestions with scores
4. Miasmatic analysis
5. Potency and repetition advice
6. Clinical advice (diet, regimen)
7. Biochemic suggestions
8. Cross-discipline insights
9. Diagnostic recommendations`,
  },

  // Subscription Plans
  subscriptionPlans: {
    trial: {
      duration: { type: Number, default: 30 }, // days
      price: { type: Number, default: 0 },
    },
    monthly: {
      duration: { type: Number, default: 30 },
      price: { type: Number, default: 499 },
    },
    yearly: {
      duration: { type: Number, default: 365 },
      price: { type: Number, default: 4999 },
    },
    lifetime: {
      duration: { type: Number, default: 36500 }, // 100 years
      price: { type: Number, default: 19999 },
    },
  },

  // Broadcast Messages
  broadcastMessage: {
    active: { type: Boolean, default: false },
    message: { type: String, default: '' },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error'],
      default: 'info',
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
  },

  // System Maintenance
  maintenanceMode: {
    type: Boolean,
    default: false,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
