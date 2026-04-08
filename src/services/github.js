const { Octokit } = require("@octokit/rest");
require('dotenv').config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function getPRData(owner, repo, pull_number) {
    // Fetch the diff as text
    const { data } = await octokit.pulls.get({
        owner, repo, pull_number,
        mediaType: { format: "diff" },
    });
    return data;
}

async function postComment(owner, repo, pull_number, review) {
    const body = `### 🤖 Sentinel AI Review\n\n**Issue Found:** ${review.explanation}\n\n\`\`\`javascript\n${review.suggestedFix}\n\`\`\``;

    await octokit.issues.createComment({
        owner, repo, issue_number: pull_number, body
    });
}

module.exports = { getPRData, postComment };