

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


    const MANUAL_BUNDLES = {
        coi: {
            mainModule: `${globalThis.document.baseURI}components/llm-workers/objaverse/duckdb-coi.wasm`,
            mainWorker: `${globalThis.document.baseURI}components/llm-workers/objaverse/duckdb-browser-coi.worker.js`,
            pthreadWorker: `${globalThis.document.baseURI}components/llm-workers/objaverse/duckdb-browser-coi.pthread.worker.js`,
        }
    };

    // 2. Select the specific bundle target directly
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

    const worker = new Worker(bundle.mainWorker);
    const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadModule);

    conn = await db.connect();

}

/**
 * Find exact model location based on keywords parsed from LLM response
 */
async function findModelByKeywords(tagSearch) {
    // DuckDB seamlessly translates this SQL query into surgical HTTP Range requests.
    // It utilizes "Predicate Pushdown" to only fetch the bytes matching your WHERE clause.
    const query = `
        SELECT uid, sha, repo
        FROM read_parquet('${gcsParquetUrl}')
        WHERE categories LIKE ? 
           OR description LIKE ?
        LIMIT 5;
    `;

    const statement = await conn.prepare(query);
    const result = await statement.query(`%${tagSearch}%`, `%${tagSearch}%`);

    // Convert Arrow table output back to standard JS array
    return result.toArray().map(row => ({
        url: `https://github.com/${row.repo}/raw/${row.sha}/model.gltf`,
        uid: row.uid
    }));
}



self.onmessage = async (e) => {
    const { type, payload, baseURI, parquetFile } = e.data;

    if (type === 'LOAD_SEARCH') {

        globalThis.document.baseURI = baseURI
        globalThis.parquetFile = parquetFiles[0]

        try {
            if (!conn) {
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
            const matches = await findModelByKeywords("chair");
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
