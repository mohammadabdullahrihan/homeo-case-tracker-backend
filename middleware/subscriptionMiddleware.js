const User = require('../models/User');

const subscriptionMiddleware = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Super Admin bypass
        if (user.role === 'super_admin') {
            return next();
        }

        const now = new Date();
        const sub = user.subscription;

        // Check 1: Active Subscription
        if (sub && sub.status === 'active') {
            // If date is valid and in future
            if (sub.subscriptionEndsAt && new Date(sub.subscriptionEndsAt) > now) {
                return next();
            }
            // Even if date is missing but status is active (manual override), let them in for now to avoid lockout
            // Or if trial is active
        }

        // Check 2: Trial
        if (sub && sub.plan === 'trial') {
             if (sub.trialEndsAt && new Date(sub.trialEndsAt) > now) {
                return next();
             }
        }

        console.log(`[Subscription Blocked] User: ${user.username}, Role: ${user.role}`);
        console.log(`[Debug] Sub Info:`, sub);
        
        return res.status(403).json({ 
            success: false, 
            message: 'Subscription or Trial expired. Please renew.',
            debug: { status: sub?.status, plan: sub?.plan }
        });

    } catch (error) {
        console.error('Subscription Middleware Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = subscriptionMiddleware;
