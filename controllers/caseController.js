const caseService = require('../services/caseService');
const caseRepository = require('../repositories/caseRepository');
const SystemConfig = require('../models/SystemConfig');
const User = require('../models/User');

exports.createCase = async (req, res) => {
  try {
    const { caseData } = req.body;
    const userId = req.user.id;

    const savedCase = await caseService.createCase(userId, caseData);

    res.status(201).json({
      success: true,
      caseId: savedCase._id,
      message: 'Case saved and analyzed successfully',
    });
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ success: false, message: 'Failed to save case' });
  }
};

exports.generateCaseSummary = async (req, res) => {
  try {
    const { caseId, caseData } = req.body;
    if (!caseData) {
      return res.status(400).json({ success: false, message: 'Case data is required' });
    }

    const updatedCase = await caseService.performAnalysis(caseId, caseData, req.user.id);

    res.status(200).json({
      success: true,
      summary: updatedCase.summary,
      remedies: updatedCase.suggestedRemedies,
      symptoms: updatedCase.symptoms,
    });
  } catch (error) {
    console.error('Error in manual summary trigger:', error);
    res.status(500).json({ success: false, message: 'Process failed: ' + error.message });
  }
};

exports.getAllCases = async (req, res) => {
  try {
    const { search, filter } = req.query;
    const cases = await caseRepository.findAll(req.user.id, {
      search,
      filter,
      select: 'patientName patientAge patientSex createdAt summary'
    });
    res.status(200).json({ success: true, cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cases' });
  }
};

exports.getCaseById = async (req, res) => {
  try {
    const caseItem = await caseRepository.findById(req.params.id, req.user.id);
    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    res.status(200).json({ success: true, case: caseItem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch case' });
  }
};

exports.updateCase = async (req, res) => {
  try {
    const userId = req.user.id;
    const { caseData } = req.body;
    const patientName = caseData.name || 'Unknown';
    const patientAge = caseData.age || '';
    const patientSex = caseData.sex || '';

    let caseItem = await caseRepository.update(req.params.id, userId, {
      caseData,
      patientName,
      patientAge,
      patientSex
    });

    if (!caseItem) return res.status(404).json({ success: false, message: 'Case not found' });

    // Auto-update analysis
    const updatedWithAnalysis = await caseService.performAnalysis(caseItem._id, caseData, userId);
    
    res.status(200).json({
      success: true,
      case: updatedWithAnalysis || caseItem,
      message: 'Case updated and analysis refreshed',
    });
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ success: false, message: 'Failed to update case' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const totalPatients = await caseRepository.count({ user: userId });
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCases = await caseRepository.count({
      user: userId,
      createdAt: { $gte: startOfToday },
    });
    
    const pendingReview = await caseRepository.count({
      user: userId,
      summary: { $in: ['', null] },
    });

    const currentUser = await User.findById(userId).select('subscription createdAt');
    let subscriptionData = currentUser ? currentUser.subscription.toObject() : null;

    if (subscriptionData && subscriptionData.plan === 'trial') {
      const endsAt = new Date(subscriptionData.subscriptionEndsAt);
      const aYearFromNow = new Date();
      aYearFromNow.setFullYear(aYearFromNow.getFullYear() + 1);

      if (endsAt > aYearFromNow) {
        const creationDate = currentUser.createdAt || new Date();
        const fixedDate = new Date(creationDate);
        fixedDate.setDate(fixedDate.getDate() + 30);
        subscriptionData.subscriptionEndsAt = fixedDate;
      }
    }

    const config = await SystemConfig.findOne();
    let broadcast = config?.broadcastMessage?.active ? config.broadcastMessage : null;

    if (broadcast && broadcast.expiresAt && new Date() > new Date(broadcast.expiresAt)) {
      broadcast = null;
    }

    res.status(200).json({
      success: true,
      stats: { totalPatients, todayCases, pendingReview },
      subscription: subscriptionData,
      broadcast,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

exports.updateSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;
    const updatedCase = await caseService.updateSymptoms(req.params.id, req.user.id, symptoms);

    res.status(200).json({
      success: true,
      case: updatedCase,
      message: 'Symptoms updated and remedies recalculated',
    });
  } catch (error) {
    console.error('Error updating symptoms:', error);
    res.status(500).json({ success: false, message: 'Failed to update symptoms' });
  }
};

exports.deleteCase = async (req, res) => {
  try {
    const caseItem = await caseRepository.delete(req.params.id, req.user.id);
    if (!caseItem) return res.status(404).json({ success: false, message: 'Case not found' });
    res.status(200).json({ success: true, message: 'Case deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete case' });
  }
};
