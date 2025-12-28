const Case = require('../models/Case');
const { generateSummary } = require('../services/aiService');

// Create a new case
exports.createCase = async (req, res) => {
    try {
        const { caseData } = req.body;

        // Extract basic info for metadata if available
        const patientName = caseData.name || 'Unknown';
        const patientAge = caseData.age || '';
        const patientSex = caseData.sex || '';

        const newCase = new Case({
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

        // If caseId is provided, we might want to update the existing record
        // But for MVP, we just generate based on the passed data or fetch if needed.
        // Here we use the passed data directly for speed, and optionally update the DB.

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
            error: error.message,
            stack: error.stack
        });
    }
};

// Get all cases
exports.getAllCases = async (req, res) => {
    try {
        const cases = await Case.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, cases });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch cases' });
    }
};

// Get single case
exports.getCaseIds = async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.id);
        if (!caseItem) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }
        res.status(200).json({ success: true, case: caseItem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch case' });
    }
}
