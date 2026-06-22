const IMPORT_SETTINGS = {
    core: {
        workspaceDefault: {
            key: 'workspace_default',
            default: 'nunu',
            description: 'Specifies the default active panel or system layout view presented to users upon launching the application interface.'
        },
        environmentRepository: {
            key: 'environment_repository',
            default: 'briancullinan2/illustrious',
            description: 'Repository for this workspace, the entire IDE, code editor and engine runner, for editing the environment inside the workspace.',
            //set: configureRepository
        },
        environmentVersion: {
            key: 'environment_version',
            default: new Date(0),
            description: 'The last commit date for the environment repository set automatically.',
        },
        savedTheme: {
            key: 'theme',
            default: 'ace/theme/monokai',
            elementId: 'theme',
            description: 'The visual theme layout package used to style the interactive Ace code editor window background and syntax colors.',
            set: setTheme
        },
    },

    websfm: {

    },

};


const SettingsManager = {
    // 1. Initial hydration loop running across local storage on boot
    hydrateAll() {
        for (const [moduleKey, settings] of Object.entries(IMPORT_SETTINGS)) {
            for (const [camelKey, config] of Object.entries(settings)) {
                config.windowName = camelKey
                let raw = localStorage.getItem(config.key);
                let finalValue = raw;

                if (raw === null) {
                    finalValue = config.default;
                } else if (config.type === 'boolean') {
                    finalValue = raw === 'true';
                } else if (config.type === 'json' || config.type === 'array') {
                    try {
                        finalValue = JSON.parse(raw);
                        if (config.type === 'array' && !(Array.isArray(finalValue))) {
                            debugger
                            finalValue = []
                        }
                    } catch (e) {
                        debugger
                        console.error(e)
                        finalValue = config.default;
                    }
                } else if (config.type === 'csv') {
                    finalValue = raw.split(';').filter(Boolean);
                }

                // Apply back downstream directly into memory/DOM elements
                this.applyValue(config, finalValue);
            }
        }
    },

    // 2. Applies the translated state to elements or core configurations
    applyValue(config, value) {

        config.currentValue = window[config.windowName] = value
        if (typeof config.set === 'function') {
            config.set(value);
        } else if (config.elementId) {
            const el = document.getElementById(config.elementId);
            if (el) {
                if (config.type === 'boolean' || el.type === 'checkbox') {
                    el.checked = !!value;
                } else if (el.tagName.toUpperCase() === 'SELECT') {
                    if (el.querySelector(`[value*="${value}"]`)) {
                        el.value = value
                    } else {
                        el.value = config.default
                    }
                }
                else {
                    el.value = value;
                }
            }
        }
    },

    exportPayload() {
        const payload = {};

        // 1. Gather all valid configs into a flat list
        const flatConfigs = [];
        for (const [moduleKey, settings] of Object.entries(IMPORT_SETTINGS)) {
            for (const [camelKey, config] of Object.entries(settings)) {
                if (config.edit === false) continue;
                flatConfigs.push(config);
            }
        }

        // 2. Alphabetize the configs up front by their payload key
        flatConfigs.sort((a, b) => a.key.localeCompare(b.key));

        // 3. Process the sorted configs to build the ordered payload
        for (const config of flatConfigs) {
            let currentVal;
            if (typeof config.get === 'function') {
                currentVal = config.get(localStorage.getItem(config.key), config.default, config);
            } else if (config.elementId) {
                const el = document.getElementById(config.elementId);
                if (el) {
                    if (config.type === 'csv' && el.nodeName === 'SELECT') {
                        currentVal = Array.from(el.children).map(c => c.value).join(';')
                    }
                    else {
                        currentVal = (config.type === 'boolean' || el.type === 'checkbox') ? el.checked : el.value;
                    }
                }
            } else {
                // Fallback reading directly from storage state
                currentVal = localStorage.getItem(config.key);
            }

            if (config.type === 'csv') {
                currentVal = currentVal.split(';')
            }
            if (config.type === 'array' || config.type === 'json') {
                try {
                    currentVal = JSON.parse(currentVal);
                } catch (e) {
                    currentVal = config.type === 'array' ? [] : {};
                }
            }
            currentVal = typeof currentVal !== 'undefined' && currentVal !== null ? currentVal : config.default;
            payload[config.key] = currentVal
        }

        return payload;
    },

    get(moduleKey, settingKey) {
        let config = IMPORT_SETTINGS[moduleKey]?.[settingKey];
        if (!config) {
            config = Object.values(IMPORT_SETTINGS[moduleKey] || {})
                .find(config => config.key === settingKey)
                || Object.values(IMPORT_SETTINGS[moduleKey] || {})
                    .find(c => settingKey instanceof Element
                        && c.elementId === settingKey.name
                        || c.elementId === settingKey)
            if (!config)
                return null;
        }


        // If it has a custom getter, use it
        //if (typeof config.get === 'function') return config.get();
        const stored = localStorage.getItem(config.key);
        if (stored) {
            if (!config.type) return stored
            if (config.type === 'boolean') return stored === 'true';
            if (config.type === 'csv') return stored.split(';').filter(Boolean);
            if (config.type === 'json' || config.type === 'array') {
                // return default because threes no form element for json?
                try {
                    let parsed = JSON.parse(stored);
                    if (config.type === 'array') {
                        return Array.isArray(parsed) ? parsed : []
                    }
                    return parsed
                } catch (e) {
                    console.error(e)
                    debugger
                    return stored || config.default;
                }
            }
        }


        // If it binds to a DOM element, read the live UI state
        if (config.elementId) {
            const el = document.getElementById(config.elementId);
            if (el) {
                return (config.type === 'boolean' || el.type === 'checkbox') ? el.checked : el.value;
            }
        }

        // Fallback to local storage state or hardcoded schema default
        return config.default
    }

};

let previousSettings = null

async function settings() {
    const database = owner.value + '/' + repository.value;
    const filePath = `settings${++tempCount}.json`;

    if (window.engineRepo?.startsWith('Quake3e')) {
        console.error('Assertion owner set to Quake3e instead of briancullinan');
        debugger;
    }

    // Generates the clean payload directly from our structured definitions
    previousSettings = SettingsManager.exportPayload();
    const settingsString = JSON.stringify(previousSettings, null, 4);
    const newSha = await getGitShaBrowser(settingsString);

    if (files[database]) {
        files[database][filePath] = {
            timestamp: new Date(),
            mode: FS_FILE,
            contents: new TextEncoder().encode(settingsString),
            path: filePath,
            sha: newSha,
            parent: filePath.substring(0, filePath.lastIndexOf('/'))
        };
    }

    const session = getOrCreateAceSession(filePath, settingsString);
    aceEditor.setSession(session);

    hideOpenPanels();
    editorContainer.classList.add('not-hidden');
    editorContainer.classList.remove('hidden');
}

function saveSettings(content) {
    try {
        let freshSettings = JSON.parse(content);

        // Run across every item inside the payload, push to storage, and apply logic dynamically
        for (const [moduleKey, settings] of Object.entries(IMPORT_SETTINGS)) {
            for (const [camelKey, config] of Object.entries(settings)) {
                if (freshSettings[config.key] !== undefined) {
                    let value = freshSettings[config.key];

                    // Sync browser storage
                    if (config.type === 'array') {
                        localStorage.setItem(config.key, JSON.stringify(value));
                    } else if (config.type === 'csv') {
                        if (typeof value === 'string')
                            localStorage.setItem(config.key, value);
                        else if (Array.isArray(value))
                            localStorage.setItem(config.key, value.join(';'));
                        else
                            localStorage.setItem(config.key, value.toString());
                    } else if (config.type === 'json' || Array.isArray(value)) {
                        if (!Array.isArray(value))
                            localStorage.setItem(config.key, JSON.stringify([value]));
                        else
                            localStorage.setItem(config.key, JSON.stringify(value));
                    } else {
                        localStorage.setItem(config.key, value);
                    }

                    // Force DOM / Runtime Engine update
                    if (value !== previousSettings[config.key].currentValue)
                        SettingsManager.applyValue(config, value);
                }
            }
        }
    } catch (e) {
        PREAMBLE = EDITOR_PREAMBLE;
        writeLog(`${e.message}\n\r${e.stack || e.stacktrace}`);
    }
}



function setTheme(theme) {
    const themeName = theme.split('/').pop(); // Gets 'monokai' or 'dracula'

    for (let cn of document.body.classList) {
        if (cn.startsWith('theme-')) {
            document.body.classList.remove(cn)
        }
    }

    document.body.classList.add(`theme-${themeName.replace(/_/g, '-')}`);
    // Actually tell Ace to change its internal theme too
    if (typeof aceEditor !== 'undefined')
        aceEditor.setTheme(theme);
    savedTheme = theme
    // wait for update on page so it can scan for colors out of css
    if (window.syncThemeWithAce)
        setTimeout(() => {
            syncThemeWithAce()
        }, 500);

}
