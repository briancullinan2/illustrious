// Assume 'scene' is your active Three.js Scene, and 'THREE' is your resolved module

function addSFMCameraReference(scene, imageAssetUrl, position, rotation, fov) {
    // 1. Create the virtual camera representing the real photo take
    const photoCamera = new THREE.PerspectiveCamera(fov, 16 / 9, 0.1, 100);
    photoCamera.position.copy(position);
    photoCamera.rotation.copy(rotation);
    scene.add(photoCamera);

    // 2. Add a visual frustum helper so you can see the camera angle in the scene
    const cameraHelper = new THREE.CameraHelper(photoCamera);
    scene.add(cameraHelper);

    // 3. Project the actual picture onto a plane in front of the camera
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageAssetUrl, (texture) => {
        const geometry = new THREE.PlaneGeometry(4, 2.25); // Match your aspect ratio
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const imagePlane = new THREE.Mesh(geometry, material);

        // Position the image slightly ahead of the camera lens along its local Z axis
        imagePlane.position.set(0, 0, -5);
        photoCamera.add(imagePlane);
    });
}


function createCameraFrustum(width = 0.8, height = 0.6, depth = 0.5) {
    const w = width / 2;
    const h = height / 2;
    const d = depth;

    // Coordinates for the apex (0,0,0) and the 4 base corners
    const vertices = new Float32Array([
        0, 0, 0, -w, h, -d, // Apex to Top-Left
        0, 0, 0, w, h, -d, // Apex to Top-Right
        0, 0, 0, -w, -h, -d, // Apex to Bottom-Left
        0, 0, 0, w, -h, -d, // Apex to Bottom-Right

        -w, h, -d, w, h, -d, // Top edge
        w, h, -d, w, -h, -d, // Right edge
        w, -h, -d, -w, -h, -d, // Bottom edge
        -w, -h, -d, -w, h, -d  // Left edge
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 1 });
    return new THREE.LineSegments(geometry, material);
}


function createCameraImagePlane(textureUrl, width = 0.8, height = 0.6, depth = 0.5) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const texture = new THREE.TextureLoader().load(textureUrl);

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    // Position it at the back of the pyramid, looking inward
    mesh.position.set(0, 0, -depth);
    return mesh;
}


function addSfmCameraToScene(scene, sfmData) {
    // sfmData template: { id, imgUrl, position: [x,y,z], orientation: [quaternion or matrix] }
    const cameraGroup = new THREE.Group();

    const frustum = createCameraFrustum();
    const imagePlane = createCameraImagePlane(sfmData.imgUrl);

    cameraGroup.add(frustum);
    cameraGroup.add(imagePlane);

    // Apply SfM transforms
    cameraGroup.position.fromArray(sfmData.position);
    cameraGroup.quaternion.fromArray(sfmData.orientation); // parsing orientation matrix/quat

    // Store reference info for raycasting/interaction later
    cameraGroup.userData = { cameraId: sfmData.id };

    scene.add(cameraGroup);
    return cameraGroup;
}


function drawTraceLine(scene, startPos, endPos, color = 0x00ffcc) {
    const points = [
        new THREE.Vector3().fromArray(startPos),
        new THREE.Vector3().fromArray(endPos)
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4
    });

    const line = new THREE.Line(geometry, material);
    scene.add(line);
}


// Put this inside the method that handles the end of 'phaseBundle' or 'phaseMapping'
function visualizeSfMResult(sfmProjectData, threeScene) {
    const poses = sfmProjectData.poses || [];
    const points = sfmProjectData.points || [];

    // 1. Draw the Camera Pyramids & Image planes
    poses.forEach((pose) => {
        if (!pose.registered) return; // Skip unregistered/failed cameras

        const cameraGroup = new THREE.Group();

        // Reconstruct rotation matrix / Quaternion from pose.qvec
        if (pose.qvec) {
            cameraGroup.quaternion.set(pose.qvec[1], pose.qvec[2], pose.qvec[3], pose.qvec[0]);
        }
        if (pose.center) {
            cameraGroup.position.fromArray(pose.center);
        }

        // Add Wireframe Pyramid
        const frustumWireframe = createCameraFrustum(); // Using the LineSegments helper
        cameraGroup.add(frustumWireframe);

        // Add local image thumbnail plane (if you store Blob URLs locally)
        if (pose.localBlobUrl || pose.imgUrl) {
            const imagePlane = createCameraImagePlane(pose.localBlobUrl || pose.imgUrl);
            cameraGroup.add(imagePlane);
        }

        threeScene.add(cameraGroup);
    });

    // 2. Draw Visibility Trace Lines (Ray Bundles)
    // If your points store track data pointing back to the camera indices:
    points.forEach((point) => {
        if (point.xyz && point.visibleCameraIndices) {
            point.visibleCameraIndices.forEach((camIdx) => {
                const cameraPose = poses[camIdx];
                if (cameraPose && cameraPose.registered) {
                    drawTraceLine(threeScene, cameraPose.center, point.xyz);
                }
            });
        }
    });
}

