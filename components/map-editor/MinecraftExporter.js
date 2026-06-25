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
