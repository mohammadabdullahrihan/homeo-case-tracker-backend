const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    patientAge: {
        type: String
    },
    patientSex: {
        type: String
    },
    caseData: {
        type: Object,
        required: true
    },
    summary: {
        type: String,
        default: ''
    },
    symptoms: {
        type: Array, // Array of symptom objects { clinical, friendly, type, importance }
        default: []
    },
    suggestedRemedies: {
        type: Array, // Array of remedy objects { fullName, shortName, score, percentMatch, clinicalJustification }
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Case', CaseSchema);
