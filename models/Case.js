const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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

    // Metadata for easier querying
    patientName: String,
    patientAge: String,
    patientSex: String,

    // Stores suggested remedies from repertory
    suggestedRemedies: [
        {
            abbreviation: String,
            fullName: String,
            score: Number
        }
    ]
});

module.exports = mongoose.model('Case', caseSchema);
