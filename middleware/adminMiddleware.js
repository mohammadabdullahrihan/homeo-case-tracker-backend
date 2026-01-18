const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const user = await User.findById(req.user.id);

        if (user && user.role === 'super_admin') {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Access denied: Super Admin only' });
        }
    } catch (error) {
        console.error('Admin Middleware Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = adminMiddleware;
