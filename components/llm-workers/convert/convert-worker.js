


async function decimateGeometry() {
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
    import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';


    // Initialize loader
    const loader = new GLTFLoader();

    // Load the asset
    loader.load(
        'path/to/model.gltf',
        function (gltf) {
            const rawModel = gltf.scene;

            // 1. Decimate the geometry before adding to the scene
            decimateModelGeometry(rawModel, 0.5); // Reduce vertex count by 50%

            // 2. Safe to insert into the scene now
            scene.add(rawModel);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened during loading:', error);
        }
    );


}


/**
 * Traverses the model and decimates any mesh geometry found.
 * @param {THREE.Object3D} model 
 * @param {number} reductionFactor - Percentage to reduce (e.g., 0.5 = 50% fewer vertices)
 */
function decimateModelGeometry(model, reductionFactor) {
    const modifier = new SimplifyModifier();

    model.traverse((child) => {
        if (child.isMesh) {
            try {
                // Ensure geometry is a BufferGeometry
                const oldGeometry = child.geometry;

                // Calculate target vertex count
                const currentVertexCount = oldGeometry.attributes.position.count;
                const targetCount = Math.floor(currentVertexCount * (1 - reductionFactor));

                // Generate simplified geometry
                const simplifiedGeometry = modifier.modify(oldGeometry, targetCount);

                // Swap the geometry out safely
                child.geometry = simplifiedGeometry;
                oldGeometry.dispose();
            } catch (error) {
                console.warn('Could not decimate mesh:', child.name, error);
            }
        }
    });
}



let offscreenCanvas;
let ctx;

// Replace this with your actual WebGPU/WebGL super-resolution library instance
// e.g., import { WebSR } from 'websr'; 
let upscalerPipeline; 

self.onmessage = async (e) => {
  const { type, canvas, bitmap } = e.data;

  if (type === 'init') {
    offscreenCanvas = canvas;
    ctx = offscreenCanvas.getContext('2d'); // Or 'webgpu' / 'webgl2'
    
    // Initialize your upscaler framework here
    // upscalerPipeline = new WebSR({ canvas: offscreenCanvas });
  }

  if (type === 'frame' && ctx) {
    // 1. Process and Upscale
    // In a pure WebGL/WebGPU setup, you bind the bitmap as a texture,
    // run the upscale shader fragment, and output to the canvas viewport.
    
    // Simple fallback fallback representation:
    ctx.drawImage(bitmap, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
    
    // Crucial: Clean up the bitmap resource immediately in the worker
    bitmap.close(); 
  }
};

