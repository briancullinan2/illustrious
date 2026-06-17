/**
 * Spherical Harmonics Mesh Fitter for Three.js
 * Computes forward Fourier projection and inverse shape reconstruction.
 */
class MeshSHCalculator {
    constructor(maxDegree = 8) {
        this.Lmax = maxDegree;
        this.coefficients = []; // Stores c_l^m coefficients
    }

    /**
     * Helper: Associated Legendre Polynomials P_l^m(x)
     */
    _associatedLegendre(l, m, x) {
        if (m < 0) return Math.pow(-1, m) * this._associatedLegendre(l, -m, x);

        // Rule for P_m^m(x)
        let pmm = 1.0;
        if (m > 0) {
            const somx2 = Math.sqrt((1.0 - x) * (1.0 + x));
            let fact = 1.0;
            for (let i = 1; i <= m; i++) {
                pmm *= -fact * somx2;
                fact += 2.0;
            }
        }
        if (l === m) return pmm;

        // Rule for P_{m+1}^m(x)
        let pmmp1 = x * (2.0 * m + 1.0) * pmm;
        if (l === m + 1) return pmmp1;

        // Standard recurrence relation for P_l^m(x)
        let pll = 0.0;
        for (let ll = m + 2; ll <= l; ll++) {
            pll = (x * (2.0 * ll - 1.0) * pmmp1 - (ll + m - 1.0) * pmm) / (ll - m);
            pmm = pmmp1;
            pmmp1 = pll;
        }
        return pmmp1;
    }

    /**
     * Helper: Real Spherical Harmonic Basis Function Y_l^m(theta, phi)
     * theta: colatitude [0, PI], phi: azimuth [0, 2*PI]
     */
    _evaluateSH(l, m, theta, phi) {
        const absM = Math.abs(m);

        // Normalization factor N_l^m
        const num = (2 * l + 1) * this._factorial(l - absM);
        const den = 4 * Math.PI * this._factorial(l + absM);
        const N = Math.sqrt(num / den);

        const P = this._associatedLegendre(l, absM, Math.cos(theta));

        if (m === 0) {
            return N * P;
        } else if (m > 0) {
            return Math.sqrt(2.0) * N * P * Math.cos(m * phi);
        } else {
            return Math.sqrt(2.0) * N * P * Math.sin(absM * phi);
        }
    }

    _factorial(n) {
        let res = 1;
        for (let i = 2; i <= n; i++) res *= i;
        return res;
    }

    /**
     * Forward Transform: Fourier fit a Three.js Mesh
     * @param {THREE.Mesh} mesh - The target geometry model
     */
    fitMesh(mesh) {
        // Ensure world matrices are computed
        mesh.updateMatrixWorld(true);
        const geometry = mesh.geometry;
        const positionAttr = geometry.attributes.position;

        if (!positionAttr) {
            throw new Error("Geometry lacks a valid position attribute vector.");
        }

        const vertexCount = positionAttr.count;
        const samples = [];

        const vertex = new THREE.Vector3();

        // 1. Gather coordinates and project into Spherical space (relative to mesh centroid)
        for (let i = 0; i < vertexCount; i++) {
            vertex.fromBufferAttribute(positionAttr, i);
            // Optional: Transform to world space if needed
            // vertex.applyMatrix4(mesh.matrixWorld);

            const r = vertex.length();
            if (r < 0.0001) continue; // Skip core degenerate origin points

            // Calculate spherical angles
            const theta = Math.acos(THREE.MathUtils.clamp(vertex.z / r, -1, 1)); // Colatitude (Z-up standard)
            const phi = Math.atan2(vertex.y, vertex.x); // Azimuth [ -PI, PI ]
            const normalizedPhi = phi < 0 ? phi + 2 * Math.PI : phi; // Shift to [0, 2*PI]

            samples.push({ r, theta, phi: normalizedPhi });
        }

        // 2. Compute the SH Coefficients via Discrete Integration over the Surface Area
        this.coefficients = [];
        const totalSamples = samples.length;

        for (let l = 0; l <= this.Lmax; l++) {
            for (let m = -l; m <= l; m++) {
                let integralSum = 0;

                for (let i = 0; i < totalSamples; i++) {
                    const sample = samples[i];
                    const shValue = this._evaluateSH(l, m, sample.theta, sample.phi);

                    // Project radius function onto SH basis vector
                    integralSum += sample.r * shValue;
                }

                // Discrete normalization step based on sampling density
                const c_lm = (4 * Math.PI * integralSum) / totalSamples;

                this.coefficients.push({ l, m, value: c_lm });
            }
        }

        return this.coefficients;
    }

    /**
     * Inverse Transform: Reconstruct a continuous radius for any angle
     * @param {number} theta - Colatitude angle [0, PI]
     * @param {number} phi - Azimuth angle [0, 2*PI]
     */
    evaluateRadius(theta, phi) {
        let rEval = 0;
        let coeffIndex = 0;

        for (let l = 0; l <= this.Lmax; l++) {
            for (let m = -l; m <= l; m++) {
                const coeff = this.coefficients[coeffIndex];
                const shValue = this._evaluateSH(l, m, theta, phi);

                rEval += coeff.value * shValue;
                coeffIndex++;
            }
        }

        return rEval;
    }

    /**
     * Helper to rebuild a new Three.js Parametric Geometry based on the SH Fourier fit
     */
    generateFittedGeometry(uSegments = 64, vSegments = 64) {
        const positions = [];
        const indices = [];

        // Sample the spherical evaluation path
        for (let i = 0; i <= uSegments; i++) {
            const theta = (i / uSegments) * Math.PI; // 0 to PI
            for (let j = 0; j <= vSegments; j++) {
                const phi = (j / vSegments) * 2 * Math.PI; // 0 to 2*PI

                // Solve current continuous shape radius
                const r = Math.max(0, this.evaluateRadius(theta, phi));

                // Re-map back to Cartesian Space
                const x = r * Math.sin(theta) * Math.cos(phi);
                const y = r * Math.sin(theta) * Math.sin(phi);
                const z = r * Math.cos(theta);

                positions.push(x, y, z);
            }
        }

        // Build the structural element face indices index buffer
        for (let i = 0; i < uSegments; i++) {
            for (let j = 0; j < vSegments; j++) {
                const p0 = i * (vSegments + 1) + j;
                const p1 = p0 + 1;
                const p2 = (i + 1) * (vSegments + 1) + j;
                const p3 = p2 + 1;

                indices.push(p0, p2, p1);
                indices.push(p1, p2, p3);
            }
        }

        const fittedGeometry = new THREE.BufferGeometry();
        fittedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        fittedGeometry.setIndex(indices);
        fittedGeometry.computeVertexNormals();

        return fittedGeometry;
    }
}


async function testFourierFitter() {
    // 1. Initialize calculator with maximum degree limits (Higher = Crispier detail fits)
    const fitter = new MeshSHCalculator(10);

    // 2. Pass any reference target Three.js mesh to calculate its layout coefficients
    const coefficients = fitter.fitMesh(myTargetMesh);
    console.log("Computed Fourier SH Layout Coefficients Array:", coefficients);

    // 3. Generate a clean reconstructed mathematical clone geometry map out of it
    const optimizedGeometry = fitter.generateFittedGeometry(64, 64);
    const fitMesh = new THREE.Mesh(optimizedGeometry, new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
    scene.add(fitMesh);
}


async function testUnshapelyMeshes() {
    const coefficients = fitter.fitMesh(inputMesh);

    // Generate your new visual Fourier reconstruction mesh
    const geometry = fitter.generateFittedGeometry(64, 64);
    const fourierMesh = new THREE.Mesh(geometry, material);

    // Inject the pure mathematical equation metadata directly into the object instance
    fourierMesh.userData = {
        isFourierFit: true,
        maxDegree: fitter.Lmax,
        equationCentroid: new THREE.Vector3(0, 0, 0), // Local matrix offset
        shCoefficients: coefficients // Your complete Fourier scalar list
    };

    scene.add(fourierMesh);

}


