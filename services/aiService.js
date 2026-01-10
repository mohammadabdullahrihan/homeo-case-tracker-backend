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
      Based on the provided patient data, perform the following tasks:
      1. Write a clinical, doctor-readable Bangla case summary.
      2. Identify a list of 8-12 key clinical symptoms (rubrics) in English that can be used to search a homoeopathic repertory.
      3. Perform a Miasmatic Analysis (identify Sora, Sycosis, or Syphilis) in Bangla.
      4. Suggest Potency and Repetition (e.g. 30, 200, 1M / weekly, daily) based on the case severity in Bangla.
      5. Provide Diet and Clinical Advice (পথ্য ও অপথ্য) for the patient in Bangla.
      6. Suggest the most suitable Biochemic or Biocombination remedies in Bangla. Do NOT select inimical remedies.
      7. Provide brief Cross-Disciplinary Insights (Allopathy & Unani) in Bangla. Mention standard drug names, why they are used, and typical adult dosage (as reference only).
      8. Suggest Diagnostic Tests & Red Flags (warnings) in Bangla.
      9. Generate a professional English Prescription snippet. It should include:
         - Patient demographics (make placeholders if missing)
         - List of clinical symptoms (Summary)
         - Top 3 Homeopathic Remedies selected from task #2 (Name only, no explanation)
         - Future Alternative Remedies
         - Format it clearly for copying.

      RULES for Summary:
      - Write in Bengali (Bangla) ONLY.
      - **Create a DETAILED and COMPREHENSIVE clinical case history.** roughly 150-250 words.
      - It must be descriptive enough for a doctor to understand the full case at a glance.
      - Structure it logically: Start with Chief Complaints (প্রধান সমস্যা), then details of the problems (বর্তমান কষ্টের বিবরণ), Physical Generals (শারীরিক সাধারণ লক্ষণ like appetite, thirst, thermal reaction), and Mental State (মানসিক অবস্থা).
      - Use professional medical terminology where appropriate but keep the flow natural.
      - Do NOT diagnose or suggest specific medicine names in the summary.
      - Focus on Totality of Symptoms.
      - Plain text format ONLY. **Do NOT use asterisks (*) or markdown bolding.**
      - Write in paragraphs, do not use bullet points in the summary.

      RULES for Symptoms (Rubrics):
      - For each symptom, provide THREE fields:
        1. "clinical": The technical English rubric (Category - Rubric).
        2. "friendly": A very simple Bangla translation.
        3. "type": Categorize as 'mental', 'keynote', or 'physical'. 
      - Use standard Kent Repertory categories.

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
            // Attempt to clean markdown
            let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            
            // Extract JSON object if there's surrounding text
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanText = cleanText.substring(firstBrace, lastBrace + 1);
            }

            return JSON.parse(cleanText);
        } catch (e) {
            console.error('JSON Parse Error from Gemini. Raw text:', text);
            // Fallback: try to construct a partial object if possible, or return empty
            return {
                summary: "AI Response Error: Could not parse analysis. Please try again.",
                symptoms: []
            };
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
