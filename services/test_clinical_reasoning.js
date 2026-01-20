const fs = require('fs');
const path = require('path');
const { suggestRemedies } = require('./remedyService');

// More realistic symptom descriptions that will match repertory rubrics
const symptoms = [
  // Mental symptoms
  { text: 'restlessness', type: 'mental' },
  { text: 'irritability', type: 'mental' },
  { text: 'delirium', type: 'mental' },

  // Head symptoms - characteristic
  { text: 'head pain throbbing', type: 'keynote' },
  { text: 'head pain violent', type: 'keynote' },
  { text: 'head pain sudden', type: 'keynote' },

  // Eye symptoms
  { text: 'photophobia', type: 'keynote' },

  // Fever symptoms - very characteristic for Belladonna
  { text: 'fever heat', type: 'physical' },
  { text: 'fever sudden onset', type: 'keynote' },
  { text: 'perspiration absent', type: 'keynote' },

  // Generals
  { text: 'motion aggravation', type: 'physical' },
];

const patientProfile = {
  type: 'acute',
};

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║   HOMEOPATHIC CLINICAL REASONING ENGINE - TEST REPORT          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📋 CASE PRESENTATION');
console.log('─'.repeat(65));
console.log(`Patient Type: ${patientProfile.type.toUpperCase()}`);
console.log(`Total Symptoms: ${symptoms.length}\n`);

console.log('SYMPTOM ANALYSIS:');
const mentalSymptoms = symptoms.filter((s) => s.type === 'mental');
const keynoteSymptoms = symptoms.filter((s) => s.type === 'keynote');
const physicalSymptoms = symptoms.filter((s) => s.type === 'physical');

console.log(`  • Mental/Emotional: ${mentalSymptoms.length}`);
console.log(`  • Keynote/Characteristic: ${keynoteSymptoms.length}`);
console.log(`  • Physical: ${physicalSymptoms.length}\n`);

console.log('SYMPTOM LIST:');
symptoms.forEach((s, i) => {
  const typeIcon = s.type === 'keynote' ? '⭐' : s.type === 'mental' ? '🧠' : '📍';
  console.log(`  ${typeIcon} ${s.text} [${s.type}]`);
});

console.log('\n' + '═'.repeat(65));
console.log('🔍 RUNNING CLINICAL ANALYSIS...\n');

const results = suggestRemedies(symptoms, patientProfile, 15);

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║              TOP 15 REMEDY RECOMMENDATIONS                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

results.forEach((r, idx) => {
  const rank = idx + 1;
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
  const patternIcon = r.patternLocked ? '🔒' : '  ';

  console.log(`${medal} ${patternIcon} ${r.fullName}`);
  console.log(
    `   Score: ${r.clinicalScore.toFixed(2)} | Coverage: ${r.coverage}/${symptoms.length} | Decisive: ${r.decisiveSymptomCount} | Char: ${r.characteristicMatchCount}`
  );
  if (r.patternLocked) {
    console.log(`   🎯 PATTERN LOCK: ${r.patternDescription}`);
  }
  if (r.clinicalJustification) {
    console.log(`   💡 ${r.clinicalJustification}`);
  }
  console.log('');
});

// Detailed analysis of top 3
console.log('\n' + '═'.repeat(65));
console.log('📊 DETAILED CLINICAL ANALYSIS - TOP 3 REMEDIES\n');

results.slice(0, 3).forEach((r, idx) => {
  console.log(`${'─'.repeat(65)}`);
  console.log(`RANK #${idx + 1}: ${r.fullName.toUpperCase()}`);
  console.log(`${'─'.repeat(65)}`);
  console.log(`Clinical Score:           ${r.clinicalScore.toFixed(2)}`);
  console.log(
    `Symptom Coverage:         ${r.coverage}/${symptoms.length} (${((r.coverage / symptoms.length) * 100).toFixed(1)}%)`
  );
  console.log(`Decisive Symptoms:        ${r.decisiveSymptomCount}`);
  console.log(`Characteristic Matches:   ${r.characteristicMatchCount}`);
  console.log(`Pattern Recognition:      ${r.patternLocked ? '✓ LOCKED' : '✗ None'}`);
  if (r.patternDescription) {
    console.log(`Pattern Type:             ${r.patternDescription}`);
  }
  console.log(`Acute Remedy Bonus:       ${r.acuteRemedyBonus ? '✓ Yes' : '✗ No'}`);
  console.log(`Boosts Applied:           ${r.boosts.join(', ') || 'None'}`);
  console.log(`\nClinical Justification:`);
  console.log(`  ${r.clinicalJustification}`);
  console.log('');
});

// Check for Belladonna specifically
console.log('\n' + '═'.repeat(65));
console.log('🎯 BELLADONNA ANALYSIS\n');

const bell = results.find((r) => r.fullName === 'Belladonna');
if (!bell) {
  console.log('⚠️  WARNING: Belladonna not in top 15 results');
  console.log('\nPossible reasons:');
  console.log('  1. Symptom text may not match repertory rubrics exactly');
  console.log('  2. Other remedies have stronger characteristic matches');
  console.log('  3. Pattern recognition may need adjustment');
  console.log('\nRecommendation: Review symptom input format and repertory data');
} else {
  const rank = results.indexOf(bell) + 1;
  const isTop = rank <= 3;

  console.log(`${isTop ? '✅' : '⚠️'}  Belladonna found at Rank #${rank}`);
  console.log(`\nDetailed Metrics:`);
  console.log(`  Clinical Score:           ${bell.clinicalScore.toFixed(2)}`);
  console.log(`  Symptom Coverage:         ${bell.coverage}/${symptoms.length}`);
  console.log(`  Decisive Symptoms:        ${bell.decisiveSymptomCount}`);
  console.log(`  Characteristic Matches:   ${bell.characteristicMatchCount}`);
  console.log(`  Pattern Locked:           ${bell.patternLocked ? 'YES ✓' : 'NO ✗'}`);
  if (bell.patternDescription) {
    console.log(`  Pattern:                  ${bell.patternDescription}`);
  }
  console.log(`  Acute Bonus:              ${bell.acuteRemedyBonus ? 'YES ✓' : 'NO ✗'}`);
  console.log(`\n  Clinical Justification:`);
  console.log(`    ${bell.clinicalJustification}`);

  if (!isTop) {
    console.log(`\n  ⚠️  Expected in Top 3 for classic Belladonna presentation`);
    console.log(`  Current ranking suggests pattern may need refinement`);
  } else {
    console.log(`\n  ✅ Correctly identified in top recommendations`);
  }
}

console.log('\n' + '═'.repeat(65));
console.log('END OF CLINICAL ANALYSIS REPORT');
console.log('═'.repeat(65) + '\n');
