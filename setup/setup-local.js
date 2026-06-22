
const servicePresets = [
    {
        isDefault: true,
        isPrevious: false,
        name: "Ollama (Local /generate)",
        url: "http://localhost:11434/api/generate",
        defaultModel: "qwen3.5:cloud",
        apiKey: "",
        responsePath: "response",
        parameters: [
            { key: "model", value: "{Model}", type: "string" },
            { key: "prompt", value: "{Message}", type: "string" },
            { key: "stream", boolValue: true, type: "boolean" }
        ]
    },
    {
        isDefault: false,
        isPrevious: false,
        name: "OpenAI (v1/chat)",
        url: "https://api.openai.com/v1/chat/completions",
        defaultModel: "gpt-4o",
        apiKey: "sk-...",
        responsePath: "choices[0].message.content",
        parameters: [
            { key: "model", value: "{Model}", type: "string" },
            { key: "messages", value: '[{"role": "user", "content": "{Message}"}]', type: "string" },
            { key: "temperature", value: "0.8", type: "number" },
            { key: "max_tokens", value: "500", type: "number" },
            { key: "top_p", value: "1", type: "number" },
            { key: "presence_penalty", value: "0", type: "number" },
            { key: "stream", boolValue: true, type: "boolean" }
        ]
    },
    {
        isDefault: false,
        isPrevious: false,
        name: "Groq (Cloud)",
        url: "https://api.groq.com/openai/v1/chat/completions",
        defaultModel: "llama-3.3-70b-versatile",
        apiKey: "gsk_...",
        responsePath: "choices[0].message.content",
        parameters: [
            { key: "model", value: "{Model}", type: "string" },
            { key: "messages", value: '[{"role": "user", "content": "{Message}"}]', type: "string" },
            { key: "temperature", value: "0.5", type: "number" }
        ]
    },
    {
        isDefault: false,
        isPrevious: false,
        name: "Anthropic (Claude)",
        url: "https://api.anthropic.com/v1/messages",
        defaultModel: "claude-3-5-sonnet-20240620",
        apiKey: "sk-ant-api03-...",
        responsePath: "content[0].text",
        parameters: [
            { key: "model", value: "{Model}", type: "string" },
            { key: "max_tokens", value: "1024", type: "number" },
            { key: "messages", value: '[{"role": "user", "content": "{Message}"}]', type: "string" }
        ]
    },
    {
        isDefault: false,
        isPrevious: false,
        name: "DeepSeek",
        url: "https://api.deepseek.com/chat/completions",
        defaultModel: "deepseek-chat",
        apiKey: "sk-...",
        responsePath: "choices[0].message.content",
        parameters: [
            { key: "model", value: "{Model}", type: "string" },
            { key: "messages", value: '[{"role": "user", "content": "{Message}"}]', type: "string" }
        ]
    },
    {
        isDefault: false,
        isPrevious: false,
        name: "OpenRouter (Universal)",
        url: "https://openrouter.ai/api/v1/chat/completions",
        defaultModel: "google/gemini-2.0-flash-001",
        apiKey: "sk-or-v1-...",
        responsePath: "choices[0].message.content",
        parameters: [
            { key: "model", value: "{Model}", type: "string" },
            { key: "messages", value: '[{"role": "user", "content": "{Message}"}]', type: "string" }
        ]
    },
    {
        isDefault: false,
        isPrevious: false,
        name: "Mistral AI",
        url: "https://api.mistral.ai/v1/chat/completions",
        defaultModel: "mistral-tiny",
        apiKey: "",
        responsePath: "choices[0].message.content",
        parameters: [
            { key: "model", value: "{Model}", type: "string" },
            { key: "messages", value: '[{"role": "user", "content": "{Message}"}]', type: "string" },
            { key: "safe_prompt", boolValue: true, type: "boolean" }
        ]
    },
    {
        isDefault: false,
        isPrevious: false,
        name: "LLM Studio (OpenAI Format)",
        url: "http://localhost:1234/v1/chat/completions",
        defaultModel: "local-model",
        apiKey: "",
        responsePath: "choices[0].message.content",
        parameters: [
            { key: "model", value: "{Model}", type: "string" },
            { key: "messages", value: '[{"role": "user", "content": "{Message}"}]', type: "string" },
            { key: "temperature", value: "0.8", type: "number" }
        ]
    },
    {
        isDefault: false,
        isPrevious: false,
        name: "Google AI Studio (Gemini Text)",
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        defaultModel: "gemini-2.5-flash",
        apiKey: "",
        responsePath: "candidates[0].content.parts[0].text",
        parameters: [
            { key: "contents", value: '[{"parts":[{"text":"{Message}"}]}]', type: "string" }
        ]
    },
    {
        isDefault: false,
        isPrevious: false,
        name: "Google AI Studio (Gemini Image)",
        url: "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages",
        defaultModel: "imagen-3.0-generate-002",
        apiKey: "",
        responsePath: "generatedImages[0].image.imageBytes", // Returns base64 encoded image string data
        parameters: [
            { key: "prompt", value: "{Message}", type: "string" },
            { key: "numberOfImages", value: "1", type: "number" },
            { key: "aspectRatio", value: "1:1", type: "string" }
        ]
    },
    {
        isDefault: false,
        isPrevious: false,
        name: "Cerebras (Ultra High-Speed)",
        url: "https://api.cerebras.ai/v1/chat/completions",
        defaultModel: "llama3.1-8b",
        apiKey: "",
        responsePath: "choices[0].message.content",
        parameters: [
            { key: "model", value: "{Model}", type: "string" },
            { key: "messages", value: '[{"role": "user", "content": "{Message}"}]', type: "string" },
            { key: "stream", boolValue: true, type: "boolean" }
        ]
    },
    {
        isDefault: false,
        isPrevious: false,
        name: "Together AI (Serverless Models)",
        url: "https://api.together.xyz/v1/chat/completions",
        defaultModel: "meta-llama/Llama-3-70b-chat-hf",
        apiKey: "",
        responsePath: "choices[0].message.content",
        parameters: [
            { key: "model", value: "{Model}", type: "string" },
            { key: "messages", value: '[{"role": "user", "content": "{Message}"}]', type: "string" },
            { key: "temperature", value: "0.7", type: "number" }
        ]
    },
    {
        isDefault: false,
        isPrevious: false,
        name: "Cohere (Command Engine)",
        url: "https://api.cohere.com/v2/chat",
        defaultModel: "command-r-plus",
        apiKey: "",
        responsePath: "message.content[0].text",
        parameters: [
            { key: "model", value: "{Model}", type: "string" },
            { key: "messages", value: '[{"role": "user", "content": "{Message}"}]', type: "string" }
        ]
    }
];



// Mock service matching Blazor's IChatService behavior
const ChatService = {
    async IsWorking() {
        return true;
    },
    async ListPresets() {
        return servicePresets;
    },
    async TryChat(payload) {
        try {
            const bodyData = {};
            payload.parameters.forEach(p => {
                if (p.key) {
                    bodyData[p.key] = p.type === 'boolean' ? p.boolValue : (p.type === 'number' ? Number(p.value) : p.value);
                }
            });

            const response = await fetch(payload.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(payload.apiKey ? { "Authorization": `Bearer ${payload.apiKey}` } : {})
                },
                body: JSON.stringify({
                    model: payload.defaultModel,
                    ...bodyData
                })
            });

            const data = await response.json();
            return [true, JSON.stringify(data, null, 2)];
        } catch (error) {
            return [false, `Error: ${error.message}`];
        }
    }
};

// Application State Management
let services = [];
let parameters = [{ key: "", type: "string", value: "", boolValue: false }];

// DOM Elements
const selectedPresetSelect = document.getElementById("selectedPreset");
const serviceUrlInput = document.getElementById("serviceUrl");
const modelNameInput = document.getElementById("modelName");
const apiKeyInput = document.getElementById("apiKey");
const responsePathInput = document.getElementById("responsePath");
const paramTableBody = document.querySelector("#paramTable tbody");
const addParamBtn = document.getElementById("addParamBtn");
const sendRequestBtn = document.getElementById("sendRequestBtn");
const responseJsonPre = document.getElementById("responseJson");

// Initialize application lifecycle
document.addEventListener("DOMContentLoaded", () => {
    initLifecycle();
    setupEventListeners();
});

function setupEventListeners() {
    selectedPresetSelect.addEventListener("change", (e) => handlePresetChange(e.target.value));
    addParamBtn.addEventListener("click", addParameterRow);
    sendRequestBtn.addEventListener("click", executePost);
}

async function initLifecycle() {
    await ChatService.IsWorking();
    services = await ChatService.ListPresets();

    populatePresetsDropdown();

    const defaultPreset = services.find(s => s.isDefault) || services.find(s => s.isPrevious);
    if (defaultPreset) {
        selectedPresetSelect.value = defaultPreset.name;
        applyPreset(defaultPreset.name);
    } else {
        renderParameterRows();
    }
}

function populatePresetsDropdown() {
    services.forEach(preset => {
        const option = document.createElement("option");
        option.value = preset.name;
        option.textContent = preset.name;
        selectedPresetSelect.appendChild(option);
    });
}

function handlePresetChange(value) {
    applyPreset(value);
}

function applyPreset(value) {
    const preset = services.find(p => p.name === value);
    if (preset) {
        serviceUrlInput.value = preset.url;
        modelNameInput.value = preset.defaultModel;
        responsePathInput.value = preset.responsePath || "";
        apiKeyInput.value = preset.apiKey || "";

        if (preset.apiKey) {
            apiKeyInput.placeholder = `Api Key (${preset.apiKey})`;
        } else {
            apiKeyInput.placeholder = "Api Key";
        }

        // Deep clone parameter array safely
        parameters = JSON.parse(JSON.stringify(preset.parameters || []));
        if (parameters.length === 0) {
            parameters.push({ key: "", type: "string", value: "", boolValue: false });
        }
    }
    renderParameterRows();
}

function addParameterRow() {
    parameters.push({ key: "", type: "string", value: "", boolValue: false });
    renderParameterRows();
}

function removeParameterRow(index) {
    if (parameters.length > 1) {
        parameters.splice(index, 1);
        renderParameterRows();
    }
}

function renderParameterRows() {
    paramTableBody.innerHTML = "";

    parameters.forEach((param, index) => {
        const tr = document.createElement("tr");

        // Key Input Column
        const tdKey = document.createElement("td");
        const inputKey = document.createElement("input");
        inputKey.type = "text";
        inputKey.className = "form-control";
        inputKey.value = param.key;
        inputKey.addEventListener("input", (e) => { param.key = e.target.value; });
        tdKey.appendChild(inputKey);

        // Type Dropdown Column
        const tdType = document.createElement("td");
        const selectType = document.createElement("select");
        selectType.className = "form-control";
        ["string", "number", "boolean"].forEach(t => {
            const opt = document.createElement("option");
            opt.value = t;
            opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
            if (param.type === t) opt.selected = true;
            selectType.appendChild(opt);
        });
        selectType.addEventListener("change", (e) => {
            param.type = e.target.value;
            renderParameterRows(); // Re-render to handle changing structural UI inputs dynamically
        });
        tdType.appendChild(selectType);

        // Value Input Column
        const tdValue = document.createElement("td");
        if (param.type === "boolean") {
            const inputBool = document.createElement("input");
            inputBool.type = "checkbox";
            inputBool.checked = !!param.boolValue;
            inputBool.addEventListener("change", (e) => { param.boolValue = e.target.checked; });
            tdValue.appendChild(inputBool);
        } else {
            const inputValue = document.createElement("input");
            inputValue.type = "text";
            inputValue.className = "form-control";
            inputValue.value = param.value || "";
            inputValue.addEventListener("input", (e) => { param.value = e.target.value; });
            tdValue.appendChild(inputValue);
        }

        // Action Column
        const tdAction = document.createElement("td");
        if (parameters.length > 1) {
            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "btn-danger bx bx-trash";
            deleteBtn.textContent = "";
            deleteBtn.addEventListener("click", () => removeParameterRow(index));
            tdAction.appendChild(deleteBtn);
        }

        tr.appendChild(tdKey);
        tr.appendChild(tdType);
        tr.appendChild(tdValue);
        tr.appendChild(tdAction);
        paramTableBody.appendChild(tr);
    });
}

async function executePost() {
    responseJsonPre.textContent = "Sending execution context request...";

    const payload = {
        url: serviceUrlInput.value,
        defaultModel: modelNameInput.value,
        apiKey: apiKeyInput.value,
        responsePath: responsePathInput.value,
        parameters: parameters
    };

    const result = await ChatService.TryChat(payload);
    if (result) {
        responseJsonPre.textContent = result[1] || "No response...";
    } else {
        responseJsonPre.textContent = "No response...";
    }
}

