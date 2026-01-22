const formConfigService = require('../services/formConfigService');

exports.getConfig = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const config = await formConfigService.getConfig(userId);

    if (!config) {
      return res.status(200).json({ success: true, config: null, message: 'No configuration found' });
    }

    res.status(200).json({ success: true, config });
  } catch (error) {
    console.error('Error in getConfig:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { sections } = req.body;
    const config = await formConfigService.updateUserConfig(req.user.id, sections);
    res.status(200).json({ success: true, config });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.seedConfig = async (req, res) => {
  try {
    const config = await formConfigService.seedDefault();
    res.status(201).json({ success: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
