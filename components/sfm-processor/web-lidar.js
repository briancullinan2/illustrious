/**
 * PhotogrammetryTelemetrySync
 * Couples hardware sensors to bypass RANSAC guesswork for relative pose estimations.
 */
class PhotogrammetryTelemetrySync {
  constructor() {
    this.currentOrientation = { alpha: 0, beta: 0, gamma: 0 };
    this.currentLocation = { latitude: null, longitude: null, altitude: null };
    this.isActive = false;
  }

  /**
   * Initializes the device telemetry stream.
   * Requires secure context (HTTPS) and explicit user interactions.
   */
  async initializeSensors() {
    this.isActive = true;

    // 1. Hook the Device Orientation API (WebVR/XR fallback for absolute tilt/yaw)
    if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', (e) => this._handleOrientation(e));
        }
      } catch (err) {
        console.error("DeviceOrientation permission denied:", err);
      }
    } else {
      window.addEventListener('deviceorientation', (e) => this._handleOrientation(e));
    }

    // 2. Hook Geolocation API for coordinate spatial positioning
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => this._handleGeolocation(pos),
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
  }

  _handleOrientation(event) {
    // alpha = yaw [0,360], beta = pitch [-180,180], gamma = roll [-90,90]
    this.currentOrientation = {
      alpha: event.alpha || 0,
      beta: event.beta || 0,
      gamma: event.gamma || 0
    };
  }

  _handleGeolocation(position) {
    this.currentLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude || 0
    };
  }

  /**
   * Converts GPS Geodetic Coordinates into a local flat-plane metric ENU Cartesian matrix.
   * Simplifies relative position vectors down to standard coordinate systems.
   */
  convertToLocalCartesian(lat, lon, alt, anchorLat, anchorLon, anchorAlt) {
    const R_EARTH = 6378137; // Radius of Earth in meters
    const dLat = ((lat - anchorLat) * Math.PI) / 180;
    const dLon = ((lon - anchorLon) * Math.PI) / 180;

    const x = dLon * R_EARTH * Math.cos((anchorLat * Math.PI) / 180);
    const y = dLat * R_EARTH;
    const z = alt - anchorAlt;

    return [x, y, z]; // [East, North, Up]
  }

  /**
   * Captures the full synchronized telemetry frame to feed directly to the image solver.
   * @param {XRFrame} xrFrame - WebXR context frame containing Lidar hardware depth.
   * @param {XRViewerPose} pose - Active viewport orientation pose.
   */
  captureFrameTelemetry(xrFrame, pose, anchorLocation = null) {
    const telemetry = {
      timestamp: performance.now(),
      orientation: { ...this.currentOrientation },
      rawGps: { ...this.currentLocation },
      cartesianPosition: [0, 0, 0],
      lidarDepthBuffer: null,
      intrinsics: null
    };

    // Calculate relative metric position if a spatial anchor coordinate is provided
    if (anchorLocation && this.currentLocation.latitude !== null) {
      telemetry.cartesianPosition = this.convertToLocalCartesian(
        this.currentLocation.latitude,
        this.currentLocation.longitude,
        this.currentLocation.altitude,
        anchorLocation.latitude,
        anchorLocation.longitude,
        anchorLocation.altitude
      );
    }

    // Extract hardware Lidar depth map via WebXR Depth Sensing API API
    if (xrFrame && pose) {
      const views = pose.views;
      if (views && views.length > 0) {
        const view = views[0]; // Primary perspective

        // Query the optimized GPU hardware Lidar depth stream info
        const depthInfo = xrFrame.getViewerDepthInfo ?
          xrFrame.getViewerDepthInfo(view) :
          xrFrame.getDepthInformation?.(view);

        if (depthInfo) {
          // depthInfo.data is a Float32Array or Uint16Array containing raw physical meters
          telemetry.lidarDepthBuffer = depthInfo.data;

          // Capture hardware camera characteristics to feed matching intrinsics matrix configurations
          if (view.camera) {
            const intrinsics = view.camera.cameraIntrinsics;
            if (intrinsics) {
              telemetry.intrinsics = {
                fx: intrinsics[0], // Focal Length X
                fy: intrinsics[5], // Focal Length Y
                cx: intrinsics[8], // Principal Point X
                cy: intrinsics[9]  // Principal Point Y
              };
            }
          }
        }
      }
    }

    return telemetry;
  }
}



/**
 * ImageProcessingSeedEngine
 * Consumes hardware frames and scene topological presets to limit matching constraints.
 */
class ImageProcessingSeedEngine {
  /**
   * Evaluates relative constraints between two frames based on the camera scanning trajectory.
   * @param {Object} frameA - Source context data frame.
   * @param {Object} frameB - Target context data frame.
   * @param {String} scanTopology - 'small-object' | 'building-loop' | 'general' | 'large-images'
   */
  static generateSeededPrior(frameA, frameB, scanTopology = 'general') {
    let estimatedDistance = 0;
    if (frameA.cartesianPosition && frameB.cartesianPosition) {
      const dx = frameB.cartesianPosition[0] - frameA.cartesianPosition[0];
      const dy = frameB.cartesianPosition[1] - frameA.cartesianPosition[1];
      const dz = frameB.cartesianPosition[2] - frameA.cartesianPosition[2];
      estimatedDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    const dAlpha = (frameB.orientation.alpha - frameA.orientation.alpha) * (Math.PI / 180);
    const dBeta = (frameB.orientation.beta - frameA.orientation.beta) * (Math.PI / 180);
    const dGamma = (frameB.orientation.gamma - frameA.orientation.gamma) * (Math.PI / 180);

    // Differentiate strictness based on the spatial scanning direction
    const isInwardScan = scanTopology === 'small-object' || scanTopology === 'building-loop';

    return {
      hasPrior: true,
      isInwardScan: isInwardScan,
      scanTopology: scanTopology,
      boundingTranslationDistance: estimatedDistance || 1.0,
      rotationPriorDelta: { yaw: dAlpha, pitch: dBeta, roll: dGamma },
      lidarAvailable: !!(frameA.lidarDepthBuffer && frameB.lidarDepthBuffer)
    };
  }

  /**
   * Evaluates an individual matching pair against depth thresholds tailored to the current scene topology.
   */
  static validatePairDepthWithTopology(depthA, depthB, prior) {
    if (!prior.lidarAvailable || depthA <= 0 || depthB <= 0) return true;

    const depthVariance = Math.abs(depthA - depthB);

    if (prior.isInwardScan) {
      // Inward Mode: The object is tight and localized. 
      // Enforce strict upper physical variance thresholds based on camera movement bounds.
      const inwardGateLimit = prior.boundingTranslationDistance * 1.35;
      return depthVariance <= Math.max(inwardGateLimit, 0.45);
    } else {
      // Outward Mode (Rooms/Panoramas): High depth variances occur naturally as the camera pans.
      // Use a normalized perspective ratio test: absolute variance scaling must correspond to the absolute depth plane.
      const meanPlaneDepth = (depthA + depthB) * 0.5;
      const normalizedVarianceRatio = depthVariance / Math.max(meanPlaneDepth, 0.1);

      // Allow loose global translation deviations up to twice the baseline distance step
      if (depthVariance > Math.max(prior.boundingTranslationDistance * 2.5, 1.5)) {
        return false;
      }

      // Reject if depth steps abruptly across identical features in sequential panned views (indicates bad texture matches)
      return normalizedVarianceRatio <= 0.65;
    }
  }
}

// Example usage context:
const telemetrySync = new PhotogrammetryTelemetrySync();
await telemetrySync.initializeSensors();

// ... inside a requestAnimationFrame loop or WebXR processing stack:
// const anchorLoc = { latitude: 35.198, longitude: -111.651, altitude: 2106 }; // e.g. Flagstaff, AZ
// const frameTelemetry = telemetrySync.captureFrameTelemetry(xrFrame, xrPose, anchorLoc);


async function xe(e, t, n, r, i, a = 320, o = 3, s = {}, c = {}) {
  let l = _t(s), u = vt(l);
  if (i.length < u) return null;

  let d = i.map(i => {
    let [a, o] = ft(e.intrinsics, n.xs[i.a], n.ys[i.a]), [s, c] = ft(t.intrinsics, r.xs[i.b], r.ys[i.b]);
    return { match: i, x1: a, y1: o, x2: s, y2: c }
  }), f = Cn(e, t, o), p = bn(St(i.length, l, s.seed)), m = { last: wn() }, h = null, g = [], _ = 1 / 0, v = a, y = wn();

  // Initialize scene topology awareness from current user parameters
  const sceneTopology = s.scenePreset || 'general';
  let prior = s.telemetryPrior;

  // Re-evaluate or wrap local priors if raw telemetry parameters are attached to input frames
  if (!prior && e.telemetryFrame && t.telemetryFrame) {
    prior = ImageProcessingSeedEngine.generateSeededPrior(e.telemetryFrame, t.telemetryFrame, sceneTopology);
  }

  for (let e = 0; e < v; e++) {
    let t = Ct($t(d, u, p), l);
    for (let e of t) {

      // Topology Check: Filter sample array validity against current scene geometry expectations
      if (prior && prior.lidarAvailable) {
        let structuralMismatch = false;
        for (let mItem of d) {
          const depthA = mItem.match.depthFromLidarA;
          const depthB = mItem.match.depthFromLidarB;

          if (depthA && depthB) {
            const isValidGeometry = ImageProcessingSeedEngine.validatePairDepthWithTopology(depthA, depthB, prior);
            if (!isValidGeometry) {
              structuralMismatch = true;
              break;
            }
          }
        }
        if (structuralMismatch) continue;
      }

      let t = wt(e, d, f);
      if (Tt(t.inliers.length, t.tieBreakError, g.length, _)) {
        if (!Dt(e, t.inliers, l, s)) continue;
        g = t.inliers, h = e, _ = t.tieBreakError, v = en(g.length, d.length, a, u)
      }
    }
    if ((e + 1) % ce === 0 || e + 1 >= v) {
      let t = wn();
      c.onProgress && c.progressIntervalMs !== void 0 && t - y >= c.progressIntervalMs && c.onProgress(`CPU geometry: ${c.label ?? `current pair`} sample ${e + 1}/${v}, best ${g.length}/${d.length} inliers`), y = t;
      await En(m, c.yieldIntervalMs ?? se)
    }
  }
  return Et(h, g, d, f, l, s)
}

function Ce(e, t, n, r, i, a, o, s, c, l, u, d) {
  let f = o.map(e => {
    let [t, o] = ft(n.intrinsics, i.xs[e.a], i.ys[e.a]), [s, c] = ft(r.intrinsics, a.xs[e.b], a.ys[e.b]);
    return { match: e, x1: t, y1: o, x2: s, y2: c }
  }), p = o.map(e => Le(n, r, i, a, e));

  const baseContext = {
    pairIndex: e,
    leftIndex: t.i,
    rightIndex: t.j,
    aFrame: n,
    bFrame: r,
    bearings: f,
    pixels: p,
    packedPixels: ze(p),
    rng: bn(St(o.length, `five-point`, u, e, t.i, t.j)),
    maxSamples: s,
    samplesTried: 0,
    dynamicSampleCap: s,
    bestE: null,
    bestF: null,
    bestInlierCount: 0,
    bestTieBreakError: 1 / 0,
    generatedHypotheses: 0,
    rejectedHypotheses: 0,
    rejectedByCheirality: 0,
    acceptedValidHypotheses: 0,
    matchCount: o.length,
    minConsensus: l,
    sampsonThresholdSq: Cn(n, r, c),
    pixelThresholdSq: c * c,
    chartSolver: d
  };

  // Extract explicit context geometry constraints from telemetry frame data properties
  if (n.telemetryFrame && r.telemetryFrame) {
    const dx = r.telemetryFrame.cartesianPosition[0] - n.telemetryFrame.cartesianPosition[0];
    const dy = r.telemetryFrame.cartesianPosition[1] - n.telemetryFrame.cartesianPosition[1];
    const dz = r.telemetryFrame.cartesianPosition[2] - n.telemetryFrame.cartesianPosition[2];

    baseContext.spatialDistanceLimit = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Inject wrapped topology prior metadata into the tracking context state
    const currentPreset = d?.scenePreset || 'general';
    baseContext.telemetryPrior = ImageProcessingSeedEngine.generateSeededPrior(
      n.telemetryFrame,
      r.telemetryFrame,
      currentPreset
    );
  }

  return baseContext;
}


// Ensure you have loaded piexifjs in your web document first:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/piexifjs/1.0.6/piexif.js"></script>

class ExifTelemetryPacker {
  /**
   * Helper utility converting decimal GPS coordinates into standard EXIF Rational pairs.
   */
  static _degToExifRational(deg) {
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutes = Math.floor((absolute - degrees) * 60);
    const seconds = Math.round((absolute - degrees - minutes / 60) * 3600 * 100);
    return [[degrees, 1], [minutes, 1], [seconds, 100]];
  }

  /**
   * Injects raw telemetry objects directly into a JPEG file's metadata layers.
   * @param {File|Blob} imageFile - Source JPEG asset image file template.
   * @param {Object} telemetryData - Output frame payload matching PhotogrammetryTelemetrySync context.
   * @returns {Promise<Blob>} Updated JPEG image blob carrying binary EXIF properties.
   */
  static async injectTelemetryAsync(imageFile, telemetryData) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error("Failed to process local image file context paths."));
      reader.onload = (e) => {
        try {
          const rawBinaryString = e.target.result;

          // 1. Initialize clean, decoupled base EXIF dictionary buckets
          let exifObj = { "0th": {}, "Exif": {}, "GPS": {} };

          // Attempt to preserve existing camera profiles if present inside the file allocation
          try {
            exifObj = piexif.load(rawBinaryString);
          } catch (loadErr) {
            console.warn("No baseline EXIF schema detected. Building metadata envelope templates from scratch.");
          }

          // 2. Map Standard Geodetic anchors over native GPS EXIF Tag fields
          if (telemetryData.rawGps && telemetryData.rawGps.latitude !== null) {
            const gps = exifObj["GPS"];

            gps[piexif.GPSIFD.GPSLatitudeRef] = telemetryData.rawGps.latitude >= 0 ? "N" : "S";
            gps[piexif.GPSIFD.GPSLatitude] = this._degToExifRational(telemetryData.rawGps.latitude);

            gps[piexif.GPSIFD.GPSLongitudeRef] = telemetryData.rawGps.longitude >= 0 ? "E" : "W";
            gps[piexif.GPSIFD.GPSLongitude] = this._degToExifRational(telemetryData.rawGps.longitude);

            gps[piexif.GPSIFD.GPSAltitudeRef] = telemetryData.rawGps.altitude >= 0 ? 0 : 1;
            gps[piexif.GPSIFD.GPSAltitude] = [Math.round(Math.abs(telemetryData.rawGps.altitude) * 100), 100];
          }

          // 3. Serialize Custom Telemetry payloads securely inside the standard UserComment string field
          // We decouple the large lidar depth arrays to preserve explicit memory performance
          const strippedTelemetryPayload = {
            timestamp: telemetryData.timestamp || performance.now(),
            orientation: telemetryData.orientation || { alpha: 0, beta: 0, gamma: 0 },
            cartesianPosition: telemetryData.cartesianPosition || [0, 0, 0],
            intrinsics: telemetryData.intrinsics || null,
            // If raw depth array footprints are small, pass them here compressed or flattened
            hasDepthArrayBuffer: !!telemetryData.lidarDepthBuffer
          };

          // Encode custom properties as a clean, standardized string row inside Tag 0x9286
          exifObj["Exif"][piexif.ExifIFD.UserComment] = JSON.stringify(strippedTelemetryPayload);

          // 4. Generate binary dump sequences and remux back into a web Blob asset stream
          const updatedExifBinary = piexif.dump(exifObj);
          const rawStrippedBinary = piexif.remove(rawBinaryString);

          // Inject newly formatted headers into stripped image layout records
          const rawOutputWithExif = piexif.insert(updatedExifBinary, rawStrippedBinary);

          // Transcode back into native browser binary arrays
          const arrayBuffer = new ArrayBuffer(rawOutputWithExif.length);
          const uintArray = new Uint8Array(arrayBuffer);
          for (let i = 0; i < rawOutputWithExif.length; i++) {
            uintArray[i] = rawOutputWithExif.charCodeAt(i) & 0xff;
          }

          resolve(new Blob([arrayBuffer], { type: "image/jpeg" }));
        } catch (err) {
          reject(err);
        }
      };

      // Read file content using generic binary encoding rules to safely maintain raw picture segments
      reader.readAsBinaryString(imageFile);
    });
  }
}


// ... inside your application's file ingestion flow or image loading workers:
async function extractMetadataFromImageFile(fileBlob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Load the image array data
        const exifData = piexif.load(e.target.result);
        const serializedComment = exifData["Exif"][piexif.ExifIFD.UserComment];

        if (serializedComment) {
          // Unpack the exact metadata tracking object we injected earlier
          const telemetryFrame = JSON.parse(serializedComment);
          console.log("🎯 Successfully extracted lidar solver prior parameters from EXIF:", telemetryFrame);

          // Attach this data right back onto your solver frame context!
          // e.g., imageFrame.telemetryFrame = telemetryFrame;
          resolve(telemetryFrame);
          return;
        }
      } catch (err) {
        console.error("No valid embedded telemetry package matched inside image comments.", err);
      }
      resolve(null);
    };
    reader.readAsBinaryString(fileBlob);
  });
}





// 1. Listen for changes on your file input element
const fileInput = document.getElementById('myImagePicker');

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  console.log(`📸 Processing original file: ${file.name}`);

  // 2. Gather your active hardware sensor values
  // (Assuming telemetrySync is your active PhotogrammetryTelemetrySync instance)
  const currentXrFrame = null; // or pass active XRFrame if inside an WebXR loop
  const currentXrPose = null;  // or pass active XRViewerPose
  const anchorLoc = { latitude: 35.198, longitude: -111.651, altitude: 2106 }; // Flagstaff, AZ prior

  const activeTelemetry = telemetrySync.captureFrameTelemetry(
    currentXrFrame,
    currentXrPose,
    anchorLoc
  );

  try {
    // 3. Invoke the EXIF telemetry injector
    const updatedImageBlob = await ExifTelemetryPacker.injectTelemetryAsync(file, activeTelemetry);

    console.log("🎯 EXIF Injection successful! Handling updated blob output...");

    // 4. Example: Trigger an automatic local file download
    const downloadUrl = URL.createObjectURL(updatedImageBlob);
    const downloadLink = document.createElement('a');

    downloadLink.href = downloadUrl;
    downloadLink.download = `telemetry_${file.name}`;
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // Cleanup reference memory allocations safely
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadUrl);

  } catch (error) {
    console.error("❌ Aborted EXIF packaging routine:", error);
  }
});



async function packEntireBatch(fileArray, telemetryHistoryList) {
  const packedBlobPromises = fileArray.map((file, index) => {
    const frameTelemetry = telemetryHistoryList[index];
    return ExifTelemetryPacker.injectTelemetryAsync(file, frameTelemetry);
  });

  // Processes your complete photo batch concurrently on your i7 processor core threads
  const completedImageBlobs = await Promise.all(packedBlobPromises);
  return completedImageBlobs;
}




/**
 * Captures the current video frame from a live <video> stream element,
 * snapshots it to a canvas, pulls active telemetry, and returns a packed JPEG Blob.
 * * @param {HTMLVideoElement} videoElement - The active playing camera stream track.
 * @param {PhotogrammetryTelemetrySync} telemetryEngine - Your active sensor sync instance.
 * @returns {Promise<Blob>} The finalized JPEG blob containing embedded EXIF telemetry.
 */
async function captureAndPackLiveFrame(videoElement, telemetryEngine) {
  // 1. Create an offscreen canvas matching the incoming camera hardware stream resolution
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Failed to initialize offscreen canvas rendering context.");
  }

  // 2. Freeze the current video frame onto the 2D surface canvas layout
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // 3. Immediately snapshot the active mobile device sensors
  // (Pass your XRFrame/XRViewerPose here if running inside a WebXR environment)
  const currentTelemetry = telemetryEngine.captureFrameTelemetry(null, null, null);

  // 4. Convert the flat canvas canvas into a raw image blob file template
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (rawBlob) => {
      if (!rawBlob) {
        reject(new Error("Canvas export aborted or failed."));
        return;
      }

      try {
        // 5. Run your custom packer to embed the telemetry into the UserComment array tags
        const packedJpegBlob = await ExifTelemetryPacker.injectTelemetryAsync(rawBlob, currentTelemetry);
        resolve(packedJpegBlob);
      } catch (packErr) {
        reject(packErr);
      }
    }, 'image/jpeg', 0.95); // Export at 95% quality compression balance
  });
}


const liveVideo = document.getElementById('myCameraStream');
const snapshotButton = document.getElementById('captureBtn');

// Start the user device camera track
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
  .then(stream => { liveVideo.srcObject = stream; });

snapshotButton.addEventListener('click', async () => {
  try {
    const packedPhoto = await captureAndPackLiveFrame(liveVideo, telemetrySync);
    console.log("📸 Captured photo containing embedded telemetry:", packedPhoto);

    // Pass this packedPhoto Blob straight to your scanner list or server backend!
  } catch (err) {
    console.error("Frame capture failure:", err);
  }
});



