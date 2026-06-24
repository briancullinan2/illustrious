

const IMPORT_MODULES = {
    core: {
        css: IMPORT_CSS['core'],
        js: IMPORT_JS['core'],
        onLoad: onLoadCore
    },

    websfm: {
        panelId: 'app',
        css: IMPORT_CSS['websfm'],
        js: IMPORT_JS['websfm'],
        module: true
    },


    nunu: {
        panelId: 'nunu',
        js: IMPORT_JS['nunu'],
        css: IMPORT_CSS['nunu'],
        onLoad: () => {
            if (!document.querySelector('#nunu input[placeholder="Search"]')) {
                window.nunu.initialize()
                let loadDetectorInterval

                loadDetectorInterval = setInterval(() => {
                    const searchBox = document.querySelector('#nunu input[placeholder="Search"]')
                    if (searchBox) {
                        clearInterval(loadDetectorInterval)
                        searchBox.addEventListener('keypress', doNunuSearch)
                    }
                }, 1000)
            }
        }
    },


};



async function onLoadCore() {

}



document.addEventListener('DOMContentLoaded', async () => {
    try {
        await DependencyLoader.loadModule('core');

        SettingsManager.hydrateAll();

        await initializeFrontend()
        await manageServiceWorker()

        //const currentTheme = IMPORT_SETTINGS.editor.savedTheme.get
        //    ? IMPORT_SETTINGS.editor.theme.get()
        //    : (document.getElementById(IMPORT_SETTINGS.editor.savedTheme.elementId)?.value 
        //    || IMPORT_SETTINGS.editor.savedTheme.default);

        // 3. Mount workspace split layout panel preference
        const userWorkspaceChoice = SettingsManager.get('core', 'workspaceDefault');

        await DependencyLoader.loadModule(userWorkspaceChoice);
        //await DependencyLoader.loadModule('nunu');
        //await DependencyLoader.loadModule('websfm');

    } catch (error) {
        debugger
        console.error('Fatal Application Bootstrap Interruption:', error);
    }
});



window.addEventListener('beforeunload', async (event) => {
    let blockingModuleKey = null;
    let workIsUnsaved = false;

    // Scan every defined module inside the runtime to see if it claims unwritten states
    for (const [key, module] of Object.entries(IMPORT_MODULES)) {
        if (typeof module.hasChanges === 'function') {
            if (module.hasChanges()) {
                workIsUnsaved = true;
                blockingModuleKey = key;
                break; // Stop scanning on first conflict
            }
        }
    }

    if (workIsUnsaved) {
        // Gracefully route back to the panel that holds the un-saved work so the dev can see it
        const moduleConfig = IMPORT_MODULES[blockingModuleKey];
        if (moduleConfig && moduleConfig.panelId) {
            renderToolbarCommand(moduleConfig.panelId, true);
        }

        // Execute standard cleanup instructions if any were defined
        if (typeof IMPORT_MODULES[blockingModuleKey].onUnload === 'function') {
            IMPORT_MODULES[blockingModuleKey].onUnload();
        }

        // Trigger standard browser navigation confirmation overlay
        event.preventDefault();
        event.returnValue = '';
        return '';
    }
});
