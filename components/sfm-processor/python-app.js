// 1. Spin up the background worker thread
const pythonWorker = new Worker("python.worker.js");

// 2. Define the Python code string utilizing your loaded libraries
const pythonCode = `
import numpy as np

# js_input_data was injected into globals by the worker wrapper
data_array = np.array(js_input_data)
squared = np.square(data_array)

# The last statement evaluated is automatically returned to JS
squared.tolist()
`;

// 3. Listen for the processed calculations
pythonWorker.onmessage = (event) => {
  const { success, result, error } = event.data;
  if (success) {
    console.log("Calculated completely in background via Python:", result);
    // e.g., update your 3D canvas objects here without frame drops
  } else {
    console.error("Python Execution Error:", error);
  }
};

// 4. Fire off the execution payload
pythonWorker.postMessage({
  code: pythonCode,
  context: [1, 2, 3, 4, 5] // The raw data payload
});