const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key loaded:", apiKey ? "YES" : "NO");

if (!apiKey) {
    console.error("❌ No GEMINI_API_KEY in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        console.log("Listing models...");
        // Not all SDK versions support listModels directly on genAI, usually it's on a ModelManager or via rest.
        // But let's try a simple generation with a known valid model valid for free tier if possible.
        // Or if I can't list, I will try 'gemini-1.0-pro' since 'gemini-pro' is alias for 1.0.

        // Actually, let's try to print the error details more clearly.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Test");
        console.log(result.response.text());

    } catch (error) {
        console.error("❌ FAILURE:");
        console.error(error);
        if (error.response) {
            console.error("Response data:", error.response);
        }
    }
}

run();
