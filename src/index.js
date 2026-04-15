require('dotenv').config(); // MUST BE LINE 1
const express = require('express');
const { getPRData, postComment } = require('./services/github');
const { analyzeDiff } = require('./services/analyzer');
const { validateFix } = require('./services/sandbox');
const { verifyGitHubSignature } = require('./utils/verify');

const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
    if (!verifyGitHubSignature(req)) {
        console.error("❌ Unauthorized Webhook attempt.");
        return res.status(401).send('Unauthorized');
    }

    const event = req.body;

    if (event.action === 'opened' || event.action === 'synchronize') {
        const repo = event.repository.name;
        const owner = event.repository.owner.login;
        const pullNumber = event.number;

        console.log(`🚀 Analyzing PR #${pullNumber} in ${repo}...`);

        try {
            const diff = await getPRData(owner, repo, pullNumber);
            console.log("📄 Diff fetched successfully. Starting analysis...");

            let review = await analyzeDiff(diff);
            console.log("🔍 Analysis complete:", JSON.stringify(review, null, 2));

            // Trust the LLM Contract: we just check hasIssue
            if (review.hasIssue) {

                // Sandbox Validation (Only if a string of code was provided)
                if (review.suggestedFix && review.suggestedFix.trim() !== "") {
                    console.log("🧪 Validating suggested fix...");
                    let validation = await validateFix(review.suggestedFix);

                    if (!validation.success) {
                        console.log("⚠️ Fix failed syntax check. Re-requesting from AI...");

                        // 👇 FIX: We explicitly append the original diff so it passes the '+++' check in analyzer.js
                        const retryPrompt = `Your previous fix failed with the following syntax error:\n${validation.error}\n\nPlease provide a syntactically correct fix for this diff. Use the exact same JSON schema:\n\n${diff}`;

                        review = await analyzeDiff(retryPrompt);
                    }
                } else {
                    console.log("⚠️ No code fix provided. Skipping Sandbox.");
                }

                await postComment(owner, repo, pullNumber, review);
                console.log(`✅ Review posted for PR #${pullNumber}`);
            } else {
                console.log("✨ No issues found in this PR.");
            }
        } catch (error) {
            console.error("❌ Error processing PR:", error.message);
        }
    }
    res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Agent active on port ${PORT}`));