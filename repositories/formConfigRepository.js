const FormConfig = require('../models/FormConfig');

const formConfigRepository = {
  findActiveConfig: async (userId) => {
    return FormConfig.findOne({ user: userId, isActive: true }).sort({ version: -1 });
  },

  create: async (data) => {
    return FormConfig.create(data);
  },

  update: async (userId, sections) => {
    let config = await FormConfig.findOne({ user: userId, isActive: true });
    if (config) {
      config.sections = sections;
      config.version = config.version + 1;
      config.updatedAt = Date.now();
      return config.save();
    }
    return null;
  },

  count: async (filter = {}) => {
    return FormConfig.countDocuments(filter);
  }
};

module.exports = formConfigRepository;
