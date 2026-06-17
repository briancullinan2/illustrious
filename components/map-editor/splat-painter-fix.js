// fix for scene limiting the spark js splat painter
// as i discussed with gemini, the splat painter need to be converted to a collition map, then from the collisions convert that to a BSP and the also wrap the
//  whole thing a depth of 3 type culler whre if you cant see through the gaussians anyways it drops it from the scene

// https://sparkjs.dev/examples/splat-painter/index.html
// when i saw this i immediately though of the movie "What Dreams May Come" in WebVR

// Step 1: Grab the active canvas context from the DOM


const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

if (gl) {
    // Step 2: Hijack the drawElementsInstanced method 
    // This is what Spark uses to push the sorted splats to the screen
    const originalDraw = gl.drawElementsInstanced;

    gl.drawElementsInstanced = function (mode, count, type, offset, instanceCount) {
        // If it's pushing a massive block of splat instances, forcefully choke it!
        // Cut the rendered splats down significantly to rescue your frame rate
        const clampedInstanceCount = instanceCount > 100000
            ? Math.floor(instanceCount * 0.1)  // Force render only 10% of the active points
            : instanceCount;

        return originalDraw.call(this, mode, count, type, offset, clampedInstanceCount);
    };

    console.log("Successfully hijacked WebGL context! Try painting or moving around now.");
} else {
    console.log("Could not find the WebGL2 context on this canvas.");
}



