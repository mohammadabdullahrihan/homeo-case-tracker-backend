const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config({ override: true });

const generateSummary = async (caseData) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is missing from environment variables.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

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
      - For each symptom, provide THREE fields:
        1. "clinical": The technical English rubric (Category - Rubric). Try to use standard Kent Repertory terms.
           - Examples: "HEAD - PAIN - throbbing", "MIND - ANXIETY", "GENERALITIES - FOOD - desires".
        2. "friendly": A very simple Bangla translation.
        3. "type": Categorize as 'mental', 'keynote', or 'physical'. 
           - 'mental' for MIND/Emotion symptoms.
           - 'keynote' for very peculiar, rare or striking traits.
           - 'physical' for common body/organ symptoms.
      - Use these Standard Categories: MIND, VERTIGO, HEAD, EYE, VISION, EAR, HEARING, NOSE, FACE, MOUTH, TEETH, THROAT, STOMACH, ABDOMEN, RECTUM, STOOL, BLADDER, URINE, GENITALIA, LARYNX, RESPIRATION, COUGH, CHEST, BACK, EXTREMITIES, SLEEP, CHILL, FEVER, PERSPIRATION, SKIN, GENERALITIES.
      - Aim for 8-12 key symptoms.

      PATIENT DATA:
      ${formattedData}
      
      OUTPUT FORMAT:
      Return ONLY a JSON object:
      {
        "summary": "The Bangla summary text here",
        "symptoms": [
          { "clinical": "CATEGORY - RUBRIC", "friendly": "সহজ বাংলা বর্ণনা", "type": "mental|keynote|physical" },
          ...
        ]
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Handle potential safety block
        if (!response.candidates || response.candidates.length === 0) {
            console.error('Gemini Safety Block or No Candidates:', JSON.stringify(response));
            throw new Error('AI blocked the response due to safety filters or returned no results.');
        }

        const text = response.text();
        console.log('Gemini raw response text:', text);
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('JSON Parse Error from Gemini. Raw text:', text);
            // Attempt to clean markdown if present
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                return JSON.parse(cleanedText);
            } catch (e2) {
                return {
                    summary: text.substring(0, 500), 
                    symptoms: []
                };
            }
        }

    } catch (error) {
        const fs = require('fs');
        const logMsg = `\n[${new Date().toISOString()}] AI Error: ${error.message}\nStack: ${error.stack}\n`;
        fs.appendFileSync('error_log.txt', logMsg);
        console.error('Error generating AI summary with Gemini:', error);
        throw new Error('Failed to generate summary: ' + error.message);
    }
};

module.exports = { generateSummary };
