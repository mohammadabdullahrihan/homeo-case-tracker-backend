const paymentService = require('../services/paymentService');
const paymentRepository = require('../repositories/paymentRepository');

exports.submitPayment = async (req, res) => {
  try {
    const paymentRequest = await paymentService.submitPayment(req.user.id, req.body);
    res.status(201).json({ success: true, data: paymentRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllPaymentRequests = async (req, res) => {
  try {
    const payments = await paymentRepository.findAll({
      populate: { path: 'user', select: 'firstName lastName username email' }
    });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await paymentRepository.findByUserId(req.user.id);
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const payment = await paymentService.processPayment(req.user.id, req.params.id, status, adminNote);
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};
