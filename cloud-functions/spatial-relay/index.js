// cloud-functions/spatial-relay/index.js
const http = require('http');
const https = require('https');

exports.spatialRelay = (req, res) => {
    // 1. Standard CORS Setup for your frontend
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-target-endpoint');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    // 2. Extract the active GPU endpoint you got from your cluster manager
    const targetUrl = req.headers['x-target-endpoint'];

    if (!targetUrl) {
        return res.status(400).json({ error: 'Missing x-target-endpoint header.' });
    }

    console.log(`📡 [RELAY] Piping multipart payload to worker: ${targetUrl}`);

    try {
        const parsedUrl = new URL(targetUrl);

        // 3. Configure the exact mirror of the incoming request
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 80,
            path: parsedUrl.pathname,
            method: req.method,
            headers: {
                ...req.headers,
                host: parsedUrl.host // Required for HTTP/1.1 protocol standards
            }
        };

        // 4. Open the outbound connection to the GPU Worker
        const proxyReq = http.request(options, (proxyRes) => {
            // Mirror the worker's response status and headers back to the browser
            res.status(proxyRes.statusCode);

            // Specifically pass the JPEG content-type back
            if (proxyRes.headers['content-type']) {
                res.set('Content-Type', proxyRes.headers['content-type']);
            }

            // Pipe the generated image stream directly back to the user's canvas
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => {
            console.error('❌ [RELAY ERROR] Failed to hit GPU worker:', e.message);
            res.status(500).json({ error: 'Worker uncreachable', details: e.message });
        });

        // 5. Pipe the incoming user image upload straight into the worker connection
        req.pipe(proxyReq);

    } catch (err) {
        console.error("❌ [CRITICAL RELAY FAULT]", err);
        return res.status(500).json({ error: err.message });
    }
};