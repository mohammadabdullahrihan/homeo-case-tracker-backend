const PaymentRequest = require('../models/PaymentRequest');
const User = require('../models/User');
const activityLogger = require('../utils/activityLogger');

// @desc Submit a new payment request
// @route POST /api/payments/submit
// @access Private
exports.submitPayment = async (req, res) => {
  try {
    const { planName, amount, paymentMethod, senderNumber, transactionId } = req.body;

    const existingRequest = await PaymentRequest.findOne({ transactionId });
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Transaction ID already submitted' });
    }

    const paymentRequest = await PaymentRequest.create({
      user: req.user.id,
      planName,
      amount,
      paymentMethod,
      senderNumber,
      transactionId,
    });

    await activityLogger.logActivity({
      userId: req.user.id,
      action: 'PAYMENT_SUBMITTED',
      details: `Submitted payment for ${planName} plan. TrxID: ${transactionId}`
    });

    res.status(201).json({ success: true, data: paymentRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all payment requests (Super Admin)
// @route GET /api/payments/all
// @access Private/Admin
exports.getAllPaymentRequests = async (req, res) => {
  try {
    const payments = await PaymentRequest.find().populate('user', 'firstName lastName username email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get my payment history (Doctor)
// @route GET /api/payments/my
// @access Private
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await PaymentRequest.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update payment status (Super Admin)
// @route PUT /api/payments/:id/status
// @access Private/Admin
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const paymentRequest = await PaymentRequest.findById(req.params.id);

    if (!paymentRequest) {
      return res.status(404).json({ success: false, message: 'Payment request not found' });
    }

    if (paymentRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This payment has already been processed' });
    }

    paymentRequest.status = status;
    paymentRequest.adminNote = adminNote;
    await paymentRequest.save();

    // If approved, update user's subscription
    if (status === 'approved') {
      const user = await User.findById(paymentRequest.user);
      if (user) {
        user.subscription.plan = paymentRequest.planName;
        user.subscription.status = 'active';

        // Calculate expiry date
        const now = new Date();
        let expiryDate = new Date();

        if (paymentRequest.planName === 'monthly') {
          expiryDate.setMonth(now.getMonth() + 1);
        } else if (paymentRequest.planName === 'yearly') {
          expiryDate.setFullYear(now.getFullYear() + 1);
        } else if (paymentRequest.planName === 'lifetime') {
          expiryDate.setFullYear(now.getFullYear() + 100); // Functional lifetime
        }

        user.subscription.subscriptionEndsAt = expiryDate;
        await user.save();

        await activityLogger.logActivity({
          userId: req.user.id,
          action: 'PAYMENT_APPROVED',
          details: `Approved payment for user ${user.username}. Plan: ${paymentRequest.planName}`
        });
      }
    } else if (status === 'rejected') {
      await activityLogger.logActivity({
        userId: req.user.id,
        action: 'PAYMENT_REJECTED',
        details: `Rejected payment reference ${paymentRequest.transactionId}`
      });
    }

    res.status(200).json({ success: true, data: paymentRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
