const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now,
    },

    // Stores the raw form data
    caseData: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },

    // Stores the generated summary
    summary: {
        type: String,
        default: '',
    },

    // Optional: Metadata for easier querying later
    patientName: String,
    patientAge: String,
    patientSex: String,
});

module.exports = mongoose.model('Case', caseSchema);
