const fs = require('fs');
const path = require('path');
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { Chroma } = require("@langchain/community/vectorstores/chroma"); // 👈 FIX: Chroma is now imported
const { Document } = require("@langchain/core/documents");
require('dotenv').config();

// Helper to recursively read all files in a folder, bypassing broken DirectoryLoader
function getFiles(dir, allFiles = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git')) {
                getFiles(name, allFiles);
            }
        } else {
            // Only grab code files
            if (file.endsWith('.java') || file.endsWith('.js') || file.endsWith('.json')) {
                allFiles.push(name);
            }
        }
    }
    return allFiles;
}

async function indexCodebase(repoPath) {
    console.log(`📂 Scanning repository: ${repoPath}`);

    try {
        const filePaths = getFiles(repoPath);
        const docs = [];

        for (const filePath of filePaths) {
            const content = fs.readFileSync(filePath, 'utf-8');
            docs.push(new Document({
                pageContent: content,
                metadata: { source: filePath }
            }));
        }

        console.log(`📄 Loaded ${docs.length} files. Splitting into chunks...`);

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const chunks = await splitter.splitDocuments(docs);

        console.log(`🧠 Chunked into ${chunks.length} pieces. Indexing into ChromaDB...`);

        // 👈 FIX: This will now successfully connect to your local Chroma instance
        await Chroma.fromDocuments(chunks, new OpenAIEmbeddings({
            apiKey: process.env.OPENAI_API_KEY
        }), {
            collectionName: "sentinel-repo",
            url: "http://localhost:8000",
        });

        console.log("✅ Repository indexed successfully!");
    } catch (error) {
        console.error("❌ Indexing failed:", error.message);
    }
}

// Allow running this script directly from the terminal
if (require.main === module) {
    const targetRepo = process.argv[2] || "./";
    indexCodebase(targetRepo);
}

module.exports = { indexCodebase };