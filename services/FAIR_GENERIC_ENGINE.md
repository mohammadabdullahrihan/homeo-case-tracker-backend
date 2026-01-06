# Fair & Generic Clinical Reasoning Engine

## 🎯 Core Philosophy

**ALL remedies are evaluated equally. NO remedy gets special treatment or fixed bonuses.**

This engine implements a completely fair, dynamic, and generic scoring system where:
- ✅ All remedies follow the same rules
- ✅ Scoring is based purely on symptom matching and pattern recognition
- ✅ Bonuses are dynamic and apply to ANY remedy that qualifies
- ✅ No remedy has hardcoded top-rank privileges

---

## 📐 Scoring Formula

### 1️⃣ Base Score (Same for ALL remedies)

```javascript
baseScore = (Number of matched rubrics × 10) + Total grade of matched rubrics
```

**Example:**
- Remedy matches 5 rubrics with grades [3, 2, 3, 1, 2]
- Base Score = (5 × 10) + (3+2+3+1+2) = 50 + 11 = 61

---

### 2️⃣ Symptom Multipliers (Same for ALL remedies)

```javascript
multiplier = 1.0

if (has keynote symptoms) multiplier ×= 1.5
if (has mental symptoms) multiplier ×= 1.25
```

**Example:**
- Remedy has both keynote and mental symptoms
- Multiplier = 1.0 × 1.5 × 1.25 = 1.875

---

### 3️⃣ Pattern Recognition (Same for ALL remedies)

**10 Defined Patterns:**

| Remedy | Pattern Keywords | Min Match | Acute? |
|--------|-----------------|-----------|--------|
| Belladonna | sudden, throbbing, heat, red, violent, photophobia, dry, right | 3 | ✓ |
| Aconite | sudden, fear, anxiety, restless, panic, acute, onset, midnight | 3 | ✓ |
| Arsenicum | burning, anxiety, restless, cold, thirst, midnight, fastidious | 3 | ✓ |
| Bryonia | worse motion, better rest, irritable, thirst, dry, pressure, lying | 3 | ✓ |
| Pulsatilla | changeable, mild, weeping, thirstless, worse heat, better open air, clingy | 3 | ✗ |
| Nux Vomica | irritable, chilly, digestive, worse morning, stimulants, oversensitive | 3 | ✓ |
| Sulphur | burning, heat, worse heat, itching, offensive, lazy, philosopher | 3 | ✗ |
| Lycopodium | worse 4-8pm, right sided, digestive, bloating, anticipatory, cowardly | 3 | ✗ |
| Phosphorus | burning, thirst cold water, hemorrhage, anxious, sympathetic, fears | 3 | ✗ |
| Natrum Mur | grief, closed, worse consolation, worse sun, thirst, headache | 3 | ✗ |

**Pattern Bonus Formula:**

```javascript
if (pattern matched) {
  patternBonus = 50 + (matchStrength × 0.2)  // 50-70 points
}
```

**Match Strength:**
```javascript
matchStrength = (matched keywords / total keywords) × 100  // 0-100%
```

**Example:**
- Belladonna pattern has 8 keywords
- Patient symptoms contain 5 of them
- Match Strength = (5/8) × 100 = 62.5%
- Pattern Bonus = 50 + (62.5 × 0.2) = 50 + 12.5 = 62.5 points

---

### 4️⃣ Acute/Chronic Bonus (Dynamic - ANY remedy can qualify)

**Acute Case Detection:**
- Detects 4 signals: sudden onset, violent intensity, rapid progression, acute keyword
- If ≥2 signals present → Acute Case

**Chronic Case Detection:**
- Detects 4 signals: long standing, gradual onset, chronic keyword, constitutional
- If ≥2 signals present → Chronic Case

**Bonus Calculation:**

```javascript
// For ACUTE cases
if (patient type = 'acute' AND case is acute AND remedy is acute remedy) {
  acuteBonus = 10 + (acuteSignalCount × 7.5)  // 10-40 points
}

// For CHRONIC cases
if (patient type = 'chronic' AND case is chronic AND remedy is chronic remedy) {
  chronicBonus = 15 points
}
```

**Example:**
- Patient has 4 acute signals (sudden, violent, rapid, acute keyword)
- Remedy is marked as acute remedy (Belladonna, Aconite, Bryonia, etc.)
- Acute Bonus = 10 + (4 × 7.5) = 10 + 30 = 40 points

**Important:** This bonus applies to ANY acute remedy, not just Belladonna!

---

### 5️⃣ Polychrest Normalization (Same for ALL polychrests)

**Polychrest Remedies:**
- Belladonna, Sulphur, Calcarea Carbonica, Lycopodium
- Phosphorus, Natrum Muriaticum, Arsenicum Album, Pulsatilla
- Nux Vomica, Bryonia, Sepia, Silicea

**Penalty Calculation:**

```javascript
if (remedy is polychrest AND characteristic matches < 2) {
  penalty = 0.88  // 12% reduction
} else {
  penalty = 1.0  // No penalty
}
```

**Purpose:** Prevents polychrests from dominating through sheer volume without true characteristic indication.

---

### 6️⃣ Tie-Breaker (Same for ALL remedies)

**When scores are within 12%, apply tie-breaking:**

```javascript
tieBreakScore = 0

// 1. Decisive symptom count (most important)
tieBreakScore += decisiveSymptomCount × 12

// 2. Keynote matches
tieBreakScore += characteristicMatchCount × 8

// 3. Pattern match strength
if (pattern locked) {
  tieBreakScore += patternMatchStrength × 0.3  // 0-30 points
}

// 4. Acute/Chronic fit
if (patient type matches remedy type) {
  tieBreakScore += 10
}
```

---

### 7️⃣ Final Score (Same formula for ALL remedies)

```javascript
finalScore = ((baseScore + weightedIntensity) × multiplier × polyChrestPenalty) 
             + patternBonus 
             + acuteChronicBonus
```

---

## 📊 Complete Example

**Patient Case:**
- Type: Acute
- Symptoms: sudden onset, throbbing headache, photophobia, heat, dry skin, restlessness

**Remedy: Belladonna**

1. **Base Score:**
   - Matched 6 rubrics with grades [3, 3, 2, 3, 2, 1]
   - Base = (6 × 10) + 14 = 74

2. **Symptom Multipliers:**
   - Has keynote symptoms: ×1.5
   - Has mental symptoms: ×1.25
   - Multiplier = 1.875

3. **Pattern Recognition:**
   - Belladonna pattern matched 6/8 keywords
   - Match Strength = 75%
   - Pattern Bonus = 50 + (75 × 0.2) = 65

4. **Acute Bonus:**
   - Case has 3 acute signals
   - Belladonna is acute remedy
   - Acute Bonus = 10 + (3 × 7.5) = 32.5

5. **Polychrest Penalty:**
   - Belladonna is polychrest
   - Has 4 characteristic matches (≥2)
   - Penalty = 1.0 (no penalty)

6. **Final Score:**
   - ((74 + weightedIntensity) × 1.875 × 1.0) + 65 + 32.5
   - ≈ 250-300 points

**Remedy: Nux Vomica (same case)**

1. **Base Score:** 68 (matched 5 rubrics)
2. **Multiplier:** 1.875 (same symptom types)
3. **Pattern Bonus:** 0 (pattern not matched)
4. **Acute Bonus:** 32.5 (also acute remedy)
5. **Polychrest Penalty:** 0.88 (only 1 characteristic match)
6. **Final Score:** ≈ 180-200 points

**Result:** Belladonna ranks higher due to pattern match, not special treatment!

---

## 🎯 Key Differences from Previous Version

| Aspect | Old (Biased) | New (Fair) |
|--------|-------------|-----------|
| Belladonna Bonus | Fixed +40 | Dynamic 10-40 (any acute remedy) |
| Pattern Recognition | 6 remedies | 10 remedies (expandable) |
| Acute Bonus | Belladonna only | ANY acute remedy |
| Scoring | Special cases | Universal formula |
| Tie-Breaking | Favored Belladonna | Equal criteria for all |

---

## 📈 Output Format

```javascript
{
  fullName: "Belladonna",
  clinicalScore: 285.50,
  coverage: 6,                      // Symptoms matched
  decisiveSymptomCount: 4,          // Decisive symptoms
  characteristicMatchCount: 4,      // Characteristic matches
  patternLocked: true,              // Pattern recognized
  patternMatchStrength: 75.0,       // 0-100%
  patternDescription: "Sudden + Heat + Throbbing + Dry",
  isAcuteRemedy: true,              // Acute remedy flag
  acuteBonusApplied: true,          // Acute bonus given
  clinicalJustification: "Pattern match (75%): Sudden + Heat + Throbbing + Dry. 4 decisive symptoms. 4 characteristic matches. Acute case fit (+33 bonus)"
}
```

---

## 🔧 Adding New Patterns

To add a new remedy pattern, edit `REMEDY_PATTERNS` in `remedyService.js`:

```javascript
'New Remedy Name': {
  keywords: ['keyword1', 'keyword2', 'keyword3', ...],
  minMatch: 3,  // Minimum keywords to match
  description: 'Pattern description',
  acuteRemedy: true  // or false
}
```

---

## ✅ Fairness Guarantees

1. **No hardcoded remedy preferences**
2. **All bonuses are dynamic and rule-based**
3. **Pattern recognition applies to all defined remedies**
4. **Acute bonus available to ANY acute remedy**
5. **Polychrest penalty applies equally to all polychrests**
6. **Tie-breaking uses same criteria for all remedies**
7. **Final score uses identical formula for everyone**

---

## 🧪 Testing

```bash
node services/test_clinical_reasoning.js
```

Expected behavior:
- Different remedies rank #1 based on symptom matching
- No remedy always wins
- Scores reflect actual symptom coverage and pattern strength
- Clinical justifications explain the ranking

---

## 📚 Summary

This is a **truly fair and generic clinical reasoning engine** where:

> **The remedy that BEST matches the patient's symptoms wins**

> **No remedy has special privileges**

> **All rules apply equally to all remedies**

> **Scoring is transparent and reproducible**

---

**Version:** 2.0 (Fair & Generic)  
**Last Updated:** 2026-01-06  
**Author:** Rayyan Quantum Labs
