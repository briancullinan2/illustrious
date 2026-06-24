
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


})()