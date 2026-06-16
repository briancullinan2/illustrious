import os
import shutil
from deepface import DeepFace
from sklearn.cluster import DBSCAN
import numpy as np
import cv2

IMAGE_DIR = "./my_raw_photos"
OUTPUT_DIR = "./classified_faces"
os.makedirs(OUTPUT_DIR, exist_ok=True)

image_paths = [os.path.join(IMAGE_DIR, f) for f in os.listdir(IMAGE_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
face_embeddings = []
valid_metadata = []

print(f"👁️ Scanning {len(image_paths)} files for faces...")

for path in image_paths:
    try:
        # Detects, aligns, and extracts facial features in one pass
        embeddings_data = DeepFace.represent(img_path=path, model_name="VGG-Face", detector_backend="opencv", enforce_detection=True)
        
        for face_info in embeddings_data:
            face_embeddings.append(face_info["embedding"])
            valid_metadata.append({
                "source_path": path,
                "facial_area": face_info["facial_area"] # [x, y, w, h] box dimensions
            })
    except Exception:
        # Skips images with no faces detected or poor lighting conditions
        continue

# Cluster the faces using standard density algorithms (DBSCAN groups similar items without needing a fixed guess)
print("🧮 Grouping identical identities together...")
X = np.array(face_embeddings)
clustering = DBSCAN(eps=0.3, min_samples=3, metric="cosine").fit(X)

# Copy source images into classified identity buckets
for idx, label in enumerate(clustering.labels_):
    cluster_folder = os.path.join(OUTPUT_DIR, f"person_{label}")
    os.makedirs(cluster_folder, exist_ok=True)
    
    # Optional: Crop the exact face box using OpenCV if you want isolated portraits
    meta = valid_metadata[idx]
    shutil.copy(meta["source_path"], cluster_folder)

print("🎯 Face isolation complete. Check './classified_faces' for your identity folders!")