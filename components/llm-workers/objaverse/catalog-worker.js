


//https://extensions.duckdb.org/v1.5.4/wasm_threads/parquet.duckdb_extension.wasm

globalThis.document = {
    baseURI: 'http://localhost:4000/'
}


let putRecord, getRecord, DB_STORE_NAME, duckdb


async function initDuckDB() {
    duckdb = await import('./duckdb-browser.mjs');
}

async function initLocalStorage() {
    try {
        // Attempt to dynamically import the downloader file
        const downloaderModule = await import('../../core/local.js');

        // If it exported properties natively, unpack them
        if (downloaderModule && Object.keys(downloaderModule).length > 0) {
            ({ putRecord, getRecord, DB_STORE_NAME } = downloaderModule);
        }
        // Fallback: If it executed as a classic script and bound to the global namespace
        else if (typeof self !== 'undefined' && self) {
            ({ putRecord, getRecord, DB_STORE_NAME } = self);
        } else {
            throw new Error("Downloader script loaded, but no valid exports or global namespaces were found.");
        }
    } catch (error) {
        console.error("Failed to dynamically initialize multimodal downloader dependencies:", error);
        throw error;
    }
}

// Execute the async bootstrap chain before running your dependent logic
await initLocalStorage();


let installDatabaseIfNeeded, fetchWithFallbackChain;

let conn

async function initDownloader() {
    try {
        // Attempt to dynamically import the downloader file
        const downloaderModule = await import('../downloader.js');

        // If it exported properties natively, unpack them
        if (downloaderModule && Object.keys(downloaderModule).length > 0) {
            ({ installDatabaseIfNeeded, fetchWithFallbackChain } = downloaderModule);
        }
        // Fallback: If it executed as a classic script and bound to the global namespace
        else if (typeof self !== 'undefined' && self) {
            ({ installDatabaseIfNeeded, fetchWithFallbackChain } = self);
        } else {
            throw new Error("Downloader script loaded, but no valid exports or global namespaces were found.");
        }
    } catch (error) {
        console.error("Failed to dynamically initialize multimodal downloader dependencies:", error);
        throw error;
    }
}

// Execute the async bootstrap chain before running your dependent logic
await initDownloader();



async function initializeSearchEngine() {
    const BASE_PATH = `${globalThis.document.baseURI}components/llm-workers/objaverse/`;

    const MANUAL_BUNDLES = {
        coi: {
            mainModule: `${globalThis.document.baseURI}components/llm-workers/objaverse/duckdb-coi.wasm`,
            mainWorker: `${globalThis.document.baseURI}components/llm-workers/objaverse/duckdb-browser-coi.worker.js`,
            pthreadWorker: `${globalThis.document.baseURI}components/llm-workers/objaverse/duckdb-browser-coi.pthread.worker.js`,
        }
    };

    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

    const logger = new duckdb.ConsoleLogger();

    //const db = new duckdb.AsyncDuckDBDispatcher(logger);
    //const worker = new Worker(bundle.mainWorker);
    //const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
    //await db.instantiate(bundle.mainModule, bundle.pthreadModule);

    //conn = await db.connect();
    const worker = await duckdb.createWorker(bundle.mainWorker);
    const asyncDb = new duckdb.AsyncDuckDB(logger, worker);

    await asyncDb.instantiate(bundle.mainModule, bundle.pthreadWorker);

    conn = await asyncDb.connect();

    //debugger
    //await conn.query(`
    //    SET custom_extension_repository = '${globalThis.document.baseURI}components/llm-workers/objaverse/';
    //    PRAGMA load_parquet;
    //`);
    console.log("DuckDB initialized natively inside the existing search worker layer.");
}

async function findModelByKeywords(tagSearch) {
    // 1. Target the actual columns revealed in the dataset profile
    // We query fileIdentifier and the raw metadata string since that's where the filenames live.
    const query = `
        SELECT fileIdentifier, source, license, fileType, sha256, metadata
        FROM read_parquet('${globalThis.parquetFile}')
        WHERE fileIdentifier LIKE ? 
           OR CAST(metadata AS VARCHAR) LIKE ?
        LIMIT 20;
    `;

    const statement = await conn.prepare(query);
    // Wrap with % wildcards to enable substring matches on paths and filenames
    const result = await statement.query(`%${tagSearch}%`, `%${tagSearch}%`);
    const rows = result.toArray();

    // 2. Parse out the tabular rows into ready-to-use engine assets
    return rows.map(row => {
        const source = row.source;
        const identifier = row.fileIdentifier;
        let downloadUrl = '';

        if (source === 'github') {
            // Converts standard blob view URLs to raw user content delivery links
            const cleanPath = identifier.replace("https://github.com/", "").replace("/blob/", "/");
            downloadUrl = `https://raw.githubusercontent.com/${cleanPath}`;
        } else if (source === 'thingiverse') {
            // Thingiverse assets can be targeted directly via the file ID endpoint or the manifest reference
            downloadUrl = identifier;
        } else if (source === 'sketchfab') {
            downloadUrl = `https://api.sketchfab.com/v3/models/${identifier}/download`;
        } else {
            downloadUrl = identifier;
        }

        return {
            source: source,
            fileType: row.fileType,
            sha256: row.sha256,
            originalUrl: identifier,
            downloadUrl: downloadUrl
        };
    });
}



self.onmessage = async (e) => {
    const { type, payload, baseURI, parquetFiles } = e.data;

    if (type === 'LOAD_SEARCH') {

        globalThis.document.baseURI = baseURI
        globalThis.parquetFile = parquetFiles[0]

        try {
            if (!conn) {
                await initDuckDB()
                await initializeSearchEngine()
            }



            self.postMessage({ type: 'SEARCH_READY' });
        } catch (err) {
            console.error(err);
            self.postMessage({ type: 'ERROR', payload: { message: err.message + '\n' + (err.stack || err.stacktrace) } });
        }
    }

    if (type === 'SEARCH_QUERY') {
        try {
            if (parquetFiles) {
                globalThis.parquetFile = parquetFiles[0]
            }
            const matches = await findModelByKeywords(payload);
            console.log("Surgically pulled from 10GB GCS bucket file without downloading it entirely:", matches);

            self.postMessage({ type: 'SEARCH_RESULTS', payload: matches });
        }
        catch (err) {
            console.error(err);
            self.postMessage({ type: 'ERROR', payload: { message: err.message + '\n' + (err.stack || err.stacktrace) } });
        }
    }
}

self.postMessage({ type: 'WORKER_READY' });
