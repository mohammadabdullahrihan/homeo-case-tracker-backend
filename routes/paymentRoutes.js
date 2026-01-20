const express = require('express');
const router = express.Router();
const { submitPayment, getAllPaymentRequests, getMyPayments, updatePaymentStatus } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/submit', authMiddleware, submitPayment);
router.get('/my', authMiddleware, getMyPayments);
router.get('/all', authMiddleware, adminMiddleware, getAllPaymentRequests);
router.put('/:id/status', authMiddleware, adminMiddleware, updatePaymentStatus);

module.exports = router;
