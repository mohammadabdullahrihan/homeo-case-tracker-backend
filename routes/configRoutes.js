const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', configController.getConfig);
router.put('/', authMiddleware, configController.updateConfig);
router.post('/seed', configController.seedConfig);

module.exports = router;
