const { execSync } = require('child_process');
const fs = require('fs');

async function validateFix(suggestedCode) {
    const tempFileName = 'temp_test_file.js';
    try {
        // 1. Write the AI's code to a temporary file
        fs.writeFileSync(tempFileName, suggestedCode);

        // 2. Run a linter or a syntax check (Node's built-in check)
        // This command checks for syntax errors without executing the full script
        execSync(`node --check ${tempFileName}`);

        // 3. (Optional) Run your actual test suite
        // execSync('npm test'); 

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    } finally {
        // Cleanup: Delete the temp file
        if (fs.existsSync(tempFileName)) fs.unlinkSync(tempFileName);
    }
}

module.exports = { validateFix };