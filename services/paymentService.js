const paymentRepository = require('../repositories/paymentRepository');
const User = require('../models/User');
const activityLogger = require('../utils/activityLogger');

const paymentService = {
  submitPayment: async (userId, paymentData) => {
    const { planName, amount, paymentMethod, senderNumber, transactionId } = paymentData;

    const existingRequest = await paymentRepository.findByTransactionId(transactionId);
    if (existingRequest) {
      throw new Error('Transaction ID already submitted');
    }

    const paymentRequest = await paymentRepository.create({
      user: userId,
      planName,
      amount,
      paymentMethod,
      senderNumber,
      transactionId,
    });

    await activityLogger.logActivity({
      userId: userId,
      action: 'PAYMENT_SUBMITTED',
      details: `Submitted payment for ${planName} plan. TrxID: ${transactionId}`
    });

    return paymentRequest;
  },

  processPayment: async (adminId, paymentId, status, adminNote) => {
    const paymentRequest = await paymentRepository.findById(paymentId);

    if (!paymentRequest) {
      throw new Error('Payment request not found');
    }

    if (paymentRequest.status !== 'pending') {
      throw new Error('This payment has already been processed');
    }

    const updatedRequest = await paymentRepository.updateStatus(paymentId, status, adminNote);

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
          expiryDate.setFullYear(now.getFullYear() + 100);
        }

        user.subscription.subscriptionEndsAt = expiryDate;
        await user.save();

        await activityLogger.logActivity({
          userId: adminId,
          action: 'PAYMENT_APPROVED',
          details: `Approved payment for user ${user.username}. Plan: ${paymentRequest.planName}`
        });
      }
    } else if (status === 'rejected') {
      await activityLogger.logActivity({
        userId: adminId,
        action: 'PAYMENT_REJECTED',
        details: `Rejected payment reference ${paymentRequest.transactionId}`
      });
    }

    return updatedRequest;
  }
};

module.exports = paymentService;
