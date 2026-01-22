const SystemConfig = require('../models/SystemConfig');

const systemConfigRepository = {
  getConfig: async () => {
    return SystemConfig.findOne();
  },

  createConfig: async (data) => {
    return SystemConfig.create(data);
  },

  updateConfig: async (userData) => { 
      // Note: SystemConfig usually is a single document, so we might need a more specific update strategy 
      // if using findOneAndUpdate, but here we likely fetch -> assign -> save in service or stick to findOne
      // For repository pattern, let's assume we pass the document or ID. 
      // Simplified:
      let config = await SystemConfig.findOne();
      if (!config) {
          config = await SystemConfig.create(userData);
      } else {
          Object.assign(config, userData);
          await config.save();
      }
      return config;
  }
};

module.exports = systemConfigRepository;
