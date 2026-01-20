const fs = require('fs');
const path = require('path');

let repertoryData = null;
let remedyMap = null;
let remedyPatterns = null;

const loadData = () => {
  if (!repertoryData) {
    const repertoryPath = path.join(__dirname, '../data/repertory_full.json');
    repertoryData = JSON.parse(fs.readFileSync(repertoryPath, 'utf8'));
  }
  if (!remedyMap) {
    const remedyMapPath = path.join(__dirname, '../data/remedy_map.json');
    remedyMap = JSON.parse(fs.readFileSync(remedyMapPath, 'utf8'));
  }
  if (!remedyPatterns) {
    const patternsPath = path.join(__dirname, '../data/remedy_patterns.json');
    if (fs.existsSync(patternsPath)) {
      remedyPatterns = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
    } else {
      remedyPatterns = {};
    }
  }
};

// ============================================================================
// EXPERT HOMEOPATHIC CLINICAL REASONING ENGINE (CORE)
// ============================================================================

const classifySymptomImportance = (symptom) => {
  // AI uses 'clinical' field for the rubric text
  const text = (symptom.clinical || symptom.text || '').toLowerCase();
  const type = symptom.type || 'physical';

  const decisiveKeywords = [
    'sudden',
    'violent',
    'throbbing',
    'intense',
    'acute',
    'rapid',
    'burning',
    'shooting',
    'tearing',
    'bursting',
    'pulsating',
  ];
  const characteristicModalities = [
    'worse from light',
    'worse from noise',
    'worse from jar',
    'worse from motion',
    'better from pressure',
    'better from cold',
  ];

  const hasDecisiveKeyword = decisiveKeywords.some((kw) => text.includes(kw));
  const hasCharacteristicModality = characteristicModalities.some((mod) => text.includes(mod));

  if (hasDecisiveKeyword || hasCharacteristicModality || type === 'keynote') {
    return { level: 4, category: 'DECISIVE_CHARACTERISTIC', isDecisive: true };
  } else if (type === 'mental') {
    return { level: 3, category: 'MENTAL_EMOTIONAL', isDecisive: false };
  } else if (text.includes('general') || text.includes('fever') || text.includes('sleep')) {
    return { level: 2, category: 'PHYSICAL_GENERAL', isDecisive: false };
  } else {
    return { level: 1, category: 'COMMON_LOCAL', isDecisive: false };
  }
};

const detectCasePattern = (symptoms) => {
  const acuteSignals = { suddenOnset: false, violentIntensity: false, rapidProgression: false };
  symptoms.forEach((sym) => {
    const text = (sym.clinical || sym.text || '').toLowerCase();
    if (text.includes('sudden') || text.includes('onset')) acuteSignals.suddenOnset = true;
    if (text.includes('violent') || text.includes('intense') || text.includes('severe'))
      acuteSignals.violentIntensity = true;
    if (text.includes('rapid')) acuteSignals.rapidProgression = true;
  });
  return {
    isAcuteCase: Object.values(acuteSignals).filter((v) => v).length >= 2,
    acuteSignalCount: Object.values(acuteSignals).filter((v) => v).length,
  };
};

const detectRemedyPattern = (remedyName, symptoms) => {
  const pattern = remedyPatterns[remedyName];
  if (!pattern) return { matched: false, matchCount: 0, matchStrength: 0 };
  const symptomTexts = symptoms.map((s) => (s.clinical || s.text || '').toLowerCase()).join(' ');
  let matchCount = 0;
  pattern.keywords.forEach((keyword) => {
    if (symptomTexts.includes(keyword)) matchCount++;
  });
  const matched = matchCount >= (pattern.minMatch || 3);
  const matchStrength = (matchCount / pattern.keywords.length) * 100;
  return {
    matched,
    matchCount,
    matchStrength,
    pattern: pattern.description,
    isAcuteRemedy: pattern.acuteRemedy || false,
  };
};

const calculatePolyChrestPenalty = (remedyName, stats) => {
  const bigRemedies = [
    'Belladonna',
    'Sulphur',
    'Calcarea Carbonica',
    'Lycopodium',
    'Phosphorus',
    'Natrum Muriaticum',
    'Arsenicum Album',
    'Pulsatilla',
    'Nux Vomica',
    'Bryonia',
  ];
  if (!bigRemedies.includes(remedyName)) return 1.0;
  return stats.characteristicMatchCount >= 2 ? 1.0 : 0.88;
};

/**
 * suggestRemedies with Percent-Match Scaling
 */
const suggestRemedies = (symptoms, patientProfile = {}, limit = 10) => {
  try {
    loadData();
    if (!symptoms || symptoms.length === 0) return [];

    const classifiedSymptoms = symptoms.map((sym) => ({
      ...sym,
      importance: classifySymptomImportance(sym),
    }));
    const casePattern = detectCasePattern(symptoms);
    const remedyStats = {};

    classifiedSymptoms.forEach((symObj, symIdx) => {
      const symType = symObj.type || 'physical';
      const importance = symObj.importance;
      const textToMatch = symObj.clinical || symObj.text || '';
      const cleanedSymptom = textToMatch.replace(/[;,\-]/g, ' ').toLowerCase();
      const searchTerms = cleanedSymptom.split(/\s+/).filter((term) => term.length >= 2);
      if (searchTerms.length === 0) return;

      repertoryData.categories.forEach((category) => {
        const categoryWords = category.title.toLowerCase().split(/\s+/);
        category.rubrics.forEach((rubric) => {
          const rubricTitle = rubric.title.toLowerCase();
          const rubricWords = rubricTitle.split(/[;,\-\s+]/).filter((w) => w.length >= 2);
          const categoryMatch = searchTerms.some((term) =>
            categoryWords.some((word) => word.includes(term) || term.includes(word))
          );
          const matchedRubricCount = searchTerms.filter((term) =>
            rubricWords.some((word) => word.includes(term) || term.includes(word))
          ).length;

          if ((categoryMatch && matchedRubricCount >= 1) || matchedRubricCount >= 2) {
            const matchQuality =
              (matchedRubricCount + (categoryMatch ? 1 : 0)) / (searchTerms.length || 1);
            rubric.remedies.forEach((rem) => {
              const rawAbbr = rem.abbreviation;
              const fullName = remedyMap[rawAbbr] || rawAbbr;
              let grade = parseInt(rem.grade) || 1;

              let gradeMultiplier = 1.0;
              if (grade === 3 && importance.level === 4) gradeMultiplier = 2.5;
              else if (grade === 3 && importance.level === 3) gradeMultiplier = 1.8;
              else if (grade === 2 && importance.level === 4) gradeMultiplier = 1.5;

              const effectiveGrade = grade * gradeMultiplier * matchQuality;

              if (!remedyStats[fullName]) {
                remedyStats[fullName] = {
                  rubricMatches: 0,
                  totalGrade: 0,
                  decisiveSymptomCount: 0,
                  characteristicMatchCount: 0,
                  abbr: rawAbbr,
                  fullName: fullName,
                  matchedSymptomTypes: new Set(),
                  gradesArray: [],
                };
              }
              remedyStats[fullName].rubricMatches++;
              remedyStats[fullName].totalGrade += grade;
              remedyStats[fullName].gradesArray.push(effectiveGrade);
              if (symType !== 'physical') remedyStats[fullName].matchedSymptomTypes.add(symType);
              if (importance.isDecisive) remedyStats[fullName].decisiveSymptomCount++;
              if (importance.level === 4) remedyStats[fullName].characteristicMatchCount++;
            });
          }
        });
      });
    });

    // Calculate Scores
    const suggestions = Object.keys(remedyStats).map((name) => {
      const stats = remedyStats[name];
      const baseScore = stats.rubricMatches * 10 + stats.totalGrade;
      const weightedIntensity = stats.gradesArray.reduce((acc, g) => acc + g * 5, 0);

      let multiplier = 1.0;
      stats.matchedSymptomTypes.forEach((type) => {
        if (type === 'keynote') multiplier *= 1.4;
        if (type === 'mental') multiplier *= 1.25;
      });

      const patternMatch = detectRemedyPattern(name, symptoms);
      const patternBonus = patternMatch.matched ? 200 + patternMatch.matchStrength : 0;

      let acuteBonus = 0;
      if (
        patientProfile.type === 'acute' &&
        casePattern.isAcuteCase &&
        patternMatch.isAcuteRemedy
      ) {
        acuteBonus = 20 + casePattern.acuteSignalCount * 10;
      }

      const polyChrestPenalty = calculatePolyChrestPenalty(name, stats);
      const clinicalScore =
        (baseScore + weightedIntensity) * multiplier * polyChrestPenalty +
        patternBonus +
        acuteBonus;

      return {
        fullName: name,
        shortName: stats.abbr,
        score: parseFloat(clinicalScore.toFixed(2)),
        clinicalJustification: generateJustification(name, stats, patternMatch, acuteBonus > 0),
      };
    });

    // Sort by raw score
    suggestions.sort((a, b) => b.score - a.score);

    // Convert to Percentage based on maxScore
    const maxScore = suggestions.length > 0 ? suggestions[0].score : 1;
    const result = suggestions.map((r) => ({
      ...r,
      percentMatch: parseFloat(((r.score / maxScore) * 100).toFixed(1)),
    }));

    return result.slice(0, limit);
  } catch (error) {
    console.error('Error suggesting remedies:', error);
    return [];
  }
};

const generateJustification = (remedyName, stats, patternMatch, acuteApplied) => {
  const parts = [];
  if (patternMatch.matched) {
    parts.push(
      `${remedyName}-এর বিশেষ ক্লিনিক্যাল প্যাটার্ন (${patternMatch.pattern}) এর সাথে ${patternMatch.matchStrength.toFixed(0)}% মিল পাওয়া গেছে`
    );
  }
  if (stats.decisiveSymptomCount > 0) {
    parts.push(`${stats.decisiveSymptomCount}টি প্রধান লক্ষণ এই ঔষধটিকে গভীরভাবে সমর্থন করে`);
  }
  if (acuteApplied) {
    parts.push('এটি একটি একুইট বা তীব্র অবস্থার প্যাটার্ন হিসেবে চিহ্নিত হয়েছে');
  }
  if (stats.characteristicMatchCount >= 2) {
    parts.push('ঔষধটির গুরুত্বপূর্ণ চারিত্রিক বৈশিষ্ট্য (Keynotes) এই কেসে বিদ্যমান');
  }

  return parts.join('। ') || 'উল্লেখযোগ্য রুব্রিকের সাথে মিল পাওয়া গেছে।';
};

module.exports = { suggestRemedies };
