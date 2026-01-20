# Homeopathic Clinical Reasoning Engine

## Overview

This service implements a sophisticated clinical reasoning system that mimics the decision-making process of an expert homeopathic physician with 20+ years of experience. It goes beyond simple numerical scoring to apply classical homeopathic principles, pattern recognition, and clinical judgment.

## Core Philosophy

**The system makes CLINICAL DECISIONS, not just calculations.**

Unlike basic scoring systems that blindly count points, this engine:

- Recognizes that ONE characteristic symptom outweighs multiple common symptoms
- Detects and locks onto known remedy patterns
- Applies symptom hierarchy (mental > physical, characteristic > common)
- Makes decisive recommendations even when scores are close
- Enforces classical homeopathic principles

---

## 7-Step Clinical Reasoning Process

### STEP 1: Symptom Hierarchy Enforcement

Symptoms are classified into 4 levels of clinical importance:

1. **Level 4 - DECISIVE/CHARACTERISTIC** (Highest Priority)
   - Sudden onset, violent intensity, striking modalities
   - Keynote symptoms
   - Characteristic modalities (better/worse from specific conditions)
   - Examples: "sudden onset", "throbbing pain", "photophobia", "absence of sweat"

2. **Level 3 - MENTAL/EMOTIONAL**
   - All mental and emotional symptoms
   - Examples: "anxiety", "restlessness", "irritability", "fear"

3. **Level 2 - PHYSICAL GENERALS**
   - General physical symptoms affecting the whole person
   - Examples: "fever", "perspiration", "generals"

4. **Level 1 - COMMON LOCAL**
   - Ordinary local physical symptoms
   - Examples: "headache", "cough", "pain"

**Rule:** One Level 4 symptom > Multiple Level 1 symptoms

---

### STEP 2: Decisive Symptom Detection

The system detects 8 acute pattern signals:

1. **Sudden Onset** - Keywords: "sudden", "onset"
2. **Violent Pain** - Keywords: "violent", "throbbing", "bursting"
3. **Heat/Redness** - Keywords: "heat", "red", "burning"
4. **Absence of Sweat** - Keywords: "perspiration absent", "without sweat", "dry"
5. **Aggravation from Light** - Keywords: "photophobia", "light"
6. **Aggravation from Noise** - Keywords: "noise", "jar"
7. **Acute Intensity** - Keywords: "acute", "intense"
8. **Rapid Progression** - Keywords: "rapid", "quick"

**Strong Acute Pattern:** 2 or more signals present

When detected, this triggers special handling for acute remedies like Belladonna.

---

### STEP 3: Pattern Recognition (CRITICAL)

The system recognizes known remedy patterns and applies **PATTERN LOCK** when matched.

#### Defined Patterns:

**Belladonna Pattern**

- Keywords: sudden, throbbing, heat, red, violent, photophobia, no sweat, right sided
- Minimum Match: 3 keywords
- Description: "Sudden + Heat + Throbbing + No sweat"
- Bonus: +50 points + additional +40 if strong acute pattern detected

**Aconite Pattern**

- Keywords: sudden, fear, anxiety, restless, panic, acute, onset
- Minimum Match: 3 keywords
- Description: "Sudden fear + restlessness + panic"
- Bonus: +50 points

**Arsenicum Album Pattern**

- Keywords: burning, anxiety, restless, cold, thirst, midnight
- Minimum Match: 3 keywords
- Description: "Burning pain + anxiety + restlessness"
- Bonus: +50 points

**Bryonia Pattern**

- Keywords: worse motion, better rest, irritable, thirst, dry, pressure
- Minimum Match: 3 keywords
- Description: "Worse from motion + irritability + dryness"
- Bonus: +50 points

**Pulsatilla Pattern**

- Keywords: changeable, mild, weeping, thirstless, worse heat, better open air
- Minimum Match: 3 keywords
- Description: "Changeable + mild + thirstless + worse heat"
- Bonus: +50 points

**Nux Vomica Pattern**

- Keywords: irritable, chilly, digestive, worse morning, stimulants
- Minimum Match: 3 keywords
- Description: "Irritability + chilly + digestive issues"
- Bonus: +50 points

**Pattern Lock Rule:** A pattern-locked remedy MUST outrank others, even if raw scores are similar.

---

### STEP 4: Grade Discrimination

Not all Grade-3 rubrics are equal. The system applies intelligent grade weighting:

**Grade Significance Multipliers:**

- Grade 3 + Level 4 symptom (Decisive/Characteristic): **×2.5** (Massive boost)
- Grade 3 + Level 3 symptom (Mental): **×1.5**
- Grade 3 + Level 2 symptom (Physical General): **×1.5**
- Grade 3 + Level 1 symptom (Common Local): **×1.0** (Normal)

**Keynote Rubric Bonus:** Additional **×1.3** multiplier

**Example:**

- Grade 3 on "sudden throbbing headache" (Level 4) = 3 × 2.5 = 7.5 effective grade
- Grade 3 on "headache" (Level 1) = 3 × 1.0 = 3.0 effective grade

---

### STEP 5: Big Remedy Normalization

Polychrests (big remedies) appear in many rubrics. Without characteristic dominance, they get penalized.

**Big Remedies List:**

- Belladonna
- Sulphur
- Calcarea Carbonica
- Lycopodium
- Phosphorus
- Natrum Muriaticum
- Arsenicum Album
- Pulsatilla

**Normalization Rule:**

- If big remedy appears broadly BUT has < 2 characteristic matches: **×0.85** penalty (15% reduction)
- If big remedy has ≥ 2 characteristic matches: No penalty

This prevents polychrests from dominating through sheer volume without true characteristic indication.

---

### STEP 6: Tie-Breaker Logic (MANDATORY)

When top remedies are within 15% score range, the system applies tie-breaking:

**Tie-Breaking Criteria (in order):**

1. **Decisive Symptom Dominance** (+10 points per decisive symptom)
2. **Pattern Lock** (+20 points if pattern matched)
3. **Acute/Chronic Fit** (+15 points if acute remedy for acute case)
4. **Clinical Confidence** (+5 points per characteristic match)

**Rule:** The system MUST select ONE clear winner. Never output multiple remedies as equally suitable.

---

### STEP 7: Belladonna Acute Pattern Enforcement

**CRITICAL RULE:**

If Belladonna-type acute pattern is present (Step 2 detects strong acute pattern),
AND no stronger contradictory pattern exists,
THEN Belladonna MUST appear as Rank #1 with visible score separation.

**Belladonna receives:**

- +40 bonus if strong acute pattern detected
- +15 bonus if patient type is 'acute'
- +50 bonus if pattern lock achieved
- ×2.5 multiplier on Grade 3 decisive symptoms

**Total potential bonus: +105 points**

---

## Scoring Formula

### Base Score Calculation:

```javascript
baseScore = (coverage × 3) + weightedIntensity + (sumGrades × 2)

where:
  coverage = number of symptoms matched
  weightedIntensity = Σ(grade² × importanceLevel × 3)
  sumGrades = Σ(all grades)
```

### Multipliers:

```javascript
multiplier = 1.0
if (has keynote symptoms) multiplier ×= 1.5
if (has mental symptoms) multiplier ×= 1.3
```

### Bonuses:

```javascript
bonuses = 0
if (pattern locked) bonuses += 50
if (acute remedy + acute case) bonuses += 15
if (Belladonna + strong acute pattern) bonuses += 40
```

### Big Remedy Penalty:

```javascript
bigRemedyPenalty = 1.0
if (is big remedy AND characteristic matches < 2) {
  bigRemedyPenalty = 0.85
}
```

### Final Score:

```javascript
clinicalScore = (baseScore × multiplier × bigRemedyPenalty) + bonuses
```

---

## Output Format

Each remedy recommendation includes:

```javascript
{
  abbreviation: "Bell",
  fullName: "Belladonna",
  clinicalScore: 245.50,
  score: 245.50,  // For backward compatibility
  coverage: 8,  // Out of total symptoms
  intensity: 18.5,
  boosts: ['mental', 'keynote'],
  decisiveSymptomCount: 5,
  characteristicMatchCount: 3,
  patternLocked: true,
  patternDescription: "Sudden + Heat + Throbbing + No sweat",
  acuteRemedyBonus: true,
  clinicalJustification: "Strong pattern match: Sudden + Heat + Throbbing + No sweat. 5 decisive/characteristic symptoms. 3 keynote matches. Classic acute presentation"
}
```

---

## Usage Example

```javascript
const { suggestRemedies } = require('./remedyService');

const symptoms = [
  { text: 'sudden onset fever', type: 'keynote' },
  { text: 'throbbing headache', type: 'keynote' },
  { text: 'photophobia', type: 'keynote' },
  { text: 'heat without sweat', type: 'keynote' },
  { text: 'red face', type: 'physical' },
  { text: 'restlessness', type: 'mental' },
  { text: 'violent pain', type: 'keynote' },
];

const patientProfile = {
  type: 'acute', // or 'chronic'
};

const recommendations = suggestRemedies(symptoms, patientProfile, 10);

// Expected: Belladonna at Rank #1 with high score
```

---

## Clinical Justification Examples

The system generates human-readable justifications:

**Example 1 (Strong Pattern):**

```
"Strong pattern match: Sudden + Heat + Throbbing + No sweat.
5 decisive/characteristic symptoms. 3 keynote matches.
Classic acute presentation"
```

**Example 2 (Good Coverage):**

```
"4 decisive/characteristic symptoms. 2 keynote matches"
```

**Example 3 (Basic):**

```
"Good symptom coverage"
```

---

## Key Differences from Simple Scoring

| Aspect              | Simple Scoring | Clinical Reasoning Engine |
| ------------------- | -------------- | ------------------------- |
| Symptom Weight      | All equal      | Hierarchical (4 levels)   |
| Grade Value         | Fixed          | Context-dependent         |
| Pattern Recognition | None           | 6 major patterns          |
| Tie-Breaking        | Random/None    | 4-criteria system         |
| Big Remedy Handling | None           | Normalized                |
| Acute Detection     | None           | 8-signal system           |
| Decision Making     | Numerical only | Clinical judgment         |

---

## Important Notes

### Repertory Data Requirements

For optimal performance, the repertory data should:

1. **Use descriptive rubric titles** (e.g., "HEAD, PAIN, throbbing" not just "THROBBING")
2. **Include proper categorization** (Mind, Head, Eye, Fever, etc.)
3. **Have accurate remedy grades** (1, 2, or 3)
4. **Map abbreviations correctly** in remedy_map.json

### Current Limitation

The current repertory data (`repertory_full.json`) appears to have:

- Single-word or remedy-name rubric titles
- Non-standard format

This may prevent proper symptom matching. The clinical reasoning logic is sound, but requires properly formatted repertory data to function optimally.

### Recommended Action

1. **Verify repertory data format**
2. **Ensure rubric titles are descriptive symptom phrases**
3. **Test with known Belladonna cases**
4. **Adjust pattern keywords based on actual rubric language**

---

## Testing

Use the provided test files:

```bash
# Basic test
node services/test_remedy.js

# Detailed clinical report
node services/test_clinical_reasoning.js
```

Expected behavior for classic Belladonna case:

- **Rank #1:** Belladonna
- **Clinical Score:** >200
- **Pattern Locked:** Yes
- **Justification:** Mentions acute pattern and characteristic symptoms

---

## Maintenance

To add new remedy patterns, edit the `REMEDY_PATTERNS` object in `remedyService.js`:

```javascript
'New Remedy': {
  keywords: ['keyword1', 'keyword2', 'keyword3'],
  minMatch: 3,
  description: 'Pattern description'
}
```

To adjust scoring weights, modify the constants in the scoring formula section.

---

## Philosophy Summary

> "This system thinks like a homeopath, not a calculator.
> It recognizes patterns, weighs characteristic symptoms heavily,
> and makes decisive clinical judgments.
> The goal is ONE clear recommendation, not a list of possibilities."

---

**Version:** 1.0  
**Last Updated:** 2026-01-06  
**Author:** Rayyan Quantum Labs
