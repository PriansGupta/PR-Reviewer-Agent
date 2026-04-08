require('dotenv').config(); // MUST BE LINE 1
const express = require('express');
const { getPRData, postComment } = require('./services/github');
const { analyzeDiff } = require('./services/analyzer');
const { validateFix } = require('./services/sandbox');
const { verifyGitHubSignature } = require('./utils/verify');

const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
    // 1. Security Check
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

            // 2. Initial Analysis
            let review = await analyzeDiff(diff);

            if (review.hasIssue) {
                // 3. Agentic Loop: Validate the suggested code
                console.log("🧪 Validating suggested fix...");
                let validation = await validateFix(review.suggestedFix);

                if (!validation.success) {
                    console.log("⚠️ Fix failed syntax check. Re-requesting from AI...");
                    const retryPrompt = `Your previous fix for this diff failed with error: ${validation.error}. Please provide a syntactically correct fix for:\n${diff}`;
                    review = await analyzeDiff(retryPrompt);
                }

                // 4. Post the final result
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