const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');

router.post('/', caseController.createCase);
router.post('/summary', caseController.generateCaseSummary);
router.get('/', caseController.getAllCases);
router.get('/:id', caseController.getCaseIds);

module.exports = router;
