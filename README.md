# 🤖 Sentinel AI Reviewer: Autonomous PR Reviewer Agent

An intelligent, autonomous pull request reviewing agent built to automate code quality audits. Utilizing Node.js, LangChain, and ChromaDB, this tool goes beyond simple diff analysis by employing a **repository-aware RAG (Retrieval-Augmented Generation)** system and a **self-correction loop** to ensure highly accurate, syntactically valid code reviews and suggestions.

## ✨ Key Features

- **🌍 Repository-Aware RAG System:** Instead of analyzing PR diffs in isolation, the agent indexes your entire codebase into a local ChromaDB instance. When reviewing a PR, it retrieves relevant repository context to understand global architecture and dependencies.
- **🧠 Intelligent Analysis:** Powered by LangChain and OpenAI's `gpt-4o`, the agent acts as a strict Software Architect, identifying local syntax issues, logic flaws, and global codebase impacts.
- **🧪 Sandbox Validation & Self-Correction:** Any code fix suggested by the AI is written to a temporary sandbox file and validated against Node.js syntax checks (`node --check`). If the code is invalid, the agent automatically feeds the error back to the LLM for a corrected fix before posting.
- **🔗 Seamless GitHub Integration:** Listens to `opened` and `synchronize` webhook events, fetches the PR diff, and automatically posts a structured comment containing the review, suggested fixes, and global impact warnings.
- **🔐 Secure Webhooks:** Built-in cryptographic verification of GitHub webhook signatures using HMAC SHA256 to ensure payloads are authentic.

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **AI & Orchestration:** LangChain (`@langchain/community`, `@langchain/core`, `@langchain/openai`)
- **LLM:** OpenAI (`gpt-4o`)
- **Vector Database:** ChromaDB
- **GitHub API:** `@octokit/rest`

## 📋 Prerequisites

Before you begin, ensure you have the following installed and configured:

1. **Node.js** (v18 or higher recommended)
2. **ChromaDB**: A local instance running on port `8000`.
3. **OpenAI API Key**: For embedding generation and GPT-4o analysis.
4. **GitHub Personal Access Token (PAT)**: With repository and pull request read/write permissions.
