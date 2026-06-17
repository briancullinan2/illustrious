import os
import re
import json
from urllib.parse import unquote_plus
from datetime import datetime
from pathlib import Path
import argparse

# Path Configuration
LOGS_DIR = "chat_logs"
os.makedirs(LOGS_DIR, exist_ok=True)

# Regex Match Patterns for Session and Message structures
session_pattern = re.compile(r'<session\s+[^>]*time="(\d+)"[^>]*from="([^"]+)"')
message_pattern = re.compile(r'<message\s+type="([^"]+)"\s+time="(\d+)"[^>]*text="([^"]+)"')


    # 1. Update session pattern to support emails or spaces in names:
    # Pattern 1: Session Start (AIM - BrianJCullinan:KamiLPgirlie07): Tue Feb 03 15:17:20 2004
    # Pattern 2: Session Start (b.cullinan@cox.net:Christina Sanders): Thu Mar 09 23:07:36 2006
plain_session_pattern = re.compile(r'Session Start \((?:[^)]+? -\s+)?([^:]+):([^)]+)\):\s+(.*)')

# Match message styles with or without square bracket timestamps:
# Pattern 1: KamiLPgirlie07: hi
# Pattern 2: [03/09/2006 11:07 PM] Christina Sanders: oh my ...
plain_message_pattern = re.compile(r'^(?:\[[^\]]+\]\s+)?([^:\s*][^:]*?):\s+(.*)')


# Normalize your known handles for user role mapping
user_handles = {"brianjcullinan", "b.cullinan@cox.net", "me", "Brian Cullinan", "bjcullinan"}


def parse_plain_log_stream(raw_log_text):
    other_username = "unknown_user"
    current_session_ym = "unknown_date"
    
    

    # Extract meta information from the session tag
    for line in raw_log_text.splitlines():
        session_match = plain_session_pattern.search(line)
        if session_match:
            user_on_left = session_match.group(1).strip()
            user_on_right = session_match.group(2).strip()
            date_str = session_match.group(3).strip()
            
            # Identify counterparty username
            if user_on_left.lower() in user_handles:
                other_username = user_on_right
            else:
                other_username = user_on_left
                
            # Normalize filename spaces to avoid filesystem path escaping issues later
            other_username = other_username.replace(' ', '_')
                
            try:
                # Parse the standard header timestamp: "Thu Mar 09 23:07:36 2006"
                parsed_date = datetime.strptime(date_str, "%a %b %d %H:%M:%S %Y")
                current_session_ym = parsed_date.strftime("%Y-%m")
            except Exception:
                current_session_ym = "unknown_date"
            break

    # 2. Extract messages based on line prefixing
    raw_turns = []
    for line in raw_log_text.splitlines():
        line = line.strip()
        
        # Skip auto-responses or lines indicating actions/status changes
        if line.startswith("***") or line.startswith("Session"):
            continue
            
        msg_match = plain_message_pattern.search(line)
        if msg_match:
            sender = msg_match.group(1).strip()
            text = msg_match.group(2).strip()
            
            role = "user" if sender.lower() in user_handles else "assistant"
            raw_turns.append({"role": role, "content": text, "ym": current_session_ym})

    # 3. Group raw turns by their year-month bucket
    monthly_turns = {}
    for turn in raw_turns:
        ym = turn["ym"]
        if ym not in monthly_turns:
            monthly_turns[ym] = []
        monthly_turns[ym].append(turn)

    # 4. Process each month bucket independently
    for ym, turns in monthly_turns.items():
        dataset_additions = []
        current_user_text = []

        # Smart pairing logic applied inside the isolated month cluster
        for turn in turns:
            if turn["role"] == "user":
                current_user_text.append(turn["content"])
            elif turn["role"] == "assistant":
                if current_user_text:
                    combined_user_prompt = " ".join(current_user_text)
                    dataset_additions.append({
                        "messages": [
                            {"role": "user", "content": combined_user_prompt},
                            {"role": "assistant", "content": turn["content"]}
                        ]
                    })
                    current_user_text = []

        if not dataset_additions:
            continue

        # 5. Prevent stomping: Read existing file content if it exists, then combine
        output_filename = f"{ym}-{other_username}.json"
        output_path = os.path.join(LOGS_DIR, output_filename)
        
        existing_dataset = []
        if os.path.exists(output_path):
            try:
                with open(output_path, "r", encoding="utf-8") as f:
                    existing_dataset = json.load(f)
                    if not isinstance(existing_dataset, list):
                        existing_dataset = []
            except Exception:
                existing_dataset = []

        # Append new records to the old records
        final_dataset = existing_dataset + dataset_additions

        # Save out the combined records
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(final_dataset, f, indent=2, ensure_ascii=False)
            
        print(f"📂 [{ym}] Appended {len(dataset_additions)} samples -> {output_path} (Total: {len(final_dataset)})")

def parse_raw_log_stream(raw_log_text):
    other_username = "unknown_user"
    
    # 1. Extract and resolve the counterparty from the session tag using global user_handles
    for line in raw_log_text.splitlines():
        session_match = session_pattern.search(line)
        if session_match:
            from_match = re.search(r'from="([^"]+)"', line)
            to_match = re.search(r'to="([^"]+)"', line)
            
            if from_match and to_match:
                user_from = unquote_plus(from_match.group(1))
                user_to = unquote_plus(to_match.group(1))
                
                # Check which side matches your global user_handles collection
                if user_from.lower() in user_handles or user_from.split('@')[0].lower() in user_handles:
                    counterparty = user_to
                else:
                    counterparty = user_from
                
                # Clean up email domains and spaces for the filename
                other_username = counterparty.split('@')[0].replace(' ', '_').replace('.', '_')
            break

    # 2. Extract messages along with their specific YYYY-MM buckets
    raw_turns = []
    for line in raw_log_text.splitlines():
        msg_match = message_pattern.search(line)
        if msg_match:
            msg_type = msg_match.group(1)
            timestamp = int(msg_match.group(2))
            text = unquote_plus(msg_match.group(3))
            
            # Extract year-month directly from this specific message timestamp
            msg_ym = datetime.fromtimestamp(timestamp).strftime("%Y-%m")
            role = "user" if "outgoing" in msg_type else "assistant"
            
            raw_turns.append({"role": role, "content": text, "ym": msg_ym})

    # 3. Group raw turns by their year-month bucket
    monthly_turns = {}
    for turn in raw_turns:
        ym = turn["ym"]
        if ym not in monthly_turns:
            monthly_turns[ym] = []
        monthly_turns[ym].append(turn)

    # 4. Process each month bucket independently
    for ym, turns in monthly_turns.items():
        dataset_additions = []
        current_user_text = []

        # Smart pairing logic applied inside the isolated month cluster
        for turn in turns:
            if turn["role"] == "user":
                current_user_text.append(turn["content"])
            elif turn["role"] == "assistant":
                if current_user_text:
                    combined_user_prompt = " ".join(current_user_text)
                    dataset_additions.append({
                        "messages": [
                            {"role": "user", "content": combined_user_prompt},
                            {"role": "assistant", "content": turn["content"]}
                        ]
                    })
                    current_user_text = []

        if not dataset_additions:
            continue

        # 5. Prevent stomping: Read existing file content if it exists, then combine
        output_filename = f"{ym}-{other_username}.json"
        output_path = os.path.join(LOGS_DIR, output_filename)
        
        existing_dataset = []
        if os.path.exists(output_path):
            try:
                with open(output_path, "r", encoding="utf-8") as f:
                    existing_dataset = json.load(f)
                    if not isinstance(existing_dataset, list):
                        existing_dataset = []
            except Exception:
                existing_dataset = []

        # Append new records to the old records
        final_dataset = existing_dataset + dataset_additions

        # Save out the combined records
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(final_dataset, f, indent=2, ensure_ascii=False)
            
        print(f"📂 [{ym}] Appended {len(dataset_additions)} samples -> {output_path} (Total: {len(final_dataset)})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Illustrious LoRA Alignment Training CLI")
    
    parser.add_argument(
        "--logfile", 
        type=str, 
        default="~/Documents/Collections/conversations/Trillian/logs/MSN/Query/arcadiaz04@gmail.com.xml",
        help="Chat log path"
    )
    
    args = parser.parse_args()
    
    # Clean up common terminal autocomplete artifacts (like literal quotes) before expanding the path
    clean_path_str = args.logfile.strip().strip("'\"")
    target_log = Path(clean_path_str).expanduser()

    print(f"📂 Verifying source log profile: {target_log}")

    if not target_log.exists():
        print(f"❌ Error: Target log file does not exist at '{target_log}'")
        print("💡 Please double-check the file path or provide an alternate location via the --logfile argument.")
        exit(1)

    try:
        with open(target_log, "r", encoding="utf-8") as file:
            raw_log_content = file.read()
    except PermissionError:
        print(f"❌ Error: Permission denied when attempting to read '{target_log}'")
        exit(1)
    except Exception as e:
        print(f"❌ Error: Failed to read file data due to an unexpected exception: {e}")
        exit(1)

    # Route content to the correct parser based on the file extension suffix
    file_extension = target_log.suffix.lower()
    if file_extension == ".log":
        parse_plain_log_stream(raw_log_content)
    else:
        # Default fallback to legacy xml structure parser
        parse_raw_log_stream(raw_log_content)