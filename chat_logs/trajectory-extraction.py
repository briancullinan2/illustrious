def create_sequence_training_pair(cleaned_profile):
    exp = cleaned_profile.get("experience", [])
    
    # We need at least 2 roles to make a historical prediction sequence
    if len(exp) < 2:
        return None
        
    # Mask the latest job (Target output)
    target_next_step = exp[0]
    
    # Keep the entire historical timeline leading up to it (Input sequence)
    historical_past = exp[1:]
    
    # Format the training text block
    history_lines = []
    for job in reversed(historical_past): # Reverse so it reads chronologically
        history_lines.append(f"- {job['role']} at {job['company']} ({job['duration']})")
        
    user_prompt = (
        f"Analyze this professional career trajectory and predict the next logical position level, "
        f"approximate target location, and target company profile:\n"
        f"Education: {cleaned_profile.get('education', 'N/A')}\n"
        f"History:\n" + "\n".join(history_lines)
    )
    
    assistant_response = (
        f"Predicted Next Transition:\n"
        f"- Role: {target_next_step['role']}\n"
        f"- Target Entity: {target_next_step['company']}\n"
        f"- Expected Duration/Tenure: {target_next_step['duration']}\n"
        f"- Geographic Focus: {target_next_step['location']}"
    )
    
    return {
        "messages": [
            {"role": "user", "content": user_prompt},
            {"role": "assistant", "content": assistant_response}
        ]
    }