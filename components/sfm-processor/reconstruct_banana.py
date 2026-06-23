import os
import sys
import shutil
import logging
from pathlib import Path

# Direct native imports from your local opensfm environment layout
from opensfm import dataset, reconstruction, tracking, features, types

# Configure internal tracing log outputs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OpenSfM-MultiPass")

def run_multi_pass_pipeline():
    # Setup working context path boundaries
    DATASET_PATH = "data/banana_project"
    IMAGES_DIR = os.path.join(DATASET_PATH, "images")
    STAGING_DIR = os.path.join(DATASET_PATH, "images_outliers_staging")
    
    # Instantiate OpenSfM's core configuration and file manager interfaces
    data = dataset.DataSet(DATASET_PATH)
    config = data.config
    
    # Define exact anchors based on your rembg PNG assets
    anchors = [
        "DSC_0423_isolated.png", 
        "DSC_0424_isolated.png", 
        "DSC_0426_isolated.png", 
        "DSC_0438_isolated.png"
    ]
    
    # Scan physical directory to find actual outliers present on disk
    all_physical_files = [f for f in os.listdir(IMAGES_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    outliers = [f for f in all_physical_files if f not in anchors]
    
    if not all_physical_files:
        logger.error(f"[-] No target images detected in dataset path: {IMAGES_DIR}")
        return

    # -------------------------------------------------------------------------
    # PASS 1: Anchor Core Extraction (Physical Isolation)
    # -------------------------------------------------------------------------
    logger.info("[!] Pass 1: Isolating core anchors on disk...")
    os.makedirs(STAGING_DIR, exist_ok=True)
    
    # Physically move outliers to staging so OpenSfM cannot see them yet
    for f in outliers:
        shutil.move(os.path.join(IMAGES_DIR, f), os.path.join(STAGING_DIR, f))
        
    logger.info(f"    -> Staged {len(outliers)} outlier images away from main workspace.")
    
    # Reload dataset context so OpenSfM registers only the 4 anchor images on disk
    data = dataset.DataSet(DATASET_PATH)
    
    logger.info("[*] Extracting features and matching anchor sets...")
    features.run_dataset(data)
    tracking.create_tracks_manager(data)
    tracks_manager = data.load_tracks_manager()
    
    # Run the core incremental reconstruction engine over anchors exclusively
    reconstructions = reconstruction.incremental_reconstruction(data, tracks_manager)
    
    if not reconstructions:
        logger.error("[-] Failed to establish a solid anchor ground plane. Restoring files...")
        # Emergency file restore before bailing
        for f in outliers:
            shutil.move(os.path.join(STAGING_DIR, f), os.path.join(IMAGES_DIR, f))
        return
        
    base_reconstruction = reconstructions[0]
    logger.info(f"[+] Baseline anchor established with {len(base_reconstruction.shots)} cameras.")

    # -------------------------------------------------------------------------
    # PASS 2: Outlier Angle Registration (Bring files back)
    # -------------------------------------------------------------------------
    logger.info("[!] Pass 2: Restoring outlier angles back into the tracking graph...")
    
    # Move the files back into the active images directory
    for f in outliers:
        shutil.move(os.path.join(STAGING_DIR, f), os.path.join(IMAGES_DIR, f))
    shutil.rmtree(STAGING_DIR)
    
    # Reload dataset a final time to register the complete 16-image pool
    data = dataset.DataSet(DATASET_PATH)
    
    # Extract features for just the newly added images, then rebuild complete track manager
    features.run_dataset(data)
    tracking.create_tracks_manager(data)
    full_tracks_manager = data.load_tracks_manager()

    # Configure parameters to freeze anchor structure during PnP registration loops
    config["bundle_refine_intrinsics"] = False
    config["reconstruction_min_inliers"] = 8  # Permissive floor to allow shifted tracking views
    
    for image_id in outliers:
        if image_id in base_reconstruction.shots:
            continue
            
        logger.info(f"[*] Running PnP resection registration for image: {image_id}")
        
        # Calculate 2D-3D intersections against the fixed anchor map coordinates
        reconstruction.reconstruct_shot(
            data,
            full_tracks_manager,
            base_reconstruction,
            image_id,
            min_inliers=config["reconstruction_min_inliers"]
        )
        
        if image_id in base_reconstruction.shots:
            logger.info(f"    [+] Image {image_id} successfully locked to trajectory matrix.")
            # Localized bundle adjustment to optimize the new alignment locally
            reconstruction.local_bundle_adjustment(
                data, full_tracks_manager, base_reconstruction, [image_id]
            )
        else:
            logger.warning(f"    [-] Image {image_id} could not meet registration thresholds. Skipped.")

    # -------------------------------------------------------------------------
    # PASS 3: Track Growth and Final Global Refinement
    # -------------------------------------------------------------------------
    logger.info("[!] Pass 3: Driving global track expansion to fill out the point cloud...")
    
    # Open up reprojection thresholds slightly to capture subtle peel features cleanly
    config["triangulation_threshold"] = 5.0  
    
    # Sweep along epipolar lines to connect remaining loose features
    reconstruction.triangulate_all(data, full_tracks_manager, base_reconstruction)
    
    # Run global optimization pass across all combined cameras and 3D paths
    reconstruction.bundle(data, full_tracks_manager, base_reconstruction)
    
    # Save output to standard OpenSfM JSON format
    data.save_reconstruction([base_reconstruction])
    logger.info("[+] Multi-pass point cloud tracking extraction loop complete.")

if __name__ == "__main__":
    run_multi_pass_pipeline()