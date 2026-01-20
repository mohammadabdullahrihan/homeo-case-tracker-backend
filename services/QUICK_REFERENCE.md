# Clinical Reasoning Engine - Quick Reference

## 🎯 One-Page Cheat Sheet

---

## Input Format

```javascript
const symptoms = [
  { text: 'symptom description', type: 'keynote' }, // Characteristic
  { text: 'symptom description', type: 'mental' }, // Mental/Emotional
  { text: 'symptom description', type: 'physical' }, // Physical
];

const patientProfile = {
  type: 'acute', // or 'chronic'
};

const results = suggestRemedies(symptoms, patientProfile, 10);
```

---

## Symptom Types Priority

| Type       | Priority | Examples                                       |
| ---------- | -------- | ---------------------------------------------- |
| `keynote`  | HIGHEST  | Sudden onset, throbbing, photophobia, no sweat |
| `mental`   | HIGH     | Anxiety, restlessness, irritability, fear      |
| `physical` | NORMAL   | Headache, fever, cough, pain                   |

---

## Decisive Keywords (Auto-Detected)

**Intensity:** sudden, violent, throbbing, intense, acute, rapid, burning, shooting, tearing, bursting, pulsating

**Modalities:** worse from light, worse from noise, worse from jar, better from pressure, better from cold, better from heat, absence of, without, never, aversion to

---

## Pattern Recognition Quick Guide

| Remedy         | Pattern Keywords                                                          | Min Match |
| -------------- | ------------------------------------------------------------------------- | --------- |
| **Belladonna** | sudden, throbbing, heat, red, violent, photophobia, no sweat, right sided | 3         |
| **Aconite**    | sudden, fear, anxiety, restless, panic, acute, onset                      | 3         |
| **Arsenicum**  | burning, anxiety, restless, cold, thirst, midnight                        | 3         |
| **Bryonia**    | worse motion, better rest, irritable, thirst, dry, pressure               | 3         |
| **Pulsatilla** | changeable, mild, weeping, thirstless, worse heat, better open air        | 3         |
| **Nux Vomica** | irritable, chilly, digestive, worse morning, stimulants                   | 3         |

**Pattern Lock Bonus:** +50 points

---

## Scoring Quick Formula

```
Base Score = (coverage × 3) + weightedIntensity + (sumGrades × 2)

Multipliers:
  • Keynote symptoms: ×1.5
  • Mental symptoms: ×1.3
  • Big remedy without characteristics: ×0.85

Bonuses:
  • Pattern lock: +50
  • Acute remedy + acute case: +15
  • Belladonna + strong acute pattern: +40
```

---

## Grade Significance

| Grade | Symptom Level           | Multiplier |
| ----- | ----------------------- | ---------- |
| 3     | Decisive/Characteristic | ×2.5       |
| 3     | Mental/Emotional        | ×1.5       |
| 3     | Physical General        | ×1.5       |
| 3     | Common Local            | ×1.0       |
| 2     | Any                     | ×1.0       |
| 1     | Any                     | ×1.0       |

**Keynote Rubric:** Additional ×1.3

---

## Acute Pattern Signals (Need ≥2)

1. ✓ Sudden onset
2. ✓ Violent pain
3. ✓ Heat/redness
4. ✓ Absence of sweat
5. ✓ Aggravation from light
6. ✓ Aggravation from noise
7. ✓ Acute intensity
8. ✓ Rapid progression

---

## Tie-Breaker Criteria (When scores within 15%)

1. **Decisive symptom count** (+10 each)
2. **Pattern lock** (+20)
3. **Acute/chronic fit** (+15)
4. **Characteristic matches** (+5 each)

---

## Output Fields

```javascript
{
  fullName: "Belladonna",
  clinicalScore: 245.50,
  coverage: 8,                      // Symptoms matched
  decisiveSymptomCount: 5,          // Decisive symptoms
  characteristicMatchCount: 3,      // Characteristic matches
  patternLocked: true,              // Pattern recognized
  patternDescription: "...",        // Pattern name
  acuteRemedyBonus: true,           // Acute remedy flag
  clinicalJustification: "..."      // Human explanation
}
```

---

## Big Remedies (Normalized)

Belladonna, Sulphur, Calcarea Carbonica, Lycopodium, Phosphorus, Natrum Muriaticum, Arsenicum Album, Pulsatilla

**Penalty:** -15% if < 2 characteristic matches

---

## Belladonna Special Rules

**Triggers:**

- Strong acute pattern detected (≥2 signals)
- Belladonna matches symptoms

**Bonuses:**

- +40 for strong acute pattern
- +15 for acute patient type
- +50 if pattern locked

**Total:** Up to +105 bonus points

**Result:** MUST be Rank #1

---

## Testing Commands

```bash
# Professional report
node services/test_clinical_reasoning.js

# Detailed debugging
node services/test_remedy_detailed.js

# Original test
node services/test_remedy.js
```

---

## Example: Classic Belladonna Case

```javascript
const symptoms = [
  { text: 'sudden onset fever', type: 'keynote' },
  { text: 'throbbing headache', type: 'keynote' },
  { text: 'photophobia', type: 'keynote' },
  { text: 'heat without sweat', type: 'keynote' },
  { text: 'red face', type: 'physical' },
  { text: 'violent pain', type: 'keynote' },
];

const patientProfile = { type: 'acute' };
```

**Expected Result:**

- Rank #1: Belladonna
- Score: 250-300
- Pattern Locked: ✓
- Justification: "Strong pattern match: Sudden + Heat + Throbbing + No sweat. Classic acute presentation"

---

## Key Principles

> **One characteristic symptom > Multiple common symptoms**

> **Pattern recognition > Numerical scoring**

> **ONE clear winner, not options**

> **Think like a homeopath, not a calculator**

---

## Files Reference

| File                           | Purpose                 |
| ------------------------------ | ----------------------- |
| `remedyService.js`             | Main implementation     |
| `CLINICAL_REASONING_ENGINE.md` | Full documentation      |
| `IMPLEMENTATION_SUMMARY.md`    | Executive summary       |
| `QUICK_REFERENCE.md`           | This file               |
| `test_clinical_reasoning.js`   | Professional test suite |

---

## Common Issues

**Issue:** Belladonna not ranking #1 in acute case

**Possible Causes:**

1. Symptom text doesn't match repertory rubrics
2. Not enough decisive keywords in symptoms
3. Pattern not triggering (< 3 keyword matches)
4. Repertory data format issue

**Solution:**

1. Use decisive keywords in symptom text
2. Mark characteristic symptoms as 'keynote' type
3. Set patient type to 'acute'
4. Verify repertory data format

---

**Quick Start:** Read `IMPLEMENTATION_SUMMARY.md` → Run `test_clinical_reasoning.js` → Review `CLINICAL_REASONING_ENGINE.md` for details

---

_Rayyan Quantum Labs - Homeopathic Clinical Reasoning Engine v1.0_
