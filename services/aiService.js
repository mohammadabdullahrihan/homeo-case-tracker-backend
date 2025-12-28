const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');

const generateSummary = async (caseData) => {
    try {
        console.log("Using API Key:", apiKey ? "Present (Starts with " + apiKey.substring(0, 4) + ")" : "Missing");
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is missing from environment variables.");
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
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
            ]
        });

        // Format the case data
        const formattedData = Object.entries(caseData)
            .map(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    return `${key}: ${JSON.stringify(value)}`;
                }
                return `${key}: ${value}`;
            })
            .join('\n');

        const prompt = `
      You are an experienced homeopathic physician.
      Your job is to write a concise, doctor-readable Bangla case summary based on the following patient data.
      
      RULES:
      1. Do NOT diagnose.
      2. Do NOT suggest medicine.
      3. Do NOT add extra information not present in the data.
      4. Remove repetition.
      5. Keep the tone clinical, calm, and professional.
      6. Write in Bengali (Bangla) ONLY.
      7. Write as plain text paragraphs. Do NOT use any markdown formatting (no *, #, -, etc.).
      8. Do NOT use phrases like "বর্ণনা করা হয়েছে", "উল্লেখ করা হয়েছে" or similar passive descriptions.
      9. Do NOT add headings like "কেস সারাংশ" or any title. Start directly with the patient information.
      10. Focus on the Totality of Symptoms.
      11. Write in a direct, active voice describing the patient's condition.

      PATIENT DATA:
      ${formattedData}
      
      OUTPUT (Write only the clean Bangla case summary, nothing else):
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        let text = '';
        try {
            text = response.text();
        } catch (e) {
            console.error('Gemini text retrieval error (Safety/Block?):', e);
            text = 'AI Summary could not be generated due to safety filters or API limits. Please review the raw data.';
        }

        return text;

    } catch (error) {
        console.error('Error generating AI summary with Gemini:', error);
        throw new Error('Failed to generate summary: ' + error.message);
    }
};

module.exports = { generateSummary };
