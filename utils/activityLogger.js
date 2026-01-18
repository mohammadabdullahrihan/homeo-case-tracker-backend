const ActivityLog = require('../models/ActivityLog');

/**
 * Log an activity
 * @param {Object} params - Activity parameters
 * @param {String} params.userId - User who performed the action
 * @param {String} params.userRole - Role of the user (super_admin/doctor)
 * @param {String} params.action - Action performed
 * @param {String} params.targetUserId - Target user (if applicable)
 * @param {String} params.targetCaseId - Target case (if applicable)
 * @param {String} params.details - Human-readable description
 * @param {Object} params.metadata - Additional data
 * @param {Object} params.req - Express request object (for IP and user agent)
 */
const logActivity = async ({
    userId,
    userRole,
    action,
    targetUserId = null,
    targetCaseId = null,
    details = '',
    metadata = {},
    req = null
}) => {
    try {
        const logData = {
            user: userId,
            userRole,
            action,
            targetUser: targetUserId,
            targetCase: targetCaseId,
            details,
            metadata
        };

        if (req) {
            logData.ipAddress = req.ip || req.connection.remoteAddress;
            logData.userAgent = req.get('user-agent');
        }

        await ActivityLog.create(logData);
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw error - logging failure shouldn't break the main operation
    }
};

/**
 * Get activity logs with pagination and filters
 */
const getActivityLogs = async ({
    page = 1,
    limit = 50,
    userId = null,
    action = null,
    startDate = null,
    endDate = null
}) => {
    const query = {};

    if (userId) query.user = userId;
    if (action) query.action = action;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        ActivityLog.find(query)
            .populate('user', 'firstName lastName username role')
            .populate('targetUser', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ActivityLog.countDocuments(query)
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get activity statistics
 */
const getActivityStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, weekCount, totalCount, topActions] = await Promise.all([
        ActivityLog.countDocuments({ createdAt: { $gte: today } }),
        ActivityLog.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        ActivityLog.countDocuments(),
        ActivityLog.aggregate([
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ])
    ]);

    return {
        todayCount,
        weekCount,
        totalCount,
        topActions
    };
};

module.exports = {
    logActivity,
    getActivityLogs,
    getActivityStats
};
