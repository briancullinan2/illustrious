'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const pngToIco = require('png-to-ico').default || require('png-to-ico');

const { app } = require('../server/server.js');


const FAVICON_PATH = path.join(__dirname, '..', 'favicon.ico');

// Helper to generate a transparent 3D spatial axis icon canvas buffer
function generateSpatialIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);

    const padding = size * 0.12;
    const xc = size / 2;
    const yc = size / 2;
    const r = (size / 2) - padding;

    ctx.strokeStyle = '#00e5ff'; // Deep vibrant cyan
    ctx.lineWidth = Math.max(2, size * 0.05);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const top = [xc, yc - r * 0.9];
    const bottom = [xc, yc + r * 0.9];
    const left = [xc - r * 0.9, yc - r * 0.3];
    const right = [xc + r * 0.9, yc - r * 0.3];
    const innerLeft = [xc - r * 0.9, yc + r * 0.3];
    const innerRight = [xc + r * 0.9, yc + r * 0.3];

    ctx.beginPath();
    ctx.moveTo(top[0], top[1]);
    ctx.lineTo(right[0], right[1]);
    ctx.lineTo(innerRight[0], innerRight[1]);
    ctx.lineTo(bottom[0], bottom[1]);
    ctx.lineTo(innerLeft[0], innerLeft[1]);
    ctx.lineTo(left[0], left[1]);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xc, yc);
    ctx.lineTo(top[0], top[1]);
    ctx.moveTo(xc, yc);
    ctx.lineTo(innerLeft[0], innerLeft[1]);
    ctx.moveTo(xc, yc);
    ctx.lineTo(innerRight[0], innerRight[1]);

    ctx.strokeStyle = '#ff007f'; // Vivid magenta internal axes
    ctx.lineWidth = Math.max(1.5, size * 0.04);
    ctx.stroke();

    return canvas.toBuffer('image/png');
}

// Idempotent Favicon Endpoint
app.get('/favicon.ico', async (req, res) => {
    try {
        // Check if the file already exists on disk
        await fs.promises.access(FAVICON_PATH, fs.constants.F_OK);
        console.log('✨ [FAVICON] Asset found on disk. Serving directly.');
        return res.sendFile(FAVICON_PATH);
    } catch (err) {
        // File does not exist, trigger the generator safely
        console.warn('⚠️ [FAVICON] Asset missing from disk block. Building multi-resolution payload...');

        try {
            const pngBuffers = [
                generateSpatialIcon(16),
                generateSpatialIcon(32),
                generateSpatialIcon(48)
            ];

            const icoBuffer = await pngToIco(pngBuffers);

            // Atomic file write to minimize concurrency collisions
            await fs.promises.writeFile(FAVICON_PATH, icoBuffer);
            console.log('✅ [FAVICON] Successfully built and cached favicon.ico to file system.');

            return res.sendFile(FAVICON_PATH);
        } catch (genErr) {
            console.error('❌ [FAVICON] Dynamic compilation collapse:', genErr);
            return res.status(500).send('Internal Server Error generating asset context.');
        }
    }
});
