// Load the Pyodide WASM runtime initialization script via CDN
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js");

//micropip.install('package-name')

let pyodideReadyPromise = initPyodideWorker();

async function initPyodideWorker() {
  // 1. Initialize the CPython WASM instance
  const pyodide = await loadPyodide();
  
  // 2. Load any required pure Python or micropip/C-extension packages
  // (e.g., numpy, scipy, scikit-image if doing image math)
  await pyodide.loadPackage(["numpy"]); 
  
  return pyodide;
}

// Handle incoming messages from the main application thread
self.onmessage = async (event) => {
  const pyodide = await pyodideReadyPromise;
  const { code, context } = event.data;

  try {
    // Inject JS data/variables into the Python global scope safely
    self.pyodide.globals.set("js_input_data", context);

    // Run the Python library script
    const result = await pyodide.runPythonAsync(code);
    
    // Send the result back to the main thread
    self.postMessage({ success: true, result: result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};