const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');

const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, caseController.createCase);
router.post('/summary', authMiddleware, caseController.generateCaseSummary);
router.get('/', authMiddleware, caseController.getAllCases);
router.get('/stats', authMiddleware, caseController.getDashboardStats);
router.get('/:id', authMiddleware, caseController.getCaseById);
router.put('/:id', authMiddleware, caseController.updateCase);
router.delete('/:id', authMiddleware, caseController.deleteCase);

module.exports = router;
