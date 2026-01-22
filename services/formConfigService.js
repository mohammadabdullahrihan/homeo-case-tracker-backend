const formConfigRepository = require('../repositories/formConfigRepository');

const formConfigService = {
  getConfig: async (userId) => {
    // 1. Try to find user-specific config
    let config = null;
    if (userId) {
      config = await formConfigRepository.findActiveConfig(userId);
    }

    // 2. If no user config, find global config
    if (!config) {
      config = await formConfigRepository.findActiveConfig(null);
    }

    if (!config) return null;

    const configData = config.toObject();
    configData.isGlobal = !config.user;
    return configData;
  },

  updateUserConfig: async (userId, sections) => {
    let config = await formConfigRepository.update(userId, sections);

    if (!config) {
      config = await formConfigRepository.create({
        user: userId,
        sections,
        version: 1,
        isActive: true,
      });
    }

    return config;
  },

  seedDefault: async () => {
    const count = await formConfigRepository.count();
    if (count > 0) throw new Error('Config already exists');

    const defaultSections = [
      {
        id: 'basic-data',
        title: 'মৌলিক তথ্য (Basic Data)',
        fields: [
          { id: 'name', label: 'রোগীর নাম', type: 'text', required: true },
          { id: 'age', label: 'বয়স', type: 'text', required: true },
          {
            id: 'sex',
            label: 'লিঙ্গ',
            type: 'mcq',
            renderAs: 'buttons',
            required: true,
            options: ['পুরুষ', 'মহিলা', 'শিশু'],
          },
        ],
      },
      {
        id: 'chief-complaints',
        title: 'প্রধান অভিযোগ (Chief Complaints)',
        fields: [
          { id: 'complaint', label: 'প্রধান সমস্যা ও তার বিবরণ', type: 'textarea', required: true },
        ],
      },
      {
        id: 'mental-symptoms',
        title: 'মানসিক লক্ষণ (Mental Symptoms)',
        fields: [{ id: 'mind', label: 'মানসিক অবস্থা, রাগ, ভয় বা দুশ্চিন্তা', type: 'textarea' }],
      },
      {
        id: 'physical-generals',
        title: 'শারীরিক সাধারণ লক্ষণ (Physical Generals)',
        fields: [
          {
            id: 'appetite',
            label: 'ক্ষুধা, তৃষ্ণা ও খাবারের প্রতি ইচ্ছা/অনিচ্ছা',
            type: 'textarea',
          },
          { id: 'thermal', label: 'গরমকাতরতা বা শীতকাতরতা (Thermal Relations)', type: 'text' },
        ],
      },
      {
        id: 'additional-info',
        title: 'অন্যান্য তথ্য (Additional Info)',
        fields: [
          { id: 'others', label: 'অন্য কোনো গুরুত্বপূর্ণ তথ্য বা পর্যবেক্ষণ', type: 'textarea' },
        ],
      },
    ];

    return await formConfigRepository.create({ sections: defaultSections, user: null });
  }
};

module.exports = formConfigService;
