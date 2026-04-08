const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { JsonOutputParser } = require("@langchain/core/output_parsers");
require('dotenv').config();

const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
    temperature: 0
});

async function analyzeDiff(diffText) {
    // 1. CONTEXT GUARD: If the diff is just metadata or empty, skip the AI call
    // This prevents the "Please provide a diff" conversational response.
    if (!diffText || diffText.length < 20 || !diffText.includes('+++')) {
        console.log("⚠️ Diff is too small or invalid. Skipping AI analysis.");
        return { hasIssue: false, explanation: "No significant code changes found.", suggestedFix: "" };
    }

    const parser = new JsonOutputParser();

    // 2. UPDATED PROMPT: We force the LLM to be a JSON engine, not a chatbot.
    const template = `
        You are a Senior Software Engineer specializing in Code Quality.
        
        CRITICAL RULES:
        1. You must ONLY output valid JSON. No conversational text.
        2. If the Git Diff is empty or unreadable, return: 
           {{ "hasIssue": false, "explanation": "Invalid Diff", "suggestedFix": "" }}
        
        {format_instructions}
        
        GIT DIFF TO REVIEW:
        {diff}
    `;

    const prompt = PromptTemplate.fromTemplate(template);

    try {
        // We use a chain for clean output
        const chain = prompt.pipe(model).pipe(parser);

        const result = await chain.invoke({
            diff: diffText,
            format_instructions: parser.getFormatInstructions()
        });

        return result;
    } catch (error) {
        console.error("Analysis Error (Attempting manual parse):", error.message);

        // 3. FAILSAFE: If the parser fails, we try one manual parse before giving up
        try {
            // Some versions of LangChain might return the raw object in the error
            if (error.output) {
                let cleaned = error.output
                    .replace(/^```json\n?/, "")
                    .replace(/^```\n?/, "")
                    .replace(/\n?```$/, "");
                return JSON.parse(cleaned);
            }
        } catch (innerError) {
            return { hasIssue: false, explanation: "AI returned unparseable content.", suggestedFix: "" };
        }

        throw error;
    }
}

module.exports = { analyzeDiff };