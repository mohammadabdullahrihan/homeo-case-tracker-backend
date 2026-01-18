const express = require('express');
const router = express.Router();
const { getDoctors, updateDoctorStatus } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Protect all routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/doctors', getDoctors);
router.put('/doctor/:id/status', updateDoctorStatus);

module.exports = router;
