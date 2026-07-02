
// Organized by feature/context for easy on-demand loading
const IMPORT_CSS = {
	// Always loaded up front
	core: [
		'/components/core/menu.css',
	],

	// Loaded dynamically on demand
	websfm: [
		'/components/sfm-processor/index.css',
	],

	nunu: [
		'/components/map-editor/styles.css',
		'/components/map-editor/codemirror.css',
		//'/components/map-editor/nunu.css',
	]
};

const IMPORT_JS = {
	// Application Bootstrap / UI Orchestration
	core: [
		'/components/core/cluster.js',
		'/components/core/utilities.js',
		'/components/core/settings.js',
		'/components/core/workers.js',
		'/components/core/menu.js',
		'/components/core/github.js',
		'/components/core/local.js',
		'/components/core/sys_fs.js'
	],

	// Virtual Terminal Environment
	websfm: [
		'/components/sfm-processor/index.js',
		'/components/sfm-processor/three-webgpu.js',
	],

	nunu: [
		'/components/map-editor/acorn.js',
		'/components/map-editor/tern.js',
		'/components/map-editor/codemirror.js',
		'/components/map-editor/jshint.js',
		'/components/map-editor/draco_encoder.js',
		'/components/map-editor/bundle.js',
		'/components/map-editor/addons.js',
		//'/components/map-editor/Q3BSPLoader.js',
		'/components/map-editor/SpatialLoader.js'
	]
};

