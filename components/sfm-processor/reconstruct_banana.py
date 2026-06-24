import os
import sys
import shutil
import logging
from pathlib import Path

# ========================== PATH SETUP ==========================
OPENSFM_ROOT = Path("~/OpenSfM").expanduser().resolve()

if str(OPENSFM_ROOT) not in sys.path:
    sys.path.insert(0, str(OPENSFM_ROOT))
if str(OPENSFM_ROOT / "opensfm") not in sys.path:
    sys.path.insert(0, str(OPENSFM_ROOT / "opensfm"))

build_dir = OPENSFM_ROOT / "cmake_build" / "opensfm"
if build_dir.exists() and str(build_dir) not in sys.path:
    sys.path.insert(0, str(build_dir))

# ========================== IMPORTS ==========================
from opensfm import dataset, reconstruction, tracking
from opensfm.actions import extract_metadata, detect_features, match_features, create_tracks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OpenSfM-MultiPass")


def run_multi_pass_pipeline():
    DATASET_PATH = Path("~/dataset_banana").expanduser().resolve()
    IMAGES_DIR = DATASET_PATH / "isolated_output"

    if not IMAGES_DIR.exists():
        logger.error(f"Images directory not found: {IMAGES_DIR}")
        return

    # Initialize the dataset handler pointing to your root project folder
    data = dataset.DataSet(str(DATASET_PATH))
    config = data.config

    # ==================== PATH OVERRIDES ====================
    # Force OpenSfM to look inside isolated_output directly for images
    data._image_file = lambda image: os.path.join(str(IMAGES_DIR), image)
    data._image_path = lambda: str(IMAGES_DIR)
    # ========================================================

    # ==================== AGGRESSIVE TUNING FOR LOW-TEXTURE BANANAS ====================
    config["feature_type"] = "HAHOG"          # Usually better than SIFT for this
    config["feature_min_frames"] = 1000       # Force more features even on smooth areas
    config["lowes_ratio"] = 0.9               # Very permissive matching
    config["matching_min_inliers"] = 8
    config["robust_matching_min_match"] = 8   # Critical: lower minimum matches
    config["five_point_algo_min_inliers"] = 8 # Lower threshold for initial pair
    config["reconstruction_min_inliers"] = 6
    config["min_track_length"] = 2
    config["triangulation_threshold"] = 8.0   # Much looser
    config["bundle_use_gcp"] = False
    # =================================================================================

    anchors = {
        "DSC_0423_isolated.png", "DSC_0424_isolated.png",
        "DSC_0425_isolated.png", "DSC_0426_isolated.png",
        "DSC_0438_isolated.png"
    }

    all_images = [f for f in os.listdir(IMAGES_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    outliers = [f for f in all_images if f not in anchors]

    logger.info(f"Found {len(all_images)} images → {len(anchors)} anchors + {len(outliers)} outliers")

    # ====================== PASS 1: Anchors ======================
    logger.info("=== PASS 1: Anchor-only reconstruction ===")
    
    # Restrict OpenSfM to target ONLY your anchor files in memory
    data.images = lambda: [f for f in all_images if f in anchors]
    
    extract_metadata.run_dataset(data)
    detect_features.run_dataset(data)
    match_features.run_dataset(data)      
    create_tracks.run_dataset(data)

    tracks_manager = data.load_tracks_manager()
    logger.info(f"Tracks created: {len(tracks_manager.get_track_ids())} tracks")
    track_lengths = [len(tracks_manager.get_track_observations(track_id)) 
                    for track_id in tracks_manager.get_track_ids()]
    if track_lengths:
        logger.info(f"Longest track: {max(track_lengths)} images")
        
    report, reconstructions = reconstruction.incremental_reconstruction(data, tracks_manager)

    if not reconstructions:
        logger.error("Still failed to reconstruct anchors. Check feature quality. No files were altered.")
        return

    base_reconstruction = reconstructions[0]
    logger.info(f"Anchor reconstruction successful with {len(base_reconstruction.shots)} shots and "
                f"{len(base_reconstruction.points)} points.")

    # ====================== PASS 2: Registering outliers ======================
    logger.info("=== PASS 2: Registering outliers ===")

    # Expand memory mapping to include all isolated image assets
    data.images = lambda: [f for f in all_images if f in all_images]

    extract_metadata.run_dataset(data)
    detect_features.run_dataset(data)
    match_features.run_dataset(data)
    create_tracks.run_dataset(data)

    full_tracks_manager = data.load_tracks_manager()


    camera_priors = data.load_camera_models()   # Load once

    for image_id in outliers:
        if image_id in base_reconstruction.shots:
            continue

        logger.info(f"Registering {image_id} ...")
        try:
            success, _, report = reconstruction.resect(
                data,
                full_tracks_manager,
                base_reconstruction,
                image_id,
                threshold=8.0,
                min_inliers=config["reconstruction_min_inliers"]
            )

            if success:
                rig_camera_priors = {}

                reconstruction.bundle_local(
                    base_reconstruction,
                    camera_priors,
                    rig_camera_priors,
                    None,
                    image_id,
                    config
                )

                logger.info(f"    [+] Successfully registered {image_id}")
            else:
                logger.warning(f"    [-] Failed to register {image_id} (inliers too low)")
        except Exception as e:
            logger.error(f"    Error registering {image_id}: {e}")

    # ====================== PASS 3: Final refinement ======================
    logger.info("=== PASS 3: Final refinement ===")
    config["triangulation_threshold"] = 8.0

    # Retriangulate all points
    reconstruction.retriangulate(full_tracks_manager, base_reconstruction, config)

    # === FINAL CAMERA PRIORS SYNC (this fixes the unordered_map error) ===
    camera_priors = data.load_camera_models()
    print("Cameras in reconstruction:", list(base_reconstruction.cameras.keys()))
    print("Cameras in priors:", list(camera_priors.keys()))

    rig_camera_priors = {}

    missing = set(shot.camera.id for shot in base_reconstruction.shots.values()) - set(camera_priors.keys())
    logger.info(f"Missing camera models: {missing}")

    camera_priors = {
        cam_id: cam
        for cam_id, cam in data.load_camera_models().items()
        if cam_id in base_reconstruction.cameras
    }
    reconstruction.bundle(
        base_reconstruction,
        camera_priors,
        rig_camera_priors,
        None,
        config
    )

    data.save_reconstruction([base_reconstruction])
    logger.info(f"Multi-pass pipeline completed! Final: "
                f"{len(base_reconstruction.shots)} shots, {len(base_reconstruction.points)} points")

if __name__ == "__main__":
    run_multi_pass_pipeline()