const caseRepository = require('../repositories/caseRepository');
const { generateSummary } = require('./aiService');
const { suggestRemedies } = require('./remedyService');
const FormConfig = require('../models/FormConfig');

const caseService = {
  performAnalysis: async (caseId, caseData, userId) => {
    try {
      console.log('Starting analysis for caseId:', caseId);
      
      // 1. Map labels for AI
      let labelMappedData = { ...caseData };
      try {
        let config = null;
        if (userId) {
          config = await FormConfig.findOne({ user: userId, isActive: true }).sort({ version: -1 });
        }
        if (!config) {
          config = await FormConfig.findOne({ user: null, isActive: true }).sort({ version: -1 });
        }

        if (config && config.sections) {
          const labelMap = {};
          config.sections.forEach((sec) => {
            if (sec.fields) {
              sec.fields.forEach((f) => {
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
        throw new Error('AI returned an empty or invalid response');
      }

      // 3. Map to remedies
      const symptoms = aiResponse.symptoms || [];
      const patientProfile = {
        type: caseData.caseType || 'chronic',
        miasm: caseData.miasm || null,
        constitution: caseData.constitution || null,
      };

      const remedies = suggestRemedies(symptoms, patientProfile, 10);

      // 4. Update Case via Repository
      const updates = {
        summary: aiResponse.summary,
        suggestedRemedies: remedies,
        symptoms: symptoms,
        miasmaticAnalysis: aiResponse.miasm || '',
        potencyAdvice: aiResponse.potency || '',
        clinicalAdvice: aiResponse.advice || '',
        biochemic: aiResponse.biochemic || '',
        crossDiscipline: aiResponse.crossDiscipline || '',
        diagnostics: aiResponse.diagnostics || '',
        generatedPrescription: aiResponse.prescription || '',
      };

      return await caseRepository.update(caseId, userId, updates);
    } catch (error) {
      console.error('Auto-analysis failed:', error);
      throw error;
    }
  },

  createCase: async (userId, caseData) => {
    const patientName = caseData.name || 'Unknown';
    const patientAge = caseData.age || '';
    const patientSex = caseData.sex || '';

    const savedCase = await caseRepository.create({
      user: userId,
      caseData,
      patientName,
      patientAge,
      patientSex,
    });

    // Trigger async analysis (or await if you want synchronous response)
    // Here we await as the controller expects it.
    await caseService.performAnalysis(savedCase._id, caseData, userId);
    
    return savedCase;
  },

  updateSymptoms: async (caseId, userId, symptoms) => {
    const caseItem = await caseRepository.findById(caseId, userId);
    if (!caseItem) throw new Error('Case not found');

    const patientProfile = {
      type: caseItem.caseData.caseType || 'chronic',
      miasm: caseItem.caseData.miasm || null,
      constitution: caseItem.caseData.constitution || null,
    };

    const remedies = suggestRemedies(symptoms, patientProfile, 10);

    return await caseRepository.update(caseId, userId, {
      symptoms,
      suggestedRemedies: remedies
    });
  }
};

module.exports = caseService;
