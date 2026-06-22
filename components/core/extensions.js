
// Organized by feature/context for easy on-demand loading
const IMPORT_CSS = {
    // Always loaded up front
    core: [

    ],

    // Loaded dynamically on demand
    websfm: [
        '/components/sfm-processor/index.css',
    ],


};

const IMPORT_JS = {
    // Application Bootstrap / UI Orchestration
    core: [
        '/components/core/settings.js',
        '/components/core/github.js',
        '/components/core/local.js',
        '/components/core/sys_fs.js'
    ],

    // Virtual Terminal Environment
    websfm: [
        '/components/sfm-processor/index.js',
        '/components/sfm-processor/three-webgpu.js',
    ],

};

