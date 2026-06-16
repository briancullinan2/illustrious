#!/bin/bash
echo "🚀 Starting Juggernaut-Z GPU worker..."
export HOME=/root
cd /root

# Prevent frontend apt interactive prompts from hanging the installation loop
export DEBIAN_FRONTEND=noninteractive

cat << 'EOF' > /root/worker-agent.py
${agentScriptContent}
EOF

echo "⚡ Mounting model vault..."
mkdir -p /mnt/vault
mount -o ro /dev/disk/by-id/google-${CONFIG.MODEL_DISK_NAME} /mnt/vault

echo "🐍 Setting up Python packages..."
apt-get update && apt-get install -y python3-pip python3-venv

# Force update pip safely on Ubuntu environment
pip3 install --upgrade pip
pip3 install -U diffusers transformers trl peft bitsandbytes accelerate fastapi uvicorn pillow torch torchvision torchaudio python-multipart

#pip install bitsandbytes --extra-index-url https://jllllll.github.io/bitsandbytes-windows-webui

echo "📡 Starting background worker thread..."
python3 /root/worker-agent.py > /root/worker.log 2>&1 &
