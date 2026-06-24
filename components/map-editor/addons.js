
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

})()