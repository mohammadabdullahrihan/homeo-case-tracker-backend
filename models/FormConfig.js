const mongoose = require('mongoose');

const formConfigSchema = new mongoose.Schema({
  version: {
    type: Number,
    default: 1,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null implies Global Default Config
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sections: [
    {
      id: { type: String, required: true },
      title: { type: String, required: true },
      condition: {
        field: String,
        value: mongoose.Schema.Types.Mixed,
      },
      fields: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
          type: {
            type: String,
            enum: ['text', 'textarea', 'select', 'mcq', 'yesno'],
            required: true,
          },
          renderAs: {
            type: String,
            enum: ['default', 'buttons'], // For MCQ/Select
            default: 'default',
          },
          required: { type: Boolean, default: false },
          placeholder: String,
          options: [String], // For select/mcq
          followUp: {
            label: String,
            type: { type: String, enum: ['text', 'textarea'] },
          },
        },
      ],
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FormConfig', formConfigSchema);
