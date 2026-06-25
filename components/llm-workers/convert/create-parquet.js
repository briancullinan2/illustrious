import * as duckdb from '@duckdb/duckdb-wasm';

// Unified initialization configuration for both browser workers or headless Node environments
const MANUAL_BUNDLES = {
    mvp: {
        mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-mvp.wasm',
        mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-node-mvp.worker.cjs',
    },
    eh: {
        mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-eh.wasm',
        mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-node-eh.worker.cjs',
    },
};

let db = null;
let conn = null;

/**
 * Initializes the embedded DuckDB runtime instance
 */
export async function initDatabase() {
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();

    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    conn = await db.connect();
    await setupSchema();
}

/**
 * Declares the spatial bounding box structural table inside the memory allocator.
 * Maps coordinates where the Z-axis explicitly handles vertical up/down tracking.
 */
async function setupSchema() {
    await conn.query(`
        CREATE TABLE IF NOT EXISTS quake_rooms (
            map_name VARCHAR,
            room_id VARCHAR,
            min_x DOUBLE,
            min_y DOUBLE,
            min_z DOUBLE,
            max_x DOUBLE,
            max_y DOUBLE,
            max_z DOUBLE,
            ml_category VARCHAR,
            processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

/**
 * Appends a freshly calculated room extraction target or metadata record to the engine layer.
 * If processing a batch, call this continuously per room bounding box.
 */
export async function insertRoomMetadata(roomData) {
    if (!conn) throw new Error("Database pipeline is not initialized.");

    // Using prepared execution blocks to handle high-frequency loop processing safely
    const stmt = await conn.prepare(`
        INSERT INTO quake_rooms (map_name, room_id, min_x, min_y, min_z, max_x, max_y, max_z, ml_category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    await stmt.query([
        roomData.mapName,
        roomData.roomId,
        roomData.minX,
        roomData.minY,
        roomData.minZ, // Vertical height (id Tech 3 convention)
        roomData.maxX,
        roomData.maxY,
        roomData.maxZ,
        roomData.mlCategory || 'unclassified'
    ]);

    await stmt.close();
}

/**
 * Updates a record following Vision ML parsing pass validation.
 */
export async function updateRoomCategory(mapName, roomId, category) {
    if (!conn) throw new Error("Database pipeline is not initialized.");

    const stmt = await conn.prepare(`
        UPDATE quake_rooms 
        SET ml_category = ?, processed_at = CURRENT_TIMESTAMP
        WHERE map_name = ? AND room_id = ?;
    `);

    await stmt.query([category, mapName, roomId]);
    await stmt.close();
}

/**
 * Exports the active in-memory database pool directly out to a columnar Parquet binary file block.
 * Returns a Uint8Array containing the completed file contents ready for LocalStorage, IndexedDB, or FS saving.
 */
export async function exportToParquetFile(fileName = 'quake3_rooms.parquet') {
    if (!conn || !db) throw new Error("Database pipeline is not initialized.");

    // Copy the memory state out to DuckDB's internal virtual file system layer
    await conn.query(`COPY quake_rooms TO '${fileName}' (FORMAT PARQUET);`);

    // Extract the raw binary allocation map from the file system buffer
    const parquetBuffer = await db.copyFileToBuffer(fileName);

    // Clear out the virtual file tracker to release references inside the engine
    await db.dropFile(fileName);

    return parquetBuffer;
}

/**
 * Ingests an existing Parquet data file back into the working runtime state.
 * Allows resuming runs across long batch jobs across the 5,000 maps dataset.
 */
export async function loadExistingParquet(uint8ArrayData, fileName = 'input.parquet') {
    if (!db || !conn) throw new Error("Database pipeline is not initialized.");

    // Register the raw binary stream directly into the engine's virtual filesystem
    await db.registerFileBuffer(fileName, uint8ArrayData);

    // Clear standard memory tracking state and re-inflate via the file contents
    await conn.query(`DROP TABLE IF EXISTS quake_rooms;`);
    await conn.query(`CREATE TABLE quake_rooms AS SELECT * FROM read_parquet('${fileName}');`);

    // Free filesystem handle since the table structure is now sitting inside main memory allocation
    await db.dropFile(fileName);
}

/**
 * Drops active engine handles safely
 */
export async function closeDatabase() {
    if (conn) await conn.close();
    if (db) await db.terminate();
}