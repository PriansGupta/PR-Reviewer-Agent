const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { JsonOutputParser } = require("@langchain/core/output_parsers");
const { getRepositoryContext } = require("./retriever"); // NEW IMPORT
require('dotenv').config();

const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
    temperature: 0.2
});

async function analyzeDiff(diffText) {
    console.log("🔍 Starting analysis of the diff...", diffText);
    if (!diffText) {
        console.log("⚠️ Diff is too small or invalid. Skipping AI analysis.");
        return { hasIssue: false, explanation: "No significant code changes found.", suggestedFix: "" };
    }

    console.log("🔍 Fetching repository context via RAG...");
    const context = await getRepositoryContext(diffText);
    const parser = new JsonOutputParser();

    // 🚀 STRICT SCHEMA ENFORCEMENT PROMPT
    const template = `
        You are a strict Software Architect reviewing a PULL REQUEST DIFF against the REPOSITORY CONTEXT.
        
        CRITICAL RULES:
        1. You MUST output ONLY valid JSON.
        2. You MUST use the EXACT keys provided in the schema below. Do NOT invent new keys (e.g., no 'business_logic', no 'missing_updates').
        3. Do NOT use snake_case. Use camelCase exactly as shown.
        
        REQUIRED JSON SCHEMA:
        {{
            "hasIssue": true/false, // Set to true if ANY local or global issue is found.
            "explanation": "Summarize the local syntax/logic issues found inside the diff itself.",
            "suggestedFix": "Write the corrected code for the DIFF here. If no code fix is needed, return an empty string.",
            "globalIssues": [ // Array of files broken by this PR. Empty array [] if none.
                {{
                    "targetFile": "The file name from context that needs updating.",
                    "issueDescription": "Why this file is broken by the PR.",
                    "requiredAction": "What the developer needs to change."
                }}
            ]
        }}
        
        REPOSITORY CONTEXT (Other files in the system):
        {context}

        PULL REQUEST DIFF TO REVIEW:
        {diff}
    `;

    const prompt = PromptTemplate.fromTemplate(template);

    try {
        const chain = prompt.pipe(model).pipe(parser);
        const result = await chain.invoke({
            diff: diffText,
            context: context || "No broader context available."
        });
        return result;
    } catch (error) {
        console.error("Analysis Error:", error.message);
        return { hasIssue: false, explanation: "AI processing failed.", suggestedFix: "" };
    }
}

module.exports = { analyzeDiff };