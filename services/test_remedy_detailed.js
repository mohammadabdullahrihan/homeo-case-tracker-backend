const fs = require('fs');
const path = require('path');
const { suggestRemedies } = require('./remedyService');

// Classic Belladonna case symptoms
const symptoms = [
    { text: 'MIND RESTLESSNESS', type: 'mental' },
    { text: 'MIND IRRITABILITY', type: 'mental' },
    { text: 'HEAD PAIN THROBBING', type: 'keynote' },
    { text: 'HEAD PAIN RIGHT SIDED', type: 'physical' },
    { text: 'EYE PHOTOPHOBIA', type: 'keynote' },
    { text: 'FEVER SUDDEN ONSET', type: 'keynote' },
    { text: 'FEVER HEAT', type: 'physical' },
    { text: 'FEVER PERSPIRATION ABSENT', type: 'keynote' },
    { text: 'SKIN RED', type: 'physical' },
    { text: 'HEAD PAIN VIOLENT', type: 'keynote' }
];

const patientProfile = {
    type: 'acute'
};

console.log('=== TESTING CLINICAL REASONING ENGINE ===\n');
console.log('Patient Profile:', patientProfile);
console.log('Number of symptoms:', symptoms.length);
console.log('\nSymptoms entered:');
symptoms.forEach((s, i) => {
    console.log(`${i + 1}. [${s.type.toUpperCase()}] ${s.text}`);
});

const results = suggestRemedies(symptoms, patientProfile, 20);

console.log('\n\n--- TOP 20 CLINICAL RECOMMENDATIONS ---\n');
console.table(results.map((r, idx) => ({
    Rank: idx + 1,
    Remedy: r.fullName,
    'Clinical Score': r.clinicalScore,
    Coverage: r.coverage,
    'Decisive Sx': r.decisiveSymptomCount,
    'Char. Matches': r.characteristicMatchCount,
    'Pattern Lock': r.patternLocked ? '✓' : '',
    Intensity: r.intensity
})));

// Find Belladonna specifically
const bell = results.find(r => r.fullName === 'Belladonna');
if (!bell) {
    console.log('\n⚠️  Belladonna not in top 20.');
    console.log('This may indicate:');
    console.log('1. Symptom text not matching repertory rubrics');
    console.log('2. Need to check repertory data structure');
} else {
    const rank = results.indexOf(bell) + 1;
    console.log(`\n✓ Belladonna found at Rank #${rank}`);
    console.log('\nBelladonna Details:');
    console.log('  Clinical Score:', bell.clinicalScore);
    console.log('  Coverage:', bell.coverage, 'symptoms');
    console.log('  Decisive Symptoms:', bell.decisiveSymptomCount);
    console.log('  Characteristic Matches:', bell.characteristicMatchCount);
    console.log('  Pattern Locked:', bell.patternLocked ? 'YES' : 'NO');
    if (bell.patternDescription) {
        console.log('  Pattern:', bell.patternDescription);
    }
    console.log('  Clinical Justification:', bell.clinicalJustification);
}

// Show top 3 with full details
console.log('\n\n=== TOP 3 REMEDIES - DETAILED ANALYSIS ===\n');
results.slice(0, 3).forEach((r, idx) => {
    console.log(`\n${idx + 1}. ${r.fullName.toUpperCase()}`);
    console.log('   Clinical Score:', r.clinicalScore);
    console.log('   Coverage:', r.coverage, 'symptoms');
    console.log('   Decisive Symptoms:', r.decisiveSymptomCount);
    console.log('   Characteristic Matches:', r.characteristicMatchCount);
    console.log('   Pattern Locked:', r.patternLocked ? 'YES' : 'NO');
    if (r.patternDescription) {
        console.log('   Pattern:', r.patternDescription);
    }
    console.log('   Justification:', r.clinicalJustification);
    console.log('   Boosts:', r.boosts.join(', ') || 'none');
});
