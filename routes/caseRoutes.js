const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const authMiddleware = require('../middleware/authMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

// Protect all case routes
// 1. Authenticate
router.use(authMiddleware);

// 2. Check Subscription (SaaS Lock)
router.use(subscriptionMiddleware);

router.post('/', caseController.createCase);
router.post('/summary', caseController.generateCaseSummary);
router.get('/', caseController.getAllCases);
router.get('/stats', caseController.getDashboardStats);
router.get('/:id', caseController.getCaseById);
router.put('/:id', caseController.updateCase);
router.put('/:id/symptoms', caseController.updateSymptoms);
router.delete('/:id', caseController.deleteCase);

module.exports = router;
