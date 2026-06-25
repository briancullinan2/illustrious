// detect-environment.js
const isNode = typeof process !== 'undefined' && process.release && process.release.name === 'node';

/**
 * Universally creates a rendering surface context regardless of runtime host.
 */
async function createRenderSurface(width, height) {
    if (!isNode) {
        // --- BROWSER / WORKER RUNTIME PATH ---
        // Native allocation without DOM overhead or main-thread rendering blocks
        return new OffscreenCanvas(width, height);
    } else {
        // --- HEADLESS NODE.JS CLI PATH ---
        // Dynamically load dependencies only when running in a terminal environment
        const gl = (await import('gl')).default(width, height, { preserveDrawingBuffer: true });
        const { Canvas } = await import('canvas'); // Minimalist canvas backup surface

        const canvasShim = new Canvas(width, height);
        canvasShim.addEventListener = () => { }; // Stub out event listeners for Three.js
        canvasShim.getContext = (type) => {
            if (type === 'webgl' || type === 'experimental-webgl') return gl;
            return null;
        };
        return canvasShim;
    }
}

/**
 * Unified pipeline executor.
 * Compiles id Tech 3 geometry buffers directly into image frames.
 */
export async function executeRenderPass(vertexBuffer, bounds, width = 512, height = 512) {
    // Dynamic import to prevent Node from choking on browser elements or vice versa
    const THREE = await import('three');
    const surface = await createRenderSurface(width, height);

    const scene = new THREE.Scene();

    // --- ID TECH 3 VERTICAL COORDINATE CONVENTION ---
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
    camera.up.set(0, 0, 1); // Z-axis represents vertical displacement

    const renderer = new THREE.WebGLRenderer({
        canvas: surface,
        antialias: true,
        context: !isNode ? undefined : surface.getContext('webgl') // Inject native headless-gl hook for Node
    });
    renderer.setSize(width, height, false);

    // Build layout array metrics
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertexBuffer, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    scene.add(new THREE.DirectionalLight(0xffffff, 0.8).position.set(1, 1, 2));
    scene.add(new THREE.AmbientLight(0x444444));

    // Framing calculations via bounding boxes
    const center = new THREE.Vector3(
        (bounds.min[0] + bounds.max[0]) / 2,
        (bounds.min[1] + bounds.max[1]) / 2,
        (bounds.min[2] + bounds.max[2]) / 2
    );

    camera.position.set(
        center.x + (bounds.max[0] - bounds.min[0]) * 1.2,
        center.y + (bounds.max[1] - bounds.min[1]) * 1.2,
        center.z + (bounds.max[2] - bounds.min[2]) * 1.5
    );
    camera.lookAt(center);

    // Render frame
    renderer.render(scene, camera);

    // --- STREAM EXTRACTION INTERFACE ---
    if (!isNode) {
        // Web Worker / Browser handling
        const blob = await surface.convertToBlob({ type: 'image/png' });
        return new Uint8Array(await blob.arrayBuffer());
    } else {
        // Node CLI output optimization
        const gl = surface.getContext('webgl');
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        // Flip the raw image buffer vertically because WebGL maps textures from bottom-left corner
        const flippedPixels = new Uint8Array(width * height * 4);
        for (let y = 0; y < height; y++) {
            const srcRow = y * width * 4;
            const destRow = (height - 1 - y) * width * 4;
            flippedPixels.set(pixels.subarray(srcRow, srcRow + width * 4), destRow);
        }

        return flippedPixels; // Emits direct uncompressed RGBA pixel bytes for native saving or Vision ML ingestion
    }
}