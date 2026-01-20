const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const { Bytez } = require('bytez.js');
const dotenv = require('dotenv');
const SystemConfig = require('../models/SystemConfig');

dotenv.config({ override: true });

const generateSummary = async (caseData) => {
  // Fetch system configuration for dynamic prompt
  let systemConfig = await SystemConfig.findOne();
  if (!systemConfig) {
    systemConfig = await SystemConfig.create({});
  }

  const formattedData = Object.entries(caseData)
    .map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${value}`;
    })
    .join('\n');

  // Use dynamic prompt from system config or fallback to default
  const basePrompt =
    systemConfig.aiPrompt ||
    `
      You are an elite, world-class Homoeopathic Consultant with decades of experience in classical homoeopathy.
      You are tasked with providing a MASTER-LEVEL analysis of the following patient case record.

      REQUIRED TASKS:
      1. **EXHAUSTIVE CLINICAL BANGLA SUMMARY:**
         - Write a deep, descriptive, and clinical case history in Bengali.
         - Minimum 400-600 words. DO NOT summarize briefly; explain the progression of the disease.
         - Structure: 
            a. Chief Complaints (প্রধান কষ্টসমূহ) in detail.
            b. History of Present Illness (বর্তমান রোগের বিস্তারিত বিবরণ) with modalities (aggravation/amelioration).
            c. Physical Generals (শারীরিক সাধারণ লক্ষণ) including Appetite, Thirst, Tongue, Bowel/Bladder habits, Sleep, Dreams, and Thermal Reaction (Chilly/Hot/Ambi-thermal).
            d. Mental State (মানসিক অবস্থা) describing temperament, fears, anxieties, and emotional triggers.
            e. Totality of Symptoms (লক্ষণসমষ্টির নির্যাস).
         - This must feel like a senior consultant's case report.

      2. **REPERTORIAL SEARCH RUBRICS (8-15 symptoms):**
         - Identify key rubrics in English for repertorization.
         - MUST include: Category - Rubric - Sub-rubric (e.g., MIND - ANGER, irascibility - trifles, at).
         - Provide clinical, friendly (Bangla), and type (mental/keynote/physical).

      3. **DEEP MIASMATIC ANALYSIS:**
         - Identify the dominant miasm (Sora, Sycosis, Syphilis, or Tubercular) and why.
         - Explain the miasmatic shift in this specific patient in Bangla.

      4. **POTENCY & POSOLOGY STRATEGY:**
         - Suggest specific potency (e.g., 30, 200, 1M, 10M, LM scales) based on the patient's sensitivity and vitality.
         - Provide a detailed repetition schedule (e.g., split doses, daily, or on wait-and-watch basis) in Bangla.

      5. **COMPREHENSIVE DIET & REGIMEN (পথ্য ও অপথ্য):**
         - Extremely detailed clinical advice based on the patient's condition.

      6. **BIOCHEMIC & AUXILIARY SUPPORT:**
         - Suggest complementary Biochemic remedies and why they help this case in Bangla.

      7. **MULTIDISCIPLINARY INSIGHTS:**
         - Provide Allopathic & Unani correlations. Mention standard drug names, why they are used, side effects, and adult dosage (for doctor's reference only) in Bangla.

      8. **DIAGNOSTIC WORKUP & PROGNOSIS:**
         - Suggest necessary laboratory tests (Blood, Imaging, etc.) and mention 'RED FLAGS' (যখন আপনাকে সাবধান হতে হবে) in Bangla.

      9. **ELITE ENGLISH PRESCRIPTION:**
         - A formal, professional English snippet including Summary, Remedies (Top 3), and Alternative Remedies.

      STRICT RULES:
      - Use Bengali (Bangla) for all points EXCEPT Rubrics and Prescription.
      - Plain text ONLY. Do NOT use markdown bolding (**) or headers (###).
      - Do NOT use bullet points in the Summary section; use paragraphs.
      - Ensure the tone is highly professional and medical.
    `;

  const prompt = `
      ${basePrompt}

      PATIENT DATA:
      ${formattedData}

      OUTPUT FORMAT:
      Return ONLY a JSON object:
      {
        "summary": "The Bangla summary text here",
        "symptoms": [
          { "clinical": "CATEGORY - RUBRIC", "friendly": "সহজ বাংলা বর্ণনা", "type": "mental|keynote|physical" }
        ],
        "miasm": "Detailed Miasmatic analysis in Bangla",
        "potency": "Potency and repetition advice in Bangla",
        "advice": "Diet and life style advice in Bangla",
        "biochemic": "Biochemic suggestions in Bangla",
        "crossDiscipline": "Allopathy and Unani insights in Bangla",
        "diagnostics": "Diagnostic tests and red flag warnings in Bangla",
        "prescription": "The English prescription text"
      }
    `;

  // --- Provider Selection from System Config ---
  const aiProvider = systemConfig.aiProvider || process.env.ACTIVE_AI_PROVIDER || 'bytez';
  const useBytez = aiProvider === 'bytez';

  if (useBytez) {
    console.log(
      `Using PRIMARY provider: Bytez (${systemConfig.aiModel || 'google/gemini-1.5-flash'})`
    );
    try {
      const bytezSdk = new Bytez(process.env.BYTEZ_API_KEY);
      const bytezModel = bytezSdk.model(systemConfig.aiModel || 'google/gemini-1.5-flash');
      const results = await bytezModel.run([{ role: 'user', content: prompt }]);

      if (results && results.output) {
        return parseAIResponse(results.output);
      }
      console.warn('Bytez returned no output, falling back to Google SDK...');
    } catch (error) {
      console.error('Bytez Provider Error:', error.message);
      console.log('Falling back to SECONDARY provider: Google SDK');
    }
  }

  // --- Fallback / Secondary Provider: Google Generative AI ---
  try {
    const directModelName = (systemConfig.aiModel || 'gemini-1.5-flash').replace('google/', '');
    console.log(`Using provider: Google SDK (${directModelName})`);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: directModelName,
      generationConfig: { responseMimeType: 'application/json' },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('AI blocked the response or returned no results.');
    }

    return parseAIResponse(response.text());
  } catch (error) {
    logError(error);
    throw new Error('Failed to generate summary: ' + error.message);
  }
};

/**
 * Helper to parse AI JSON response safely
 */
const parseAIResponse = (text) => {
  try {
    console.log('Parsing AI response...');
    let cleanText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(cleanText);

    // Safety: Ensure prescription is a string to avoid Mongoose CastErrors
    if (parsed.prescription && typeof parsed.prescription !== 'string') {
      parsed.prescription = JSON.stringify(parsed.prescription, null, 2);
    }

    return parsed;
  } catch (e) {
    console.error('JSON Parse Error:', e.message);
    return {
      summary: 'AI Response Error: Could not parse analysis. Please try again.',
      symptoms: [],
    };
  }
};

/**
 * Error Logger
 */
const logError = (error) => {
  const fs = require('fs');
  const logMsg = `\n[${new Date().toISOString()}] AI Error: ${error.message}\nStack: ${error.stack}\n`;
  fs.appendFileSync('error_log.txt', logMsg);
  console.error('AI Service Error:', error);
};

module.exports = { generateSummary };
