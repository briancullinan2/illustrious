import { Vector3 } from 'three';


// A custom script component to apply "paper plate" physics to a LoRA-placed object
let raycaster, downVector, groundObjects;
let targetScale, targetYaw;

function initialize() {
	// Initialize vectors to avoid garbage collection overhead during frames
	raycaster = new THREE.Raycaster();
	downVector = new THREE.Vector3(0, -1, 0);

	// Set up your target parameters coming from your LoRA stream
	// (Replace these with your actual dynamic data parsing logic)
	targetScale = new THREE.Vector3(1.5, 2.0, 1.5);
	targetYaw = Math.PI; // 180 degrees in radians

	// Find or define which objects in the scene count as "ground"
	// For performance, query your scene for static meshes or a specific ground group
	groundObjects = [];
	this.parent.parent.traverse(function (child) {
		if(child.isMesh && child.name === "GroundMesh") {
			groundObjects.push(child);
		}
	});
}

function update(delta) {
	// 1. Cast a ray downwards from the current position of this object
	raycaster.set(this.position, downVector);
	let intersects = raycaster.intersectObjects(groundObjects, true);

	if(intersects.length > 0) {
		let hit = intersects[0];

		// Snap the object's position exactly to the surface hit point
		this.position.copy(hit.point);

		// 2. Align the object's up vector with the surface normal (the "paper plate" tilt)
		let surfaceNormal = hit.face.normal.clone();
		// Normals are local to the geometry; transform it to world space
		surfaceNormal.transformDirection(hit.object.matrixWorld);

		// Reset the object's orientation matrix
		this.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surfaceNormal);

		// 3. Apply the LoRA's generated Yaw on top of the surface orientation
		this.rotateY(targetYaw);
	}

	// 4. Smoothly apply the LoRA scale parameters
	this.scale.copy(targetScale);
}

function normalizeAndOrientObjaverseMesh(rawMesh, assetType) {
	let paperPlateContainer = new THREE.Group();

	// 1. Compute initial chaotic bounds
	let box = new THREE.Box3().setFromObject(rawMesh);
	let size = new THREE.Vector3();
	box.getSize(size);

	// 2. Proportional Correction (The "Handbag on its Side" Fix)
	// If it's wider/longer than it is tall, but we know it's a vertical asset type,
	// or if we need to align its maximum distribution axis:
	if(size.x > size.y && (assetType === "handbag" || assetType === "bottle")) {
		// Rotate 90 degrees on Z to stand it up along the Y axis
		rawMesh.rotation.z = Math.PI / 2;
	} else if(size.z > size.y && (assetType === "handbag" || assetType === "chair")) {
		// Rotate 90 degrees on X to stand it up along the Y axis
		rawMesh.rotation.x = Math.PI / 2;
	}

	// 3. Re-bake the local matrix changes so bounding box math sees the rotation
	rawMesh.updateMatrixWorld(true);

	// 4. Recalculate bounds based on the newly oriented geometry
	box.setFromObject(rawMesh);
	box.getSize(size);
	let center = new THREE.Vector3();
	box.getCenter(center);

	// 5. Normalize Scale (Normalize largest axis to 1.0)
	let maxDim = Math.max(size.x, size.y, size.z);
	let scaleFactor = maxDim > 0 ? (1.0 / maxDim) : 1.0;
	rawMesh.scale.multiplyScalar(scaleFactor);

	// Final recalculation for perfect bottom-center pivot alignment
	box.setFromObject(rawMesh);
	box.getCenter(center);
	box.getSize(size);

	// Center X/Z, glue the newly corrected bottom (Y) to the plate origin
	rawMesh.position.x -= center.x;
	rawMesh.position.y -= (center.y - (size.y / 2));
	rawMesh.position.z -= center.z;

	paperPlateContainer.add(rawMesh);
	return paperPlateContainer;
}


function normalizeModel(payload) {
	const buffer = payload;
	const view = new Float32Array(buffer);
	const tempVec = new Vector3();

	// Loop through the layout sequentially [x, y, z, x, y, z...]
	for(let i = 0; i < view.length; i += 3) {
		tempVec.set(view[i], view[i + 1], view[i + 2]);

		// Example Math: Scale the vector out
		tempVec.normalize().multiplyScalar(10);

		// Write back into the same buffer
		view[i] = tempVec.x;
		view[i + 1] = tempVec.y;
		view[i + 2] = tempVec.z;
	}

	// Hand the buffer back to the main thread
	self.postMessage({ buffer }, [buffer]);
}


/*

async function decimateGeometry() {
	import * as THREE from 'three';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';


	// Initialize loader
	const loader = new GLTFLoader();

	// Load the asset
	loader.load(
		'path/to/model.gltf',
		function (gltf) {
			const rawModel = gltf.scene;

			// 1. Decimate the geometry before adding to the scene
			decimateModelGeometry(rawModel, 0.5); // Reduce vertex count by 50%

			// 2. Safe to insert into the scene now
			scene.add(rawModel);
		},
		function (xhr) {
			console.log((xhr.loaded / xhr.total * 100) + '% loaded');
		},
		function (error) {
			console.error('An error happened during loading:', error);
		}
	);


}

*/


/**
 * Traverses the model and decimates any mesh geometry found.
 * @param {THREE.Object3D} model
 * @param {number} reductionFactor - Percentage to reduce (e.g., 0.5 = 50% fewer vertices)
 */


function decimateModelGeometry(model, reductionFactor) {
	const modifier = new SimplifyModifier();

	model.traverse((child) => {
		if(child.isMesh) {
			try {
				// Ensure geometry is a BufferGeometry
				const oldGeometry = child.geometry;

				// Calculate target vertex count
				const currentVertexCount = oldGeometry.attributes.position.count;
				const targetCount = Math.floor(currentVertexCount * (1 - reductionFactor));

				// Generate simplified geometry
				const simplifiedGeometry = modifier.modify(oldGeometry, targetCount);

				// Swap the geometry out safely
				child.geometry = simplifiedGeometry;
				oldGeometry.dispose();
			} catch(error) {
				console.warn('Could not decimate mesh:', child.name, error);
			}
		}
	});
}

