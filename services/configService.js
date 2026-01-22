const systemConfigRepository = require('../repositories/systemConfigRepository');
const { logActivity } = require('../utils/activityLogger');

const configService = {
  getConfig: async () => {
    let config = await systemConfigRepository.getConfig();
    if (!config) config = await systemConfigRepository.createConfig({});
    return config;
  },

  updateConfig: async (updates, adminUser) => {
    const config = await systemConfigRepository.updateConfig(updates);
    
    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        userRole: 'super_admin',
        action: 'system_config_updated',
        details: 'System configuration updated',
        metadata: updates
      });
    }

    return config;
  },

  setBroadcast: async (broadcastData, adminUser) => {
    const { message, type, active, expiresInMinutes } = broadcastData;
    let config = await systemConfigRepository.getConfig();
    if (!config) config = await systemConfigRepository.createConfig({});

    const expiresAt = expiresInMinutes ? new Date(Date.now() + expiresInMinutes * 60 * 1000) : null;
    
    config.broadcastMessage = {
      active: active !== undefined ? active : true,
      message,
      type: type || 'info',
      createdAt: new Date(),
      expiresAt,
    };
    
    await config.save();

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        userRole: 'super_admin',
        action: 'broadcast_sent',
        details: `Broadcast message sent: ${message.substring(0, 50)}...`,
        metadata: { type, message }
      });
    }

    return config.broadcastMessage;
  }
};

module.exports = configService;
