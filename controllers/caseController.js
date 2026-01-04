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

const { suggestRemedies } = require('../services/remedyService');
const FormConfig = require('../models/FormConfig');

// Generate Summary for a specific case
exports.generateCaseSummary = async (req, res) => {
    try {
        const { caseId, caseData } = req.body;

        if (!caseData) {
            return res.status(400).json({ success: false, message: 'Case data is required' });
        }

        // --- NEW: Map technical IDs to Labs for AI context ---
        // Fetch labels from configuration to help AI understand "f_123" fields
        let labelMappedData = { ...caseData };
        try {
            const config = await FormConfig.findOne({ isActive: true }).sort({ version: -1 });
            if (config) {
                const labelMap = {};
                config.sections.forEach(sec => {
                    sec.fields.forEach(f => {
                        labelMap[f.id] = f.label;
                    });
                });

                // Create a copy with human-readable keys
                labelMappedData = {};
                Object.entries(caseData).forEach(([key, value]) => {
                    const label = labelMap[key] || key;
                    labelMappedData[label] = value;
                });
            }
        } catch (configErr) {
            console.warn('Could not map labels for AI, using raw keys:', configErr.message);
        }
        // -----------------------------------------------------

        // 1. Generate AI Summary and extract symptoms
        const aiResponse = await generateSummary(labelMappedData);
        // aiResponse contains { summary: "...", symptoms: ["...", "..."] }
        
        const summary = aiResponse.summary;
        const symptoms = aiResponse.symptoms || [];

        // 2. Map symptoms to repertory remedies
        const remedies = suggestRemedies(symptoms);

        // 3. If caseId exists, save the summary to it
        if (caseId) {
            await Case.findByIdAndUpdate(caseId, { 
                summary,
                // Optionally save remedies if the schema supports it
                // We'll assume the schema might need an update or just return it for now
                suggestedRemedies: remedies 
            });
        }

        res.status(200).json({
            success: true,
            summary,
            remedies
        });
    } catch (error) {
        console.error('Error generating summary or remedies:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate summary and remedies',
            error: error.message
        });
    }
};

// Get all cases (filtered by user and optional search)
exports.getAllCases = async (req, res) => {
    try {
        const userId = req.user.id;
        const { search } = req.query;

        let query = { user: userId };

        if (search) {
            query.patientName = { $regex: search, $options: 'i' }; // Case-insensitive search
        }

        const cases = await Case.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, cases });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch cases' });
    }
};

// Get single case
exports.getCaseById = async (req, res) => {
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

// Update a case
exports.updateCase = async (req, res) => {
    try {
        const userId = req.user.id;
        const { caseData } = req.body;
        
        // Metadata updates
        const patientName = caseData.name || 'Unknown';
        const patientAge = caseData.age || '';
        const patientSex = caseData.sex || '';

        const caseItem = await Case.findOneAndUpdate(
            { _id: req.params.id, user: userId },
            { 
                caseData,
                patientName,
                patientAge,
                patientSex
                // We do NOT update summary automatically here, as it might overwrite AI summary.
                // Summary regeneration is a separate action.
            },
            { new: true }
        );

        if (!caseItem) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        res.status(200).json({
            success: true,
            case: caseItem,
            message: 'Case updated successfully'
        });
    } catch (error) {
        console.error('Error updating case:', error);
        res.status(500).json({ success: false, message: 'Failed to update case' });
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
