import os
import glob
import cv2
import numpy as np
import torch
#from segment_anything import sam_model_registry, SamPredictor
from PIL import Image
from rembg import remove, new_session

# Performance adjustments for local CPU threading execution
os.environ["OMP_NUM_THREADS"] = "4"
os.environ["MKL_NUM_THREADS"] = "4"
torch.set_num_threads(4)

# Global tuning knobs for fine alignment adjustments
CONFIG = {
    'max_side': 1024,                # Encoder proxy frame scaling cap
    'bbox_pad_pct': 0.05,            # Bounding box margin (0.05 = outer 5% is marked background)
    'center_sample_radius_pct': 0.1, # Central foreground tracking cluster width
    'negative_margin_pct': 0.02,     # How deep into the margins to lock background markers
    'morph_kernel_size': 5,          # Mask refinement dilation width
    'multimask_layer_idx': -1        # -1 forces dynamic score checking; 0, 1, 2 locks SAM depths
}




def remove_background_fast(image_path, output_dir, predictor):
    bgr_img = cv2.imread(image_path)
    if bgr_img is None:
        print(f"[-] Skipping unreadable file: {image_path}")
        return

    h, w, _ = bgr_img.shape
    file_name = os.path.basename(image_path)
    print(f"\n[+] Processing image: {file_name} ({w}x{h})")

    # 1. Image Downscaling Proxy
    scale = CONFIG['max_side'] / max(h, w)
    if scale < 1.0:
        proxy_w, proxy_h = int(w * scale), int(h * scale)
        proxy_img = cv2.resize(bgr_img, (proxy_w, proxy_h), interpolation=cv2.INTER_AREA)
    else:
        proxy_img = bgr_img.copy()
        scale = 1.0

    rgb_proxy = cv2.cvtColor(proxy_img, cv2.COLOR_BGR2RGB)
    predictor.set_image(rgb_proxy)

    # 2. Constraints Setup
    pad_w = int(w * CONFIG['bbox_pad_pct'])
    pad_h = int(h * CONFIG['bbox_pad_pct'])
    bbox = np.array([pad_w, pad_h, w - pad_w, h - pad_h])

    cx, cy = int(w / 2), int(h / 2)
    rx = int(w * CONFIG['center_sample_radius_pct'])
    ry = int(h * CONFIG['center_sample_radius_pct'])
    
    fg_points = [
        [cx, cy], [cx - rx, cy], [cx + rx, cy], [cx, cy - ry], [cx, cy + ry]
    ]
    fg_labels = [1] * len(fg_points)

    margin_w = int(w * CONFIG['negative_margin_pct'])
    margin_h = int(h * CONFIG['negative_margin_pct'])
    bg_points = [
        [margin_w, margin_h], [w - margin_w, margin_h],
        [margin_w, h - margin_h], [w - margin_w, h - margin_h]
    ]
    bg_labels = [0] * len(bg_points)

    combined_points = np.array(fg_points + bg_points, dtype=np.float32) * scale
    combined_labels = np.array(fg_labels + bg_labels, dtype=np.int32)
    scaled_bbox = bbox * scale

    # 3. Predict Passing
    masks, scores, _ = predictor.predict(
        point_coords=combined_points,
        point_labels=combined_labels,
        box=scaled_bbox[None, :],
        multimask_output=True
    )

    if masks is None or len(masks) == 0:
        print(f"    [-] Detection failed for {file_name}")
        return

    # CRITICAL FIX 1: Lock to Layer 2 (Whole Object Scale) instead of Layer 0 (Sub-component Detail)
    # This prevents SAM from capturing only a single banana or splitting on shadows
    print(f"    -> SAM Layer Scores: [Layer 0: {scores[0]:.3f}, Layer 1: {scores[1]:.3f}, Layer 2: {scores[2]:.3f}]")
    print("    -> Overriding dynamic selection. Forcing Layer 2 (Whole Object)")
    low_res_mask = masks[2].astype(np.uint8) * 255

    # 4. CRITICAL FIX 2: High-Resolution Mask Edge Refinement
    # Upscale smoothly with linear interpolation rather than nearest neighbor to avoid aliasing
    if scale < 1.0:
        high_res_mask_gray = cv2.resize(low_res_mask, (w, h), interpolation=cv2.INTER_LINEAR)
    else:
        high_res_mask_gray = low_res_mask

    # Binarize the interpolation gradient
    _, object_mask = cv2.threshold(high_res_mask_gray, 127, 255, cv2.THRESH_BINARY)

    # Clean up stray boundary fuzz by keeping only the largest connected region inside the mask
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(object_mask)
    if num_labels > 1:
        # Index 0 is background, find max area component from the rest
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        object_mask = np.where(labels == largest_label, 255, 0).astype(np.uint8)

    # Morphological clean pass to solidify holes and tighten skin boundaries
    k_size = CONFIG['morph_kernel_size']
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (k_size, k_size))
    object_mask = cv2.morphologyEx(object_mask, cv2.MORPH_CLOSE, kernel)

    # 5. Pack Alpha Matrix Output
    rgba_out = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2BGRA)
    rgba_out[:, :, 3] = object_mask

    base_name = os.path.splitext(file_name)[0]
    out_path = os.path.join(output_dir, f"{base_name}_isolated.png")
    cv2.imwrite(out_path, rgba_out)
    print(f"    [+] Saved clean isolated image asset to: {out_path}")



def remove_background_faster(image_path, output_dir, predictor):
    bgr_img = cv2.imread(image_path)
    if bgr_img is None:
        print(f"[-] Skipping unreadable file: {image_path}")
        return

    h, w, _ = bgr_img.shape
    file_name = os.path.basename(image_path)
    print(f"\n[+] Processing image: {file_name} ({w}x{h})")

    # 1. Image Downscaling Proxy
    scale = CONFIG['max_side'] / max(h, w)
    if scale < 1.0:
        proxy_w, proxy_h = int(w * scale), int(h * scale)
        proxy_img = cv2.resize(bgr_img, (proxy_w, proxy_h), interpolation=cv2.INTER_AREA)
    else:
        proxy_img = bgr_img.copy()
        scale = 1.0

    rgb_proxy = cv2.cvtColor(proxy_img, cv2.COLOR_BGR2RGB)
    predictor.set_image(rgb_proxy)

    # 2. Constraints Setup
    pad_w = int(w * CONFIG['bbox_pad_pct'])
    pad_h = int(h * CONFIG['bbox_pad_pct'])
    bbox = np.array([pad_w, pad_h, w - pad_w, h - pad_h])

    cx, cy = int(w / 2), int(h / 2)
    rx = int(w * CONFIG['center_sample_radius_pct'])
    ry = int(h * CONFIG['center_sample_radius_pct'])
    
    # Base foreground distribution
    fg_points = [
        [cx, cy], [cx - rx, cy], [cx + rx, cy], [cx, cy - ry], [cx, cy + ry]
    ]

    # STRENGHTEN STEM ANCHORING:
    # Based on standard presentation layout, the brown stalk or crown cluster 
    # typically projects upward or toward the top-right quadrant. We sample 
    # an explicit foreground coordinate offset targeting this region.
    stem_x = int(w * 0.72)
    stem_y = int(h * 0.22)
    fg_points.append([stem_x, stem_y])

    fg_labels = [1] * len(fg_points)

    margin_w = int(w * CONFIG['negative_margin_pct'])
    margin_h = int(h * CONFIG['negative_margin_pct'])
    bg_points = [
        [margin_w, margin_h], [w - margin_w, margin_h],
        [margin_w, h - margin_h], [w - margin_w, h - margin_h]
    ]
    bg_labels = [0] * len(bg_points)

    combined_points = np.array(fg_points + bg_points, dtype=np.float32) * scale
    combined_labels = np.array(fg_labels + bg_labels, dtype=np.int32)
    scaled_bbox = bbox * scale

    print(f"    -> Constraints: {len(fg_points)} FG (incl. stem anchor), {len(bg_points)} BG.")

    # 3. Predict Passing
    masks, scores, _ = predictor.predict(
        point_coords=combined_points,
        point_labels=combined_labels,
        box=scaled_bbox[None, :],
        multimask_output=True
    )

    if masks is None or len(masks) == 0:
        print(f"    [-] Detection failed for {file_name}")
        return

    # Keep whole object level layer
    low_res_mask = masks[2].astype(np.uint8) * 255

    # 4. High-Resolution Mask Edge Refinement
    if scale < 1.0:
        high_res_mask_gray = cv2.resize(low_res_mask, (w, h), interpolation=cv2.INTER_LINEAR)
    else:
        high_res_mask_gray = low_res_mask

    _, object_mask = cv2.threshold(high_res_mask_gray, 127, 255, cv2.THRESH_BINARY)

    # Clean stray fragments by forcing unified single largest contiguous shape
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(object_mask)
    if num_labels > 1:
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        object_mask = np.where(labels == largest_label, 255, 0).astype(np.uint8)

    # Closing morphology pass
    k_size = CONFIG['morph_kernel_size']
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (k_size, k_size))
    object_mask = cv2.morphologyEx(object_mask, cv2.MORPH_CLOSE, kernel)

    # 5. Pack Alpha Matrix Output
    rgba_out = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2BGRA)
    rgba_out[:, :, 3] = object_mask

    base_name = os.path.splitext(file_name)[0]
    out_path = os.path.join(output_dir, f"{base_name}_isolated.png")
    cv2.imwrite(out_path, rgba_out)
    print(f"    [+] Saved clean isolated image asset to: {out_path}")


def remove_background_auto(image_path, output_dir, mask_generator):
    # Load image via OpenCV
    bgr_img = cv2.imread(image_path)
    if bgr_img is None:
        print(f"Skipping unreadable file: {image_path}")
        return

    # Convert to RGB for SAM transformer encoder input
    rgb_img = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2RGB)
    
    print(f"Slicing layers for {os.path.basename(image_path)}...")
    # Generate automatic slice predictions across the point grid
    masks = mask_generator.generate(rgb_img)
    
    if not masks:
        print("No structural components segmented.")
        return

    # Sort masks by area size descending
    # Often the background floor texture or carpet occupies the maximum area
    sorted_masks = sorted(masks, key=lambda x: x['area'], reverse=True)
    
    # Initialize an empty canvas mask matching the image matrix dimensions
    h, w, _ = bgr_img.shape
    object_mask = np.zeros((h, w), dtype=np.uint8)

    # For general foreground extraction, we skip the largest background slice 
    # and combine the remaining sub-component segments (the object partitions)
    for ann in sorted_masks[1:]:
        segmentation = ann['segmentation']
        object_mask[segmentation] = 255

    # Refine mask edges slightly to clear up stray point-grid pixel artifacts
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    object_mask = cv2.morphologyEx(object_mask, cv2.MORPH_CLOSE, kernel)

    # Build the transparent 4-channel output matrix
    rgba_out = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2BGRA)
    rgba_out[:, :, 3] = object_mask

    # Save transparent png asset
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    out_path = os.path.join(output_dir, f"{base_name}_isolated.png")
    cv2.imwrite(out_path, rgba_out)
    print(f"Saved extracted target to: {out_path}")



def remove_background_saliency(image_path, output_dir, session):
    file_name = os.path.basename(image_path)
    print(f"[+] Isolating subject via Saliency Matte: {file_name}")

    # Load image using PIL to match rembg interface natively
    try:
        input_img = Image.open(image_path)
    except Exception as e:
        print(f"    [-] Skipping unreadable file: {image_path} ({e})")
        return

    # Execute the background removal pass
    # alpha_matting flags force high-res boundary refinement around fuzzy edges
    output_rgba = remove(
        input_img,
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=10
    )

    # Convert the PIL RGBA result back to a standard NumPy array for OpenCV writing
    rgba_mat = np.array(output_rgba)
    
    # Flip from RGB to standard BGR pixel footprint for cv2 compatibility
    bgr_out = cv2.cvtColor(rgba_mat, cv2.COLOR_RGBA2BGRA)

    base_name = os.path.splitext(file_name)[0]
    out_path = os.path.join(output_dir, f"{base_name}_isolated.png")
    
    # Save transparent asset
    cv2.imwrite(out_path, bgr_out)
    print(f"    [+] Clean subject saved to: {out_path}")

def main():
    # Model target definitions - 'u2net' matches the automatic1111 baseline standard
    MODEL_NAME = "u2net"
    INPUT_PATTERN = r"C:\Users\megam\Pictures\dataset_banana-master\images\DSC_*.JPG" 
    OUTPUT_DIR = r"C:\Users\megam\Pictures\dataset_banana-master\isolated_output"

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Initialize the model worker session 
    # On first run, this automatically handles fetching the ~170MB model weight asset safely
    print(f"[!] Initializing {MODEL_NAME} background extraction worker context...")
    session = new_session(MODEL_NAME)

    image_files = glob.glob(INPUT_PATTERN)
    print(f"[!] Found {len(image_files)} asset candidates matching criteria.")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Initializing SAM Execution context on device: {device}")

    #sam = sam_model_registry[MODEL_TYPE](checkpoint=CHECKPOINT_PATH)
    #sam.to(device=device)
    #predictor = SamPredictor(sam)

    #for path in image_files:
    #    remove_background_faster(path, OUTPUT_DIR, predictor)

    for path in image_files:
        remove_background_saliency(path, OUTPUT_DIR, session)


if __name__ == "__main__":
    main()