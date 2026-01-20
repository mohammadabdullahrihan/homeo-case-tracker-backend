const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  planName: {
    type: String,
    enum: ['monthly', 'yearly', 'lifetime'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['bKash', 'Nagad', 'Rocket'],
    required: true,
  },
  senderNumber: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNote: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
