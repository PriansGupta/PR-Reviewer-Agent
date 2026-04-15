const { OpenAIEmbeddings } = require("@langchain/openai");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
require('dotenv').config();

async function getRepositoryContext(queryText) {
    try {
        const vectorStore = await Chroma.fromExistingCollection(new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
        }), {
            collectionName: "sentinel-repo",
            url: "http://localhost:8000",
        });

        // Search for the top 3 most relevant files/chunks matching the diff
        const results = await vectorStore.similaritySearch(queryText, 3);

        if (!results || results.length === 0) return "No specific context found.";

        // Format the results so the LLM knows which file each snippet belongs to
        return results.map(doc => `--- File: ${doc.metadata.source} ---\n${doc.pageContent}`).join("\n\n");
    } catch (error) {
        console.error("⚠️ ChromaDB not reachable or collection missing. Proceeding without context.");
        return "";
    }
}

module.exports = { getRepositoryContext };