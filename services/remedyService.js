const fs = require('fs');
const path = require('path');

let repertoryData = null;
let remedyMap = null;

const loadData = () => {
    if (!repertoryData) {
        const repertoryPath = path.join(__dirname, '../data/repertory_full.json');
        repertoryData = JSON.parse(fs.readFileSync(repertoryPath, 'utf8'));
    }
    if (!remedyMap) {
        const remedyMapPath = path.join(__dirname, '../data/remedy_map.json');
        remedyMap = JSON.parse(fs.readFileSync(remedyMapPath, 'utf8'));
    }
};

/**
 * Suggest remedies based on a list of symptom keywords.
 * @param {string[]} symptoms - Array of symptom strings/keywords (English).
 * @param {number} limit - Number of top remedies to return.
 */
const suggestRemedies = (symptoms, limit = 5) => {
    try {
        loadData();

        if (!symptoms || symptoms.length === 0) {
            return [];
        }

        const remedyScores = {};

        // Iterate through each symptom keyword
        symptoms.forEach(symptom => {
            // Clean the symptom string: remove punctuation like ; , and - then split
            const cleanedSymptom = symptom.replace(/[;,\-]/g, ' ').toLowerCase();
            const searchTerms = cleanedSymptom.split(/\s+/).filter(term => term.length >= 3);
            
            console.log(`Searching for symptom: "${symptom}" | Cleaned: "${cleanedSymptom}" | Terms:`, searchTerms);

            // Search through categories and rubrics
            repertoryData.categories.forEach(category => {
                const categoryTitle = category.title.toLowerCase();
                
                category.rubrics.forEach(rubric => {
                    const rubricTitle = rubric.title.toLowerCase();
                    const fullSearchSpace = `${categoryTitle} ${rubricTitle}`.replace(/[;,\-]/g, ' ');
                    const spaceWords = fullSearchSpace.split(/\s+/).filter(w => w.length >= 3);
                    
                    // Match if at least 2 search terms are found (or all if less than 2)
                    const matchedTerms = searchTerms.filter(term => {
                        return spaceWords.some(word => 
                            word.includes(term) || term.includes(word)
                        );
                    });

                    const isMatch = searchTerms.length > 0 && 
                                   matchedTerms.length >= Math.min(searchTerms.length, 2);

                    if (isMatch) {
                        rubric.remedies.forEach(rem => {
                            const abbr = rem.abbreviation;
                            const score = rem.grade || 1;

                            if (!remedyScores[abbr]) {
                                remedyScores[abbr] = 0;
                            }
                            remedyScores[abbr] += score;
                        });
                    }
                });
            });
        });

        console.log(`Total remedies found: ${Object.keys(remedyScores).length}`);

        // Convert to array and map to full names
        const suggestions = Object.keys(remedyScores).map(abbr => {
            return {
                abbreviation: abbr,
                fullName: remedyMap[abbr] || abbr,
                score: remedyScores[abbr]
            };
        });

        // Sort by score descending
        suggestions.sort((a, b) => b.score - a.score);

        return suggestions.slice(0, limit);

    } catch (error) {
        console.error('Error suggesting remedies:', error);
        return [];
    }
};

module.exports = { suggestRemedies };
