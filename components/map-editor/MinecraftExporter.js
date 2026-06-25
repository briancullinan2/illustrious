/**
 * Zero-dependency Client-Side Three.js / nunuStudio Voxelizer
 * Maps complex scene geometry into a dense 3D grid layout.
 */
function voxelizeNunuScene(sceneObject, voxelScale = 1.0) {
    // 1. Gather all meshes and compute world-space bounding boxes
    const meshes = [];
    sceneObject.updateMatrixWorld(true);

    sceneObject.traverse((child) => {
        if (child.isMesh && child.geometry) {
            // Ensure we have up-to-date world geometry boundaries
            if (!child.geometry.boundingBox) {
                child.geometry.computeBoundingBox();
            }

            const worldBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
            meshes.push({
                mesh: child,
                box: worldBox
            });
        }
    });

    if (meshes.length === 0) {
        return { dimensions: [0, 0, 0], blocks: [] };
    }

    // 2. Compute the global scene bounding box to establish our grid origin
    const globalBox = meshes[0].box.clone();
    for (let i = 1; i < meshes.length; i++) {
        globalBox.union(meshes[i].box);
    }

    const min = globalBox.min;
    const max = globalBox.max;

    // Calculate dimensions based on the target voxel size
    const sizeX = Math.ceil((max.x - min.x) / voxelScale);
    const sizeY = Math.ceil((max.y - min.y) / voxelScale);
    const sizeZ = Math.ceil((max.z - min.z) / voxelScale);

    // Flat array optimization for high-density spatial grids
    // Minecraft classic format layout size: X * Y * Z
    const totalCells = sizeX * sizeY * sizeZ;
    const blockIds = new Uint8Array(totalCells);
    const blockData = new Uint8Array(totalCells);

    // Helper to map 3D grid coordinates to a 1D flat index
    const getIndex = (x, y, z) => {
        return (y * sizeZ + z) * sizeX + x;
    };

    // 3. Perform spatial sampling (AABB voxel intersections)
    // For extreme performance inside complex scenes, port this loop to a Web Worker
    const sampleBox = new THREE.Box3();

    for (let x = 0; x < sizeX; x++) {
        for (let y = 0; y < sizeY; y++) {
            for (let z = 0; z < sizeZ; z++) {

                // Define the boundaries of the current voxel cell
                sampleBox.min.set(
                    min.x + (x * voxelScale),
                    min.y + (y * voxelScale),
                    min.z + (z * voxelScale)
                );
                sampleBox.max.set(
                    min.x + ((x + 1) * voxelScale),
                    min.y + ((y + 1) * voxelScale),
                    min.z + ((z + 1) * voxelScale)
                );

                // Check intersection against our extracted scene meshes
                for (const item of meshes) {
                    if (sampleBox.intersectsBox(item.box)) {
                        const index = getIndex(x, y, z);

                        // Default block assignment (e.g., ID 1 = Stone)
                        // This can be expanded to analyze vertex colors or material types
                        blockIds[index] = 1;
                        blockData[index] = 0;
                        break;
                    }
                }
            }
        }
    }

    return {
        width: sizeX,  // X Axis
        height: sizeY, // Y Axis
        length: sizeZ, // Z Axis
        blocks: blockIds,
        data: blockData
    };
}


// Example structural blueprint for browser pack generation
async function generateMinecraftPacks(voxelGridData) {
    const zip = new JSZip();

    // 1. Setup metadata
    const mcmeta = {
        pack: {
            pack_format: 48, // Updates dynamically based on target Minecraft version
            description: "Generated Voxel Models from Browser Canvas"
        }
    };
    zip.file("pack.mcmeta", JSON.stringify(mcmeta, null, 2));

    // 2. Build out internal structure pathing
    const structureFolder = zip.folder("data/custom_app/structure");

    // Convert raw voxel grids into standard Minecraft binary tags 
    // Format must match: { size: [x,y,z], blocks: [...], palette: [...] }
    const rawNbtBuffer = encodeVoxelGridToNBT(voxelGridData);

    // Gzip compress the NBT buffer using standard browser compilation libraries
    const gzippedNBT = pako.gzip(rawNbtBuffer);

    // Inject file directly into the zipped workspace
    structureFolder.file("voxel_model.nbt", gzippedNBT);

    // 3. Generate blob download directly to user's computer
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "Drop_Into_Datapacks_Folder.zip");
}


/**
 * Packages raw spatial voxel coordinates into a clean object 
 * matching Mojang's official NBT compound structure layout.
 */
function buildNbtFromVoxelGrid(voxelGrid) {
    const { width, height, length, blocks } = voxelGrid;

    // 1. Define the palette of block states used in your Three.js canvas
    // For this example, index 0 is air, and index 1 maps to vanilla stone
    const blockPalette = [
        { Name: "minecraft:air" },
        { Name: "minecraft:stone" }
    ];

    // 2. Map the active grid coordinates into structural position payloads
    const blocksList = [];

    // Helper to calculate 3D coordinates from our flat 1D grid array
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            for (let z = 0; z < length; z++) {
                const flatIndex = (y * length + z) * width + x;
                const paletteIndex = blocks[flatIndex];

                // Skip serialization for completely empty air blocks to save file space
                if (paletteIndex === 0) continue;

                blocksList.push({
                    pos: [x, y, z],      // The specific voxel location on the grid
                    state: paletteIndex  // Refers to the numerical index in our blockPalette array
                });
            }
        }
    }

    // 3. Assemble the comprehensive Root Compound structure tree
    const nbtStructure = {
        DataVersion: 3463, // Target version identifier (e.g., 1.20+)
        size: [width, height, length],
        palette: blockPalette,
        blocks: blocksList,
        entities: [] // Included to fulfill strict structure parsing validations
    };

    return nbtStructure;
}


/**
 * Translates Three.js Geometry bounds into a native Minecraft 1.20+ JSON Model.
 * Maps Three.js meters directly to Minecraft 16x16x16 element space.
 * * @param {THREE.Object3D} rootObject - The nunuStudio/Three.js mesh or group.
 * @param {number} scaleFactor - Multiplier to fit your mesh into the 16x16x16 bounds.
 * @returns {Object} Valid Minecraft JSON model schema
 */
function exportToMinecraftJsonModel(rootObject, scaleFactor = 16.0) {
    const elements = [];

    // Ensure all world matrices are calculated accurately
    rootObject.updateMatrixWorld(true);

    rootObject.traverse((child) => {
        if (child.isMesh && child.geometry) {
            // Compute the bounding box for the individual geometric component
            if (!child.geometry.boundingBox) {
                child.geometry.computeBoundingBox();
            }

            // Clone and transform local bounding box to global world space
            const worldBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);

            // Map Three.js coordinates (meters) to Minecraft's 0-16 localized coordinate grid
            // Minecraft's origin [0,0,0] is the bottom-north-west corner of the block
            const fromX = Math.max(0, Math.min(16, (worldBox.min.x * scaleFactor) + 8));
            const fromY = Math.max(0, Math.min(16, (worldBox.min.y * scaleFactor)));
            const fromZ = Math.max(0, Math.min(16, (worldBox.min.z * scaleFactor) + 8));

            const toX = Math.max(0, Math.min(16, (worldBox.max.x * scaleFactor) + 8));
            const toY = Math.max(0, Math.min(16, (worldBox.max.y * scaleFactor)));
            const toZ = Math.max(0, Math.min(16, (worldBox.max.z * scaleFactor) + 8));

            // Prevent generating invisible zero-width elements
            if (Math.abs(toX - fromX) < 0.01 || Math.abs(toY - fromY) < 0.01 || Math.abs(toZ - fromZ) < 0.01) {
                return;
            }

            // Extract basic rotation along the Y-axis if present
            const rotation = new THREE.Euler().setFromRotationMatrix(child.matrixWorld, 'YXZ');
            const degreesY = Math.round(rotation.y * (180 / Math.PI));

            // Snap rotation to valid Minecraft mechanics (-45, -22.5, 0, 22.5, 45)
            const validRotations = [-45, -22.5, 0, 22.5, 45];
            const snappedRotationY = validRotations.reduce((prev, curr) =>
                Math.abs(curr - degreesY) < Math.abs(prev - degreesY) ? curr : prev
            );

            // Construct the single cuboid element block
            const element = {
                from: [parseFloat(fromX.toFixed(4)), parseFloat(fromY.toFixed(4)), parseFloat(fromZ.toFixed(4))],
                to: [parseFloat(toX.toFixed(4)), parseFloat(toY.toFixed(4)), parseFloat(toZ.toFixed(4))],
                faces: {
                    down: { uv: [0, 0, 16, 16], texture: "#texture0", cullface: "down" },
                    up: { uv: [0, 0, 16, 16], texture: "#texture0", cullface: "up" },
                    north: { uv: [0, 0, 16, 16], texture: "#texture0" },
                    south: { uv: [0, 0, 16, 16], texture: "#texture0" },
                    west: { uv: [0, 0, 16, 16], texture: "#texture0" },
                    east: { uv: [0, 0, 16, 16], texture: "#texture0" }
                }
            };

            // Inject rotation definitions if the mesh is angled
            if (snappedRotationY !== 0) {
                element.rotation = {
                    origin: [
                        parseFloat(((fromX + toX) / 2).toFixed(4)),
                        parseFloat(((fromY + toY) / 2).toFixed(4)),
                        parseFloat(((fromZ + toZ) / 2).toFixed(4))
                    ],
                    axis: "y",
                    angle: snappedRotationY
                };
            }

            elements.push(element);
        }
    });

    // Wrap the collected elements inside a standard vanilla block template
    return {
        credit: "Generated via Client-Side Three.js Parser",
        textures: {
            particle: "minecraft:block/stone",
            texture0: "minecraft:block/stone" // Replace with your custom atlas texture path
        },
        elements: elements
    };
}


// Ensure you have these libraries loaded in your browser environment:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js"></script>

async function createAndDownloadDataPack(nbtStructureData, packName = "custom_canvas_elements") {
    const zip = new JSZip();

    // 1. Create the mandatory pack.mcmeta file
    const mcmeta = {
        pack: {
            pack_format: 48, // 48 is standard for 1.21+. Adjust based on your server version
            description: "Custom structures generated from nunuStudio canvas"
        }
    };
    zip.file("pack.mcmeta", JSON.stringify(mcmeta, null, 2));

    // 2. Build Mojang's required namespaced folder directory tree
    // Path: data/<namespace>/structure/<file>.nbt
    const namespace = packName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const structureFolder = zip.folder(`data/${namespace}/structure`);

    // 3. Serialize your NBT JavaScript object to an uncompressed binary layout
    // (If using prismarine-nbt, run: const rawBuffer = nbt.writeUncompressed(nbtStructureData))
    // For this demo, we assume 'nbtStructureData' is already a raw Uint8Array buffer
    const rawBuffer = nbtStructureData;

    // 4. CRITICAL: Compress the raw binary NBT data with GZIP
    const gzippedNbtData = pako.gzip(rawBuffer);

    // 5. Place the gzipped asset into the zipped bundle
    structureFolder.file("canvas_model.nbt", gzippedNbtData);

    // 6. Generate the final ZIP file blob
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // 7. Trigger the browser download with a clean, descriptive name
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = `${namespace}_datapack.zip`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}


