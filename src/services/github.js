const { Octokit } = require("@octokit/rest");
require('dotenv').config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function getPRData(owner, repo, pull_number) {
    const { data } = await octokit.pulls.get({
        owner, repo, pull_number,
        mediaType: { format: "diff" },
    });
    return data;
}

async function postComment(owner, repo, pull_number, review) {
    let body = `### 🤖 Sentinel AI RAG Review\n\n`;

    // 1. Local syntax/logic issues
    if (review.explanation && review.explanation !== "") {
        body += `**🔍 Local PR Issue:** ${review.explanation}\n\n`;
    }

    // 2. The Sandbox Validated Fix
    if (review.suggestedFix && review.suggestedFix.trim() !== "") {
        body += `**Suggested Fix:**\n\`\`\`javascript\n${review.suggestedFix}\n\`\`\`\n\n`;
    }

    // 3. Global Architecture/Dependency Issues
    if (review.globalIssues && review.globalIssues.length > 0) {
        body += `#### 🌍 Global Codebase Impact\n`;
        body += `⚠️ *The AI detected that this PR breaks dependencies in other files across the repository:*\n\n`;

        review.globalIssues.forEach(item => {
            body += `- **File:** \`${item.targetFile}\`\n`;
            body += `  - **Impact:** ${item.issueDescription}\n`;
            body += `  - **Required Action:** ${item.requiredAction}\n\n`;
        });
    }

    await octokit.issues.createComment({
        owner, repo, issue_number: pull_number, body
    });
}
module.exports = { getPRData, postComment };