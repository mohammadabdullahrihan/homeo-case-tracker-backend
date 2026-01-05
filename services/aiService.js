const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');

const generateSummary = async (caseData) => {
    try {
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is missing from environment variables.");
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", 
            generationConfig: {
                responseMimeType: "application/json",
            },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });

        const formattedData = Object.entries(caseData)
            .map(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    return `${key}: ${JSON.stringify(value)}`;
                }
                return `${key}: ${value}`;
            })
            .join('\n');

        const prompt = `
      You are an experienced homoeopathic physician.
      Based on the provided patient data, perform two tasks:
      1. Write a clinical, doctor-readable Bangla case summary.
      2. Identify a list of 5-10 key clinical symptoms (rubrics) in English that can be used to search a homoeopathic repertory.

      RULES for Summary:
      - Write in Bengali (Bangla) ONLY.
      - Keep it clinical, professional, and active voice.
      - Do NOT diagnose or suggest medicine.
      - Focus on Totality of Symptoms.
      - Plain text format without markdown.

      RULES for Symptoms (Rubrics):
      - For each symptom, provide TWO fields:
        1. "clinical": The technical English rubric. Use ONLY these categories: MIND, HEAD, EYE, VISION, EAR, HEARING, NOSE, FACE, MOUTH, TEETH, THROAT, ABDOMEN, COUGH, FEVER, SKIN, SLEEP, PERSPIRATION, VERTIGO.
        2. "friendly": A very simple Bangla translation (e.g., "মাথা ব্যথা", "অতিরিক্ত রাগ").
      - Only include symptoms present in the data.
      - Aim for 8-12 key symptoms.

      EXAMPLES:
      - "MIND - ANGER"
      - "SKIN - ITCHING"
      - "ABDOMEN - DESIRES - cold drinks"
      - "PERSPIRATION - PROFUSE"

      PATIENT DATA:
      ${formattedData}
      
      OUTPUT FORMAT:
      Return ONLY a JSON object with the following structure:
      {
        "summary": "The Bangla summary text here",
        "symptoms": [
          { "clinical": "CATEGORY - RUBRIC", "friendly": "সহজ বাংলা বর্ণনা" },
          ...
        ]
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('JSON Parse Error from Gemini:', text);
            return {
                summary: text.substring(0, 500), // Fallback
                symptoms: []
            };
        }

    } catch (error) {
        console.error('Error generating AI summary with Gemini:', error);
        throw new Error('Failed to generate summary: ' + error.message);
    }
};

module.exports = { generateSummary };
