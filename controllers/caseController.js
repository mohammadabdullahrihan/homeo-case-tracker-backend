const Case = require('../models/Case');
const { generateSummary } = require('../services/aiService');
const { suggestRemedies } = require('../services/remedyService');
const FormConfig = require('../models/FormConfig');

// Helper to perform AI analysis and save to DB
const performAnalysis = async (caseId, caseData) => {
    try {
        console.log('Starting analysis for caseId:', caseId);
        // 1. Map labels for AI
        let labelMappedData = { ...caseData };
        try {
            const config = await FormConfig.findOne({ isActive: true }).sort({ version: -1 });
            if (config && config.sections) {
                const labelMap = {};
                config.sections.forEach(sec => {
                    if (sec.fields) {
                        sec.fields.forEach(f => {
                            labelMap[f.id] = f.label;
                        });
                    }
                });
                labelMappedData = {};
                Object.entries(caseData).forEach(([key, value]) => {
                    const label = labelMap[key] || key;
                    labelMappedData[label] = value;
                });
            }
        } catch (err) {
            console.warn('Label mapping failed:', err.message);
        }

        // 2. Generate AI Summary
        const aiResponse = await generateSummary(labelMappedData);
        if (!aiResponse || !aiResponse.summary) {
            throw new Error("AI returned an empty or invalid response");
        }
        
        const summary = aiResponse.summary;
        const symptoms = aiResponse.symptoms || [];

        // 3. Map to remedies with Expert Clinical Reasoning
        const patientProfile = {
            type: caseData.caseType || 'chronic', 
            miasm: caseData.miasm || null,
            constitution: caseData.constitution || null
        };

        console.log('Starting remedy suggestion for', symptoms.length, 'symptoms');
        const remedies = suggestRemedies(symptoms, patientProfile, 10);
        console.log('Remedy suggestion completed, found', remedies.length, 'remedies');

        // 4. Update Case
        console.log('Updating case in DB...');
        const updatedCase = await Case.findByIdAndUpdate(caseId, {
            summary,
            suggestedRemedies: remedies,
            symptoms: symptoms 
        }, { new: true });

        console.log('Analysis completed successfully for caseId:', caseId);
        return updatedCase;
    } catch (error) {
        console.error('Auto-analysis failed with error:', error);
        throw error; // Bubble up the error
    }
};

// Create a new case
exports.createCase = async (req, res) => {
    try {
        const { caseData } = req.body;
        const userId = req.user.id;

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

        // Trigger analysis
        await performAnalysis(savedCase._id, caseData);

        res.status(201).json({
            success: true,
            caseId: savedCase._id,
            message: 'Case saved and analyzed successfully'
        });
    } catch (error) {
        console.error('Error creating case:', error);
        res.status(500).json({ success: false, message: 'Failed to save case' });
    }
};

// Generate Summary for a specific case (Manual trigger)
exports.generateCaseSummary = async (req, res) => {
    try {
        const { caseId, caseData } = req.body;
        console.log('Manual summary request for caseId:', caseId);
        if (!caseData) {
            console.error('Missing caseData in request body');
            return res.status(400).json({ success: false, message: 'Case data is required' });
        }

        const updatedCase = await performAnalysis(caseId, caseData);
        
        if (!updatedCase) {
            console.error('performAnalysis returned null for caseId:', caseId);
            return res.status(500).json({ success: false, message: 'Analysis failed. Check backend logs for AI or logic errors.' });
        }

        res.status(200).json({
            success: true,
            summary: updatedCase.summary,
            remedies: updatedCase.suggestedRemedies,
            symptoms: updatedCase.symptoms
        });
    } catch (error) {
        const fs = require('fs');
        const logMsg = `\n[${new Date().toISOString()}] Controller Error: ${error.message}\nStack: ${error.stack}\n`;
        fs.appendFileSync('error_log.txt', logMsg);
        console.error('Error in manual summary trigger:', error);
        res.status(500).json({ success: false, message: 'Process failed: ' + error.message });
    }
};

// Get all cases
exports.getAllCases = async (req, res) => {
    try {
        const userId = req.user.id;
        const { search } = req.query;
        let query = { user: userId };
        if (search) {
            query.patientName = { $regex: search, $options: 'i' };
        }
        const cases = await Case.find(query)
            .select('patientName patientAge patientSex createdAt')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, cases });
    } catch (error) {
        console.error('Error fetching cases:', error);
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
        const patientName = caseData.name || 'Unknown';
        const patientAge = caseData.age || '';
        const patientSex = caseData.sex || '';

        let caseItem = await Case.findOneAndUpdate(
            { _id: req.params.id, user: userId },
            { caseData, patientName, patientAge, patientSex },
            { new: true }
        );

        if (!caseItem) return res.status(404).json({ success: false, message: 'Case not found' });

        // Auto-update analysis
        const updatedWithAnalysis = await performAnalysis(caseItem._id, caseData);
        if (updatedWithAnalysis) caseItem = updatedWithAnalysis;

        res.status(200).json({
            success: true,
            case: caseItem,
            message: 'Case updated and analysis refreshed'
        });
    } catch (error) {
        console.error('Error updating case:', error);
        res.status(500).json({ success: false, message: 'Failed to update case' });
    }
};

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const totalPatients = await Case.countDocuments({ user: userId });
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayCases = await Case.countDocuments({
            user: userId,
            createdAt: { $gte: startOfToday }
        });
        const pendingReview = await Case.countDocuments({
            user: userId,
            summary: { $in: ['', null] }
        });

        res.status(200).json({
            success: true,
            stats: { totalPatients, todayCases, pendingReview }
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
        if (!caseItem) return res.status(404).json({ success: false, message: 'Case not found' });
        res.status(200).json({ success: true, message: 'Case deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete case' });
    }
};
