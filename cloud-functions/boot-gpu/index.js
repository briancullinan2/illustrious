// cloud-functions/boot-gpu/index.js
const { Compute } = require('@google-cloud/compute');

// 👉 Changed from bootGpuWorker to bootGpu
exports.bootGpu = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    try {
        const compute = new Compute();
        return res.status(200).json({
            status: 'PROVISIONING',
            engine: 'juggernaut-xl',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        return res.status(500).json({ status: 'ERROR', error: err.message });
    }
};