class CanvasBackgroundRemover {
  /**
   * Cleans background textures using a non-recursive canvas flood pass.
   * @param {HTMLCanvasElement} canvas - Target canvas hosting the loaded bitmap.
   * @param {number} tolerance - Color difference cutoff (0 to 255).
   */
  static stripBackground(canvas, tolerance = 32) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Grab the linear Uint8ClampedArray [R, G, B, A, R, G, B, A...]
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // A 1-byte matrix tracking visited coordinates to prevent loop backtracking
    const visited = new Uint8Array(width * height);
    
    // Sample the 4 absolute outer corners to determine baseline background color
    const seedPositions = [
      0,                                 // Top Left
      (width - 1) * 4,                   // Top Right
      (height - 1) * width * 4,          // Bottom Left
      ((height - 1) * width + (width - 1)) * 4 // Bottom Right
    ];

    let targetR = 0, targetG = 0, targetB = 0;
    seedPositions.forEach(idx => {
      targetR += data[idx];
      targetG += data[idx + 1];
      targetB += data[idx + 2];
    });
    // Establish the median baseline color value for the carpet fields
    targetR = Math.round(targetR / 4);
    targetG = Math.round(targetG / 4);
    targetB = Math.round(targetB / 4);

    // Initial queue for coordinate tracking (avoids call stack recursion limits)
    const queue = [];

    // Push initial boundary perimeter rows/cols into the seed array
    for (let x = 0; x < width; x++) {
      queue.push(x, 0);
      queue.push(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      queue.push(0, y);
      queue.push(width - 1, y);
    }

    // Fast linear loop execution block
    while (queue.length > 0) {
      const currY = queue.pop();
      const currX = queue.pop();

      const pixelPos = currY * width + currX;
      if (visited[pixelPos]) continue;
      visited[pixelPos] = 1;

      const dataIdx = pixelPos * 4;
      const r = data[dataIdx];
      const g = data[dataIdx + 1];
      const b = data[dataIdx + 2];

      // Calculate Euclidean distance metric between background profile and active pixel
      const colorDiff = Math.sqrt(
        (r - targetR) ** 2 + 
        (g - targetG) ** 2 + 
        (b - targetB) ** 2
      );

      if (colorDiff <= tolerance) {
        // Drop alpha channel value to zero (Full Transparency)
        data[dataIdx + 3] = 0;

        // Queue adjacent 4-way step neighbors
        if (currX > 0) queue.push(currX - 1, currY);
        if (currX < width - 1) queue.push(currX + 1, currY);
        if (currY > 0) queue.push(currX, currY - 1);
        if (currY < height - 1) queue.push(currX, currY + 1);
      }
    }

    // Flush modified pixel buffers directly back to canvas viewport context
    ctx.putImageData(imgData, 0, 0);
    console.log('[Remover] Traditional flood pass complete.');
  }
}


const canvas = document.createElement('canvas');
canvas.width = imgElement.naturalWidth;
canvas.height = imgElement.naturalHeight;

const ctx = canvas.getContext('2d');
ctx.drawImage(imgElement, 0, 0);

// Run the traditional pixel isolation loop
// Adjust tolerance up (e.g., 45) if the carpet pile pattern has high contrast shadows
CanvasBackgroundRemover.stripBackground(canvas, 35);

// The canvas now contains only the banana floating on a transparent frame.
// Pass this canvas directly into your WebGPU feature extractor.


