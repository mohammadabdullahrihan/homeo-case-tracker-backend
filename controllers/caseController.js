const Case = require('../models/Case');
const { generateSummary } = require('../services/aiService');

// Create a new case
exports.createCase = async (req, res) => {
    try {
        const { caseData } = req.body;
        const userId = req.user.id;

        // Extract basic info for metadata if available
        const patientName = caseData.name || 'Unknown';
        const patientAge = caseData.age || '';
        const patientSex = caseData.sex || '';

        const newCase = new Case({
            user: userId,
            caseData,
            patientName,
            patientAge,
            patientSex
        });

        const savedCase = await newCase.save();

        res.status(201).json({
            success: true,
            caseId: savedCase._id,
            message: 'Case saved successfully'
        });
    } catch (error) {
        console.error('Error creating case:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save case'
        });
    }
};

// Generate Summary for a specific case
exports.generateCaseSummary = async (req, res) => {
    try {
        const { caseId, caseData } = req.body;

        if (!caseData) {
            return res.status(400).json({ success: false, message: 'Case data is required' });
        }

        const summary = await generateSummary(caseData);

        // If caseId exists, save the summary to it
        if (caseId) {
            await Case.findByIdAndUpdate(caseId, { summary });
        }

        res.status(200).json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('Error generating summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate summary',
            error: error.message
        });
    }
};

// Get all cases (filtered by user)
exports.getAllCases = async (req, res) => {
    try {
        const userId = req.user.id;
        const cases = await Case.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, cases });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch cases' });
    }
};

// Get single case
exports.getCaseIds = async (req, res) => {
    try {
        const caseItem = await Case.findOne({ _id: req.params.id, user: req.user.id });
        if (!caseItem) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }
        res.status(200).json({ success: true, case: caseItem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch case' });
    }
};

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Total Patients
        const totalPatients = await Case.countDocuments({ user: userId });

        // 2. Today's Cases
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const todayCases = await Case.countDocuments({
            user: userId,
            createdAt: { $gte: startOfToday, $lte: endOfToday }
        });

        // 3. Pending Review (Cases without summary)
        const pendingReview = await Case.countDocuments({
            user: userId,
            summary: { $in: ['', null] }
        });

        res.status(200).json({
            success: true,
            stats: {
                totalPatients,
                todayCases,
                pendingReview
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
};

// Delete a case
exports.deleteCase = async (req, res) => {
    try {
        const userId = req.user.id;
        const caseItem = await Case.findOneAndDelete({ _id: req.params.id, user: userId });

        if (!caseItem) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        res.status(200).json({ success: true, message: 'Case deleted successfully' });
    } catch (error) {
        console.error('Error deleting case:', error);
        res.status(500).json({ success: false, message: 'Failed to delete case' });
    }
};
