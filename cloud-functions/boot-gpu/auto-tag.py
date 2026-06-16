import os
import piexif

MY_FACE_FOLDER = "./classified_faces/person_0" # Point this to your identified cluster folder

print("🏷️ Commencing local EXIF tag injection...")

for filename in os.listdir(MY_FACE_FOLDER):
    if filename.lower().endswith(('.jpg', '.jpeg')):
        file_path = os.path.join(MY_FACE_FOLDER, filename)
        try:
            exif_dict = piexif.load(file_path)
            
            # Inject tags into the UserComment metadata field (XPKeywords or ImageDescription slots work too)
            comment_bytes = "Tag: [Brian James Cullinan]".encode("utf-8")
            exif_dict["Exif"][piexif.ExifIFD.UserComment] = comment_bytes
            
            exif_bytes = piexif.dump(exif_dict)
            piexif.insert(exif_bytes, file_path)
        except Exception as e:
            print(f"⚠️ Could not tag {filename}: {e}")

print("🔒 Metadata injection locked natively to files.")