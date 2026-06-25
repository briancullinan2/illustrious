
(function () {

    const hasWindow = (typeof window !== 'undefined');
    const isWorker = !hasWindow
        && (typeof self !== 'undefined')
        && (typeof importScripts === 'function');



    let THREE = (hasWindow && window.THREE) ? window.THREE : (typeof require !== 'undefined' ? require('three') : null);
    if (!THREE) {
        console.error("Q3BSPLoader: 'THREE' global object not found. Ensure Three.js is loaded first.");
        return;
    }


    // Inside a Script component's update function
    function updateSelection(delta) {
        // Check if the user clicked the mouse left button
        if (Mouse.buttonJustPressed(Mouse.LEFT)) {
            // Get normalized mouse coordinates (-1 to 1)
            var raycaster = new THREE.Raycaster();

            // nunuStudio injects the default camera and mouse position directly
            raycaster.setFromCamera(Mouse.position, scene.activeCamera);

            // Intersect against all children in the scene graph
            var intersects = raycaster.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
                // Found the clicked object!
                var selectedObject = intersects[0].object;
                console.log("Selected Object:", selectedObject.name);

                // Trigger your swap or material change logic here
                changeMaterial(selectedObject);
            }
        }
    }

    function changeMaterial(targetMesh) {
        // Ensure we are dealing with an object that has geometry/materials
        if (targetMesh.material) {
            // Option A: Build a native Three.js material programmatically
            var newMaterial = new THREE.MeshStandardMaterial({
                color: 0xff0000, // Red
                roughness: 0.2,
                metalness: 0.8
            });

            // Apply the material swap
            targetMesh.material = newMaterial;

            // Inform the WebGL renderer that the material needs a compilation pass
            targetMesh.material.needsUpdate = true;
        }
    }



    THREE.updateSelection = updateSelection
    THREE.changeMaterial = changeMaterial



    //import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/jsm/loaders/GLTFLoader.js';

    function replaceObject(oldObject, newModelUrl) {
        var parent = oldObject.parent;
        if (!parent) return;

        // 1. Capture the exact transform vectors of the old object
        var position = oldObject.position.clone();
        var rotation = oldObject.rotation.clone();
        var scale = oldObject.scale.clone();

        // 2. Load the replacement model asset over the network
        var loader = new THREE.GLTFLoader();
        loader.load(newModelUrl, function (gltf) {
            var newModel = gltf.scene;

            // Apply the old transform parameters to the new asset layout
            newModel.position.copy(position);
            newModel.rotation.copy(rotation);
            newModel.scale.copy(scale);
            newModel.name = "replaced_asset_" + Date.now();

            // 3. Thread-safe execution swap within the scene tree graph
            parent.add(newModel);
            parent.remove(oldObject);

            // 4. Garbage collection optimization
            if (oldObject.geometry) oldObject.geometry.dispose();
            if (oldObject.material) {
                if (Array.isArray(oldObject.material)) {
                    oldObject.material.forEach(mat => mat.dispose());
                } else {
                    oldObject.material.dispose();
                }
            }

            console.log("Successfully swapped target nodes in layout engine.");
        });
    }


    THREE.changeMaterial = replaceObject

    // =========================================================================
    // NUNUSTUDIO CLASS RESOLUTION
    // -------------------------------------------------------------------------
    // nunuStudio (bundle.js) ships its own bundled copy of three.js that is a
    // *different* module instance than the one require('three') returns here.
    // Objects built with require('three') therefore fail the editor's
    // `instanceof` checks, so the selection helper (yellow BoxHelper) is never
    // created and the Inspector cannot resolve a panel for them.
    //
    // To integrate, geometry/material/texture/mesh must be built from the
    // editor's copy. We harvest those constructors from the live editor: the
    // default resources (defaultGeometry/Material/Texture) and an existing
    // scene object give us the exact classes the editor uses. Plain numeric
    // constants (wrap modes, sides, formats) are identical across copies, so
    // the local THREE values are reused for those.
    // =========================================================================
    function resolveNunuClasses() {
        const classes = {
            Mesh: THREE.Mesh,
            Object3D: THREE.Object3D,
            BufferGeometry: THREE.BufferGeometry,
            Float32BufferAttribute: THREE.Float32BufferAttribute,
            Material: THREE.MeshStandardMaterial,
            Texture: THREE.Texture
        };

        const K = (typeof window !== "undefined") ? window.nunu : null;
        if (!K) return classes;

        if (K.defaultGeometry) {
            classes.BufferGeometry = K.defaultGeometry.constructor;
            const posAttr = K.defaultGeometry.attributes && K.defaultGeometry.attributes.position;
            if (posAttr) classes.Float32BufferAttribute = posAttr.constructor;
        }
        if (K.defaultMaterial) classes.Material = K.defaultMaterial.constructor;
        if (K.defaultTexture) classes.Texture = K.defaultTexture.constructor;

        // Harvest the editor's Mesh wrapper from an existing scene object.
        let scene = null;
        try { scene = K.getScene ? K.getScene() : null; } catch (e) { scene = null; }
        const root = K.program || scene;
        if (root && typeof root.traverse === "function") {
            let mesh = null;
            root.traverse(function (o) { if (!mesh && o.isMesh) mesh = o.constructor; });
            if (mesh) classes.Mesh = mesh;
        }

        // Resolve the editor's Object3D by walking a live instance's prototype
        // chain to the level that owns `isObject3D`.
        const anchor = scene || root;
        if (anchor) {
            let proto = Object.getPrototypeOf(anchor);
            while (proto && !Object.prototype.hasOwnProperty.call(proto, "isObject3D")) {
                proto = Object.getPrototypeOf(proto);
            }
            if (proto && proto.constructor) classes.Object3D = proto.constructor;
        }

        return classes;
    }

    THREE.resolveNunuClasses = resolveNunuClasses;




    async function populateSelectedPanelsWithTextures(base64ImageArray) {
        const THREE = require('three');
        const nunuClasses = THREE.resolveNunuClasses();

        // 1. Harvest Nunu's active multi-select array from the interface tree tracker
        // Nunu typically tracks highlighted objects in an array named 'selectedObjects' or via its selection state
        const selectedObjects = window.nunu.gui.panel.treeView.selectedObjects
            || window.nunu.selectedObjects
            || [];

        // Filter the selection to ensure we are only manipulating visible mesh configurations
        const targetPanels = selectedObjects.filter(obj => obj.isMesh);

        if (targetPanels.length === 0) {
            console.warn("No active mesh panels are highlighted in the Project Explorer. Multi-select your dome panels first!");
            return;
        }

        console.log(`Processing image textures onto ${targetPanels.length} selected Nunu panels...`);

        // 2. Iterate through the selections (up to 16 or the limit of the returned image array)
        const iterationLimit = Math.min(targetPanels.length, base64ImageArray.length);

        for (let i = 0; i < iterationLimit; i++) {
            const currentPanel = targetPanels[i];
            const rawBase64 = base64ImageArray[i];

            // 3. Construct a standard HTML image payload frame to feed into the Texture Loader
            const img = new Image();
            img.src = rawBase64.startsWith('data:') ? rawBase64 : `data:image/jpeg;base64,${rawBase64}`;

            // Instantiate using the reflection-harvested Texture constructor context
            const texture = new nunuClasses.Texture(img);
            texture.needsUpdate = true; // Tell the GPU pipeline to upload the fresh image pixel stream

            // 4. Create an independent texture material instance matching the BSP style signature
            const panelMaterial = new nunuClasses.Material({
                name: `${currentPanel.name}_AI_Texture`,
                side: THREE.DoubleSide,
                map: texture,
                transparent: false,
                roughness: 0.6,
                metalness: 0.1
            });

            // 5. Swap the asset structure on the live panel mesh object
            currentPanel.material = panelMaterial;
        }

        // Force the editor viewport matrix and properties trees to synchronize
        window.nunu.gui.updateInterface();
        console.log("Successfully projected the 16-frame grid layout matrix onto highlighted panel selections.");
    }



    async function generateCameraDome(gridSize = 4) {
        const nunuClasses = THREE.resolveNunuClasses(); // Harvest original wrappers safely
        const activeScene = window.nunu.getScene();

        let camera = activeScene.defaultCamera;
        activeScene.traverse(function (child) {
            if (child.isCamera && !camera) {
                camera = child;
            }
        });

        if (!camera) {
            console.error("Could not find an active camera view.");
            return;
        }

        const domeGroup = new THREE.Group();
        domeGroup.name = `GeodesicDome_${gridSize}x${gridSize}`;
        window.nunu.addObject(domeGroup, activeScene);

        const radius = 15;
        const hFov = (60 * Math.PI) / 180;
        const vFov = (45 * Math.PI) / 180;

        // --- Airtight Spherical Projection Fix ---
        // Instead of raw squashed lat/lon coordinates, map using an un-warped equidistant cylindrical model
        const mapToSphere = (vPct, hPct) => {
            const lon = hPct * hFov;
            const lat = vPct * vFov;

            const x = radius * Math.sin(lon) * Math.cos(lat);
            const y = radius * Math.sin(lat);
            const z = -radius * Math.cos(lon) * Math.cos(lat);
            return new THREE.Vector3(x, y, z);
        };

        // 1. Generate the vertex grid context
        const vertexGrid = [];
        for (let r = 0; r <= gridSize; r++) {
            vertexGrid[r] = [];
            const vPct = (r / gridSize) - 0.5;
            for (let c = 0; c <= gridSize; c++) {
                const hPct = (c / gridSize) - 0.5;
                vertexGrid[r][c] = mapToSphere(vPct, hPct);
            }
        }

        // 2. Build the independent watertight panel items
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const pBotLeft = vertexGrid[row][col];
                const pBotRight = vertexGrid[row][col + 1];
                const pTopLeft = vertexGrid[row + 1][col];
                const pTopRight = vertexGrid[row + 1][col + 1];

                // Calculate precise shared geometric center point
                const center = new THREE.Vector3()
                    .addVectors(pTopLeft, pTopRight)
                    .add(pBotLeft)
                    .add(pBotRight)
                    .multiplyScalar(0.25);

                // Subtract center coordinates to build local offset arrays
                const localTL = pTopLeft.clone().sub(center);
                const localTR = pTopRight.clone().sub(center);
                const localBL = pBotLeft.clone().sub(center);
                const localBR = pBotRight.clone().sub(center);

                const geometry = new THREE.BufferGeometry();

                // Build the explicit triangle indices using CCW winding sequence
                const vertices = new Float32Array([
                    localBL.x, localBL.y, localBL.z,
                    localBR.x, localBR.y, localBR.z,
                    localTL.x, localTL.y, localTL.z,

                    localBR.x, localBR.y, localBR.z,
                    localTR.x, localTR.y, localTR.z,
                    localTL.x, localTL.y, localTL.z
                ]);

                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.computeVertexNormals();

                const material = new nunuClasses.Material({
                    color: 0xAEB2F8, // --ace-blue 
                    roughness: 0.5,
                    metalness: 0.1,
                    side: THREE.DoubleSide
                });

                const panelMesh = new nunuClasses.Mesh(geometry, material);
                panelMesh.name = `Panel_R${row}_C${col}`;

                // Position panel node at center transform
                panelMesh.position.copy(center);

                // ❌ REMOVED: panelMesh.lookAt(0,0,0);
                // DO NOT let independent panels compute individual lookAt vectors.
                // Leaving rotation matching the parent group naturally eliminates the twist gap!

                window.nunu.addObject(panelMesh, domeGroup);
            }
        }

        // 3. Align parent matrix precisely onto active camera tracking transform
        const camPos = new THREE.Vector3();
        const camRot = new THREE.Quaternion();
        camera.getWorldPosition(camPos);
        camera.getWorldQuaternion(camRot);

        domeGroup.position.copy(camPos);
        domeGroup.quaternion.copy(camRot);

        window.nunu.gui.updateInterface();
        console.log(`Airtight geodesic panel array compiled successfully.`);
    }


    window.generateCameraDome = window.nunu.generateCameraDome = generateCameraDome
    THREE.generateCameraDome = generateCameraDome


    function injectSfMToNunu(sfmEntity, entityName = "SfM_PointCloud_Node") {
        const nunuClasses = resolveNunuClasses();
        const activeScene = window.nunu.getScene();

        // 1. Ensure the entity carries a clean name descriptor for the Nunu Tree Hierarchy
        sfmEntity.name = entityName;

        // 2. Walk the incoming SfM entity tree to upgrade raw materials to Nunu's monitored types if needed
        sfmEntity.traverse(function (child) {
            if (child.isPoints) {
                child.name = child.name || "Points_SubCloud";
                // Keeps WebSfM's custom vertex coloring pipelines intact
                child.material.vertexColors = true;
            }
            else if (child.isMesh) {
                child.name = child.name || "Mesh_Surface";
                // If it's a solid reconstructed mesh, upgrade to Nunu's tracked material structure
                if (!(child.material instanceof nunuClasses.Material)) {
                    const oldMat = child.material;
                    child.material = new nunuClasses.Material({
                        name: "SfM_Surface_Mat",
                        color: oldMat.color,
                        map: oldMat.map,
                        side: THREE.DoubleSide
                    });
                }
            }
        });

        // 3. Register the root SfM container directly into Nunu's active runtime tree layout
        window.nunu.addObject(sfmEntity, activeScene);

        // 4. Force Nunu UI tree view and property layers to refresh immediately
        window.nunu.gui.updateInterface();

        console.log(`Successfully merged SfM structural entity [${entityName}] into Nunu workspace context.`);
    }

    // Central Engine Definition Profile Matrix
    const ENGINE_PROFILES = {
        MINECRAFT: {
            unitsPerMeter: 1.0,
            defaultGridSize: 1.0,      // 1x1 Voxel Block
            minSnapIncrement: 0.0625,  // 1/16th of a block (1 Minecraft Texture Pixel)
        },
        QUAKE_3: {
            unitsPerMeter: 26.2467,    // 8 units per foot 
            defaultGridSize: 2.4384,   // 64 Quake Units (Standard Wall Height / 8 Feet)
            minSnapIncrement: 0.3048   // 8 Quake Units (1 Foot)
        }
    };




    class SceneScaleManager {
        constructor(editorInstance) {
            this.editor = editorInstance;
            this.currentProfile = ENGINE_PROFILES.MINECRAFT;
        }

        /**
         * Changes target outputs without breaking camera vectors or physical workspace scales
         */
        switchOutputEngine(engineKey) {
            this.currentProfile = ENGINE_PROFILES[engineKey];

            // Update the visual grid lines controller natively inside nunuStudio
            const gridHelper = this.editor.getGridHelper();
            gridHelper.setSize(100);
            gridHelper.setDivisions(100 / this.currentProfile.defaultGridSize);

            // Bind the snap layouts seamlessly to the engine specifications
            this.editor.settings.grid.size = this.currentProfile.defaultGridSize;
            this.editor.settings.grid.snap = this.currentProfile.minSnapIncrement;
        }

        /**
         * Run this during file imports (e.g., parsing a Quake .map file)
         */
        importVertexPosition(nativeX, nativeY, nativeZ) {
            const scaleFactor = 1.0 / this.currentProfile.unitsPerMeter;
            return new THREE.Vector3(
                nativeX * scaleFactor,
                nativeY * scaleFactor,
                nativeZ * scaleFactor
            );
        }

        /**
         * Run this during export compilation tasks
         */
        exportVertexPosition(threeVector3) {
            const scaleFactor = this.currentProfile.unitsPerMeter;
            return {
                x: threeVector3.x * scaleFactor,
                y: threeVector3.y * scaleFactor,
                z: threeVector3.z * scaleFactor
            };
        }
    }



    async function addModelToNunuAssets(payload) {
        try {
            if (!payload.success) {
                throw new Error("Cannot asset-load a failed worker download payload.");
            }

            // 1. Fetch the binary Blob back out of IndexedDB using the store name and repo key
            const record = await getRecord(DB_STORE_NAME, payload.path, payload.db);
            if (!record || !record.contents) {
                throw new Error(`Model data not found in IndexedDB for path: ${payload.path}`);
            }

            const fileName = payload.path.split('/').pop();
            const extension = fileName.split('.').pop().toLowerCase();

            // 3. Create a raw nunuStudio Binary Resource container
            // NunuStudio organizes files in its asset manager via instances of Resource wrappers
            const resource = new window.nunu.BinaryResource(record.contents, extension);
            resource.name = decodeURIComponent(fileName);

            // 4. Register the asset strictly to the Program Manager (Assets list), NOT the Scene
            // 'editor' refers to the global nunuStudio Editor core instance
            if (typeof editor !== 'undefined' && editor.program) {

                // Add the resource container directly into the project asset registry
                editor.program.addResource(resource);

                // 5. Force the Editor GUI Asset panel UI to redraw and show the new entry
                if (editor.gui && editor.gui.assetTab) {
                    editor.gui.assetTab.updateObjects();
                } else if (editor.updateObjectsViews) {
                    editor.updateObjectsViews();
                }

                console.log(`Successfully injected "${resource.name}" into the nunuStudio Assets layout.`);
                return resource;
            } else {
                throw new Error("nunuStudio global 'editor' context context or active program structure was unavailable.");
            }

        } catch (error) {
            console.error("Failed to inject model into nunuStudio Assets:", error);
        }
    }



    // Clean bypass mechanism for direct cache injection without scene mutability
    function parseAssetDirectly(extension, rawData, options = {}) {
        const LoaderClass = window.nunu.LoaderRegistry[extension.toLowerCase()];
        if (!LoaderClass) {
            throw new Error(`No loader class registered for extension: ${extension}`);
        }

        const loaderInstance = new LoaderClass();

        // Account for special path requirements discovered in source text
        if (options.path && typeof loaderInstance.setPath === 'function') {
            loaderInstance.setPath(options.path);
        }
        if (options.path && extension === 'awd') {
            loaderInstance._baseDir = options.path;
        }
        if (options.path && extension === 'x') {
            loaderInstance.baseDir = options.path;
        }

        // Draco decoder initialization defaults matching layout parameters
        if (typeof loaderInstance.setDecoderPath === 'function') {
            loaderInstance.setDecoderPath(options.decoderPath || "wasm/draco/");
            loaderInstance.setDecoderConfig({ type: "wasm" });
        }

        const parsed = loaderInstance.parse(rawData);
        const created = LoaderClass.create(parsed);
        return created
    }


    function getFileExtension(t) {
        return void 0 !== t ? (t instanceof File && (t = t.name),
            t.substring(t.lastIndexOf(".") + 1, t.length).toLowerCase()) : ""
    }


    function loadAssetObject(assetsPanel, program, object3D, targetContainer) {
        console.log("[Intercepted] Bypassing scene placement for:", object3D);

        if (object3D) {
            // Recurse into groups/hierarchies to catch split models or collections
            object3D.traverse(function (child) {
                // Steal Material references
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => {
                        if (mat.uuid && program && !program.materials[mat.uuid]) {
                            program.materials[mat.uuid] = mat;
                        }
                    });
                }
                // Steal Geometry definitions
                if (child.geometry && child.geometry.uuid) {
                    if (program && !program.geometries[child.geometry.uuid]) {
                        program.geometries[child.geometry.uuid] = child.geometry;
                    }
                }
                // Steal Textures if tied to standard diffuse maps, normals, etc.
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => {
                        ['map', 'bumpMap', 'normalMap', 'specularMap', 'emissiveMap', 'roughnessMap', 'metalnessMap'].forEach(mapType => {
                            if (mat[mapType] && mat[mapType].uuid && program) {
                                if (!program.textures[mat[mapType].uuid]) {
                                    program.textures[mat[mapType].uuid] = mat[mapType];
                                }
                            }
                        });
                    });
                }
            });
        }

        // 3. Force the Asset Panel interface views to synchronize immediately
        // Search dynamically for an instantiated assets view panel or fallback to prototype invocation context
        if (window.nunu && typeof window.nunu.updateObjectsView === 'function') {
            window.nunu.updateObjectsView();
        } else if (assetsPanel && typeof assetsPanel.updateObjectsView === 'function') {
            assetsPanel.updateObjectsView();
        }
    }




    async function addVisualModelToNunuAssets(payload, classes) {
        const THREE = require('three');
        classes ||= THREE.resolveNunuClasses();

        try {
            if (!payload.success) return;

            // 1. Grab file from IndexedDB using your variables
            const record = await getRecord(DB_STORE_NAME, payload.path, payload.db);
            if (!record || !record.contents) return;

            // Extract filename from the payload path
            const rawFileName = payload.path.split('/').pop();
            const decodedFileName = decodeURIComponent(rawFileName);

            const fileReference = new File([record.contents], decodedFileName, {
                type: "application/octet-stream"
            });


            // Ensure we can access the panel tracking structures
            const program = window.nunu?.program
            const assetsPanel = window.nunu?.gui?.tab?.group?.elementA?.elementB

            if (window.nunu && window.nunu.Loader && typeof window.nunu.Loader.loadModel === 'function') {

                // 1. Store the authentic scene-injection method safely
                const originalAddObject = window.nunu.addObject;

                // 2. Override it temporarily to steal assets before they hit the viewport
                window.nunu.addObject = loadAssetObject.bind(window.nunu, assetsPanel, program);

                try {
                    // 4. Pass the custom file binary layout straight into the native engine pipelines
                    window.nunu.Loader.loadModel.call(window.nunu.Loader, fileReference);
                    console.log(`Dispatched ${decodedFileName} directly to window.nunu.Loader.loadModel`);
                } finally {
                    // 5. Restore core engine loop immediately via queueMicrotask to ensure asynchronous loop completion finishes cleanly
                    queueMicrotask(() => {
                        //window.nunu.addObject = originalAddObject;
                        console.log("[Restored] window.nunu.addObject pipeline returned to normal scene injection mode.");
                    });
                }

            } else {
                console.error("nunuStudio loader tracking endpoint is missing at window.nunu.Loader.loadModel");
            }



            // this is turning into a giant fucking pain in the ass
            /*
            const ext = getFileExtension(fileReference).toLowerCase();
            const readMode = window.nunu.LoaderReadModes[ext] || "arraybuffer"; // fallback to safe default

            const reader = new FileReader();

            reader.onload = function () {
                const parsed = parseAssetDirectly(ext, reader.result);

                // Send final processed asset mesh data directly to the asset manager
                // e.g., assetManager.add(finalAsset);

                console.log(`Dispatched ${fileReference.name} directly to assets panel via readAs${readMode.toUpperCase()}.`);
            };

            if (readMode === "text") {
                reader.readAsText(fileReference);
            } else {
                reader.readAsArrayBuffer(fileReference);
            }
            */

        } catch (error) {
            console.error("Failed executing visual model asset load assignment pipeline:", error);
        }
    }

    window.nunu.addVisualModelToNunuAssets = addVisualModelToNunuAssets

    /**
     * Intercepts a drag event on a corner gripper, applies grid snapping,
     * and updates all corresponding vertex points on the target geometry.
     * * @param {THREE.Vector3} rawNewPosition - The un-snapped world position of the drag handle.
     * @param {Object} gripperInstance - Custom object tracking the gripper mesh and associated vertex indices.
     * @param {THREE.Mesh} targetMesh - The actual model mesh being skewed.
     */
    function handleGripperDrag(rawNewPosition, gripperInstance, targetMesh) {
        // 1. Fetch live grid settings from nunuStudio's Editor core
        // In nunuStudio, snap settings are usually tied to Editor.toolSnap or Editor.settings
        const snapEnabled = Editor.toolSnap ?? true;
        const snapRegion = Editor.settings?.grid?.size ?? 1.0;

        const finalPosition = rawNewPosition.clone();

        // 2. Math to force grid alignment if snapping is active
        if (snapEnabled && snapRegion > 0) {
            finalPosition.x = Math.round(finalPosition.x / snapRegion) * snapRegion;
            finalPosition.y = Math.round(finalPosition.y / snapRegion) * snapRegion;
            finalPosition.z = Math.round(finalPosition.z / snapRegion) * snapRegion;
        }

        // Update the visual handle to the snapped position
        gripperInstance.mesh.position.copy(finalPosition);

        // 3. Convert the world-space snapped position back to the mesh's local space
        targetMesh.updateMatrixWorld(true);
        const localTargetPosition = finalPosition.clone().applyMatrix4(targetMesh.matrixWorldInverse);

        // 4. Update all vertices bound to this specific corner gripper
        const geometry = targetMesh.geometry;
        const positionAttribute = geometry.attributes.position;

        // A corner often affects multiple overlapping vertex elements in the array
        for (const vertexIndex of gripperInstance.associatedIndices) {
            positionAttribute.setXYZ(
                vertexIndex,
                localTargetPosition.x,
                localTargetPosition.y,
                localTargetPosition.z
            );
        }

        // 5. Commit changes to GPU and fix lighting anomalies immediately
        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
    }


    /**
 * Modifies a single vertex in a nunuStudio/Three.js Mesh 
 * and properly updates its shading properties.
 * * @param {THREE.Mesh} mesh - The target mesh object.
 * @param {number} vertexIndex - The sequential index of the vertex.
 * @param {number} dx - The change in X.
 * @param {number} dy - The change in Y.
 * @param {number} dz - The change in Z.
 */
    function modifyVertex(mesh, vertexIndex, dx, dy, dz) {
        const geometry = mesh.geometry;

        // 1. Target the position attribute buffer
        const positionAttribute = geometry.attributes.position;

        if (!positionAttribute) {
            console.error("Geometry does not have a position attribute buffer.");
            return;
        }

        // 2. Read the current localized coordinates
        let x = positionAttribute.getX(vertexIndex);
        let y = positionAttribute.getY(vertexIndex);
        let z = positionAttribute.getZ(vertexIndex);

        // 3. Apply the skew/displacement
        positionAttribute.setXYZ(vertexIndex, x + dx, y + dy, z + dz);

        // 4. CRITICAL: Signal to the GPU that the data array changed
        positionAttribute.needsUpdate = true;

        // 5. CRITICAL: Recalculate spatial and shading properties
        // This fixes the "ruined lighting" by recalculating surface vectors
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
    }

})()