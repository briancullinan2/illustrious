
import json
import os
import stat
import shutil
import argparse
import pandas as pd
import objaverse.xl as oxl
from typing import Dict, Any, Hashable, List
import re
import pyarrow as pa
import pyarrow.parquet as pq


# --- Windows Permission Error Fix ---
def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)

_original_rmtree = shutil.rmtree
def patched_rmtree(path, *args, **kwargs):
    if "onerror" not in kwargs and "onexc" not in kwargs:
        kwargs["onerror"] = remove_readonly
    return _original_rmtree(path, *args, **kwargs)
shutil.rmtree = patched_rmtree
# -------------------------------------

# Explicit directories
CACHE_DIR = os.path.expanduser("~/.objaverse")                    # Parquet + GitHub cache
EXPORT_DIR = os.path.expanduser("~/.objaverse/downloads")         # Your clean copies
GITHUB_REPOS_DIR = os.path.join(CACHE_DIR, "github", "repos")     # Where full repos land

os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)
os.makedirs(GITHUB_REPOS_DIR, exist_ok=True)

def handle_found_object(
    local_path: str,
    file_identifier: str,
    sha256: str,
    metadata: Dict[Hashable, Any]
) -> None:
    """Called when a matching object is found (runs in worker processes)."""
    base_name = os.path.basename(file_identifier) or f"{sha256}.glb"
    destination = os.path.join(EXPORT_DIR, base_name)
    
    try:
        shutil.copy2(local_path, destination)
        print(f"💾 [EXPORTED] {base_name} -> {destination}")
    except Exception as e:
        print(f"❌ Copy failed for {base_name}: {e}")


def get_annotations_df(github: bool = True, gltf: bool = False, thingiverse: bool = False, smithsonian: bool = False) -> pd.DataFrame:
    """Centralized loader that profiles the dataframe to audit loaded domains and formats."""
    print(f"📦 Loading Objaverse Parquet Registries (cache: {CACHE_DIR})...")
    
    # 1. Load the data matrix
    df = oxl.get_annotations(download_dir=CACHE_DIR)
    
    # 2. Print an explicit structural audit of what's sitting in memory
    print("\n📊 --- LOCAL CACHE PERFORMANCE AUDIT ---")
    print(f"Total entries loaded into master index frame: {len(df):,}")
    
    # --- NEW: PARQUET FILE SCHEMA DUMP ---
    print("\n🗂️ Complete Parquet Column Schema & Data Types:")
    for col, dtype in df.dtypes.items():
        print(f"  • {col:<18} : {dtype}")
    # -------------------------------------
    
    print("\nSource Domain Inventory Matrix:")
    for source_name, count in df["source"].value_counts().items():
        print(f"  • {source_name:<15} : {count:,} records")
        
    print("\nTop 5 Available File Extension Layouts in Index:")
    for ext_name, count in df["fileType"].value_counts().head(5).items():
        print(f"  • {str(ext_name).upper():<15} : {count:,} records")
    print("-----------------------------------------\n")
    
    # 3. Map your custom CLI flags to the string names inside the "source" column
    allowed_sources = []
    if github:      allowed_sources.append("github")
    if gltf:        allowed_sources.append("sketchfab")
    if thingiverse: allowed_sources.append("thingiverse")
    if smithsonian: allowed_sources.append("smithsonian")
    
    if allowed_sources:
        print(f"🎛️  Filtering dataset rows for selected sources: {allowed_sources}")
        df = df[df["source"].isin(allowed_sources)]
    else:
        print("⚠️ No sources explicitly enabled via CLI. Defaulting to all sources.")
        
    return df


def list_assets(keyword: str, args):
    """Parses and lists matching records along with direct source URLs and metadata."""
    annotations = get_annotations_df(
        github=args.github,
        gltf=args.gltf,
        thingiverse=args.thingiverse,
        smithsonian=args.smithsonian
    )
    print(f"🔍 Searching {len(annotations):,} records for '{keyword}'...")
    
    keyword_mask = (
        annotations["fileIdentifier"].str.contains(keyword, case=False, na=False) |
        annotations["metadata"].astype(str).str.contains(keyword, case=False, na=False)
    )
    filtered_df = annotations[keyword_mask]
    
    print(f"\n🔗 TARGET ASSETS WITH METADATA (Showing Top 20 of {len(filtered_df):,} Matches):")
    for idx, row in filtered_df.head(20).iterrows():
        source = row['source']
        identifier = row['fileIdentifier']
        
        # Build the source URI
        if source == 'github':
            clean_id = identifier.replace("https://github.com/", "").lstrip('/')
            url = f"https://github.com/{clean_id}"
        elif source == 'sketchfab':
            url = f"https://sketchfab.com/3d-models/{identifier}"
        else:
            url = f"{source.title()} ID: {identifier}"
            
        print(f"\n🏷️  [{source.upper()}] {url}")
        
        # --- NEW: PARSE AND PRINT ANY ADDITIONAL KEYWORDS AND METADATA ---
        # Look for other common columns available in the Objaverse schema
        for optional_col in ['sha', 'repo', 'license', 'fileType', 
                             'source', 'fileIdentifier', 'sha', 'repo', 
                             'search_tags', 'clean_ext']:
            if optional_col in row and pd.notna(row[optional_col]):
                print(f"    • {optional_col}: {row[optional_col]}")
                
        # Unpack the raw JSON metadata field to capture deep keywords/tags
        raw_metadata = row.get('metadata', None)
        if pd.notna(raw_metadata) and raw_metadata != "":
            try:
                # If it's a stringified JSON representation, parse it cleanly
                if isinstance(raw_metadata, str):
                    meta_dict = json.loads(raw_metadata)
                else:
                    meta_dict = raw_metadata
                
                # Format and isolate nested dictionary fields beautifully
                meta_json = json.dumps(meta_dict, indent=6)
                print(f"    • metadata:\n{meta_json}")
            except Exception:
                print(f"    • metadata (raw text): {raw_metadata}")
        # -----------------------------------------------------------------
        print("-" * 60)




def clean_and_tokenize(df: pd.DataFrame) -> pd.DataFrame:
    print("🛠️ Sanitizing file paths and building semantic keyword tokens...")
    
    # 1. Isolate the actual file names or path segments
    # Splitting by slashes and picking up meaningful text tokens
    def extract_keywords(row):
        path_str = str(row['fileIdentifier'])
        
        # Pull out everything that looks like a word from the path
        # This replaces underscores, dashes, and slashes with spaces
        tokens = re.findall(re.compile(r'[a-zA-Z]{3,}'), path_str)
        
        # Filter out useless structural junk words from paths and links
        junk_words = {
            'https', 'github', 'com', 'blob', 'main', 'master', 'assets', 
            'resources', 'models', 'mesh', 'meshes', 'thingiverse', 'thing', 
            'files', 'fileid', 'raw', 'user', 'repo', 'production', 'download',
            'stl', 'glb', 'fbx', 'obj', 'ply'
        }
        
        # Lowercase everything and deduplicate
        clean_tokens = [t.lower() for t in tokens if t.lower() not in junk_words]
        
        # Return as a clean comma-separated string for easy SQL 'LIKE' matches
        return ",".join(set(clean_tokens))

    # Apply the parser across your dataframe matrix
    df['search_tags'] = df.apply(extract_keywords, axis=1)
    
    # 2. Extract clean file extension variants for quick layout engine filtering
    df['clean_ext'] = df['fileType'].astype(str).str.lower()
    
    return df

# --- Usage in your build step ---
# df = oxl.get_annotations(download_dir=CACHE_DIR)
# df_cleaned = clean_and_tokenize(df)
#
# # Drop the bulky original columns you don't need in the browser to save space!
# df_final = df_cleaned[['source', 'fileIdentifier', 'sha', 'repo', 'search_tags', 'clean_ext']]
#
# # Write out a clean, optimized Parquet file for your browser engine
# table = pa.Table.from_pandas(df_final)
# pq.write_table(table, "illustrious_index.parquet", row_group_size=50000, compression="ZSTD")




def download_assets(keyword: str, sample_count: int, args, format_filter: str = "glb"):
    """Isolates and executes the asset download pipeline."""
    annotations = get_annotations_df(
        github=args.github,
        gltf=args.gltf,
        thingiverse=args.thingiverse,
        smithsonian=args.smithsonian
    )
    
    keyword_mask = (
        annotations["fileIdentifier"].str.contains(keyword, case=False, na=False) |
        annotations["metadata"].astype(str).str.contains(keyword, case=False, na=False)
    )
    filtered_df = annotations[keyword_mask]

    if format_filter:
        filtered_df = filtered_df[filtered_df["fileType"] == format_filter.lower()]
        print(f"🎯 Found {len(filtered_df):,} matching {format_filter.upper()} assets.")
    else:
        print(f"🎯 Found {len(filtered_df):,} matching all assets.")
    
    if len(filtered_df) == 0:
        return

    download_queue = filtered_df.sample(min(sample_count, match_count)).copy().reset_index(drop=True)
    print(f"📥 Downloading {len(download_queue)} assets...")
    
    # Force process=1 context synchronization for Windows process boundaries
    oxl.download_objects(
        objects=download_queue,
        download_dir=CACHE_DIR,
        handle_found_object=handle_found_object,
        save_repo_format="files",
        processes=1
    )
    
    print("\n✨ --- DOWNLOAD SUMMARY ---")
    exported = [f for f in os.listdir(EXPORT_DIR) if f.endswith(('.glb', '.obj', '.gltf', '.fbx'))]
    if exported:
        print(f"✅ Exported {len(exported)} files to: {EXPORT_DIR}")
        for f in sorted(exported)[:10]:
            print(f"   • {f}")
    else:
        print("⚠️ No files exported to downloads/ folder.")



def enumerate_and_curate(extensions: List[str]):
    """
    Scans the entire database in memory to profile extensions and filter out specific assets,
    bypassing repository cloning for target extraction.
    """
    annotations = get_annotations_df()
    print(f"🛠️  Enumerating global database for extensions: {extensions}")
    
    # Normalize extensions to lowercase
    extensions = [ext.lower().lstrip('.') for ext in extensions]
    
    # Direct vectorized filtering across the fileType Series
    curated_mask = annotations["fileType"].str.lower().isin(extensions)
    curated_df = annotations[curated_mask]
    
    print(f"\n📊 --- GLOBAL CURATION SUMMARY ---")
    print(f"Total matching elements found in index: {len(curated_df):,}")
    print("\nBreakdown by Source Domain:")
    print(curated_df["source"].value_counts().to_string())
    print("\nBreakdown by Format Extension:")
    print(curated_df["fileType"].value_counts().to_string())
    
    # Save index reference locally to prevent re-parsing 9.7M rows later
    manifest_path = os.path.join(CACHE_DIR, "curated_manifest.csv")
    curated_df[["fileIdentifier", "source", "fileType", "sha256"]].to_csv(manifest_path, index=False)
    print(f"\n💾 Saved filtered layout index to local disk: {manifest_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Objaverse-XL Structural Curation Toolkit")
    
    # Mutually exclusive controls for operations targeting distinct task execution paths
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--query", type=str, help="Search the index and output direct component URLs")
    group.add_argument("--download", type=str, help="Search the index and execute the multi-process download sequence")
    group.add_argument("--enumerate-exts", type=str, help="Comma-separated format extensions to map globally (e.g., fbx,obj,glb)")

    parser.add_argument("--limit", type=int, default=2, help="Maximum items to download from the match pool")
    parser.add_argument("--format", type=str, default=None, help="File layout extension restriction")
    
    parser.add_argument("--github", type=lambda x: (str(x).lower() == 'true'), default=True, help="Include GitHub source targets (True/False)")
    parser.add_argument("--gltf", type=lambda x: (str(x).lower() == 'true'), default=False, help="Include Sketchfab / GLTF source targets (True/False)")
    parser.add_argument("--thingiverse", type=lambda x: (str(x).lower() == 'true'), default=False, help="Include Thingiverse source targets (True/False)")
    parser.add_argument("--smithsonian", type=lambda x: (str(x).lower() == 'true'), default=False, help="Include Smithsonian source targets (True/False)")

    args = parser.parse_args()
    
    if args.query:
        list_assets(keyword=args.query, args=args)
    elif args.download:
        download_assets(keyword=args.download, sample_count=args.limit, args=args, format_filter=args.format)
    elif args.enumerate_exts:
        ext_list = [e.strip() for e in args.enumerate_exts.split(",")]
        enumerate_and_curate(extensions=ext_list)