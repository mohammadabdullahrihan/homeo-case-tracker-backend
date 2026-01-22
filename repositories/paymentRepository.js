const PaymentRequest = require('../models/PaymentRequest');

const paymentRepository = {
  create: async (data) => {
    return PaymentRequest.create(data);
  },

  findById: async (id) => {
    return PaymentRequest.findById(id);
  },

  findByTransactionId: async (trxId) => {
    return PaymentRequest.findOne({ transactionId: trxId });
  },

  findAll: async (options = {}) => {
    const { populate, sort = { createdAt: -1 } } = options;
    let query = PaymentRequest.find();
    if (populate) query = query.populate(populate.path, populate.select);
    return query.sort(sort);
  },

  findByUserId: async (userId, sort = { createdAt: -1 }) => {
    return PaymentRequest.find({ user: userId }).sort(sort);
  },

  updateStatus: async (id, status, adminNote) => {
    return PaymentRequest.findByIdAndUpdate(
      id,
      { status, adminNote },
      { new: true }
    );
  }
};

module.exports = paymentRepository;
