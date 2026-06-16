const { google } = require('googleapis');

exports.oauthGateway = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }

    const CLIENT_ID = process.env.GCP_CLIENT_ID;
    const CLIENT_SECRET = process.env.GCP_CLIENT_SECRET;

    // 👉 Pull your editable custom frontend application domain directly from the container's environment
    const FRONTEND_REDIRECT_TARGET = process.env.REDIRECT_URI || 'http://localhost:4000/';

    // Reconstruct the internal callback target path matching this specific Cloud Function's location
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const computedFunctionUrl = `${protocol}://${host}/`;

    // Initialize OAuth client using our static function callback URL
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, computedFunctionUrl);

    // ==========================================
    // 🛰️ ROUTE A: Google Callback Interception Handshake
    // ==========================================
    if (req.query.code) {
        try {
            const { tokens } = await oauth2Client.getToken(req.query.code);

            // TODO: Persist these tokens inside a secure database layer here

            // 👉 Bounce them cleanly back to your custom editable domain (e.g., GitHub Pages) with status flags!
            const finalRedirectUrl = `${FRONTEND_REDIRECT_TARGET.replace(/\/$/, '')}/?status=success&token=${tokens.access_token}`;
            return res.redirect(finalRedirectUrl);

        } catch (err) {
            console.error("❌ Handshake token validation broken:", err.message);
            return res.status(500).send(`Token exchange snapped: ${err.message}`);
        }
    }

    // ==========================================
    // 🛰️ ROUTE B: Initiate Global Login Redirection
    // ==========================================
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            //'https://www.googleapis.com/auth/cloud-platform'
        ],
    });

    res.redirect(authUrl);
};