const authService = require('../services/authService');

exports.register = async (req, res) => {
  try {
    const { username, password, firstName, lastName } = req.body;

    if (!username || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields (First Name, Last Name, Username, Password) are required',
      });
    }

    if (typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Password must be a string' });
    }

    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Server Error during registration',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const result = await authService.login(username, password);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Login Error:', error);
    const status = error.message.includes('Invalid') ? 401 : 403;
    res.status(status).json({ success: false, message: error.message });
  }
};
