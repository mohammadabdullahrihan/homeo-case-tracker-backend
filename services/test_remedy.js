const fs = require('fs');
const path = require('path');
const { suggestRemedies } = require('./remedyService');

const symptoms = [
    { text: 'MIND RESTLESSNESS', type: 'mental' },
    { text: 'MIND IRRITABILITY', type: 'mental' },
    { text: 'MIND ALONE', type: 'mental' },
    { text: 'HEAD PAIN THROBBING', type: 'physical' },
    { text: 'HEAD PAIN RIGHT', type: 'physical' },
    { text: 'EYE PHOTOPHOBIA', type: 'physical' },
    { text: 'FEVER ONSET SUDDEN', type: 'physical' },
    { text: 'FEVER PERSPIRATION ABSENT', type: 'physical' },
    { text: 'GENERALS MOTION AGGRAVATION', type: 'physical' },
    { text: 'GENERALS COVERING', type: 'keynote' },
    { text: 'STOMACH THIRSTLESS', type: 'physical' }
];

const patientProfile = {
    type: 'acute'
};

const results = suggestRemedies(symptoms, patientProfile, 20);
console.log('--- TOP 20 RESULTS ---');
console.table(results.map(r => ({
    Name: r.fullName,
    Score: r.score,
    Coverage: r.coverage,
    Intensity: r.intensity,
    Boosts: r.boosts.join(', ')
})));

// Debug Belladonna specifically if not in top
const bell = results.find(r => r.fullName === 'Belladonna');
if (!bell) {
    console.log('\nBelladonna not in top 20. Checking matches...');
    // We'd need to re-run or expose internal stats to see why.
} else {
    console.log('\nBelladonna found at position:', results.indexOf(bell) + 1);
}
