const crypto = require('crypto');
require('dotenv').config();

function verifyGitHubSignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return false;

    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
    const digest = Buffer.from('sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex'), 'utf8');
    const checksum = Buffer.from(signature, 'utf8');

    return crypto.timingSafeEqual(digest, checksum);
}

module.exports = { verifyGitHubSignature };