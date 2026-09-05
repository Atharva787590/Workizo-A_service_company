#!/usr/bin/env bash
# ==============================================================================
# UNNATI Automated VPS Provisioning & Deployment Script (SIH 2026)
# Usage: ./scripts/deploy_vps.sh <VPS_IP> [SSH_KEY_PATH]
# Target: Ubuntu 22.04 / 24.04 (Oracle Cloud Always Free, DigitalOcean, etc.)
# ==============================================================================

set -euo pipefail

VPS_IP="${1:-}"
SSH_KEY="${2:-$HOME/.ssh/id_ed25519}"

if [ -z "$VPS_IP" ]; then
    echo "ERROR: Missing VPS IP address."
    echo "Usage: $0 <VPS_IP> [SSH_KEY_PATH]"
    exit 1
fi

echo "=================================================================="
echo "  UNNATI Automated Deployment to VPS: $VPS_IP"
echo "=================================================================="

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"
if [ -f "$SSH_KEY" ]; then
    SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
fi

# Step 1: Remote System Configuration (Docker + UFW + Swap)
echo "==> [1/5] Configuring Ubuntu packages, Docker Engine, and Swap on VPS..."
ssh $SSH_OPTS "root@$VPS_IP" bash -s << 'EOF'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# Update apt cache
apt-get update -y

# Configure 2GB Swap if not present
if [ ! -f /swapfile ]; then
    echo "Creating 2GB swapfile..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

# Install Docker and Compose plugin if missing
if ! command -v docker &>/dev/null; then
    echo "Installing Docker Engine..."
    apt-get install -y ca-certificates curl gnupg lsb-release git
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
fi

# Configure UFW Firewall
if command -v ufw &>/dev/null; then
    ufw default deny incoming || true
    ufw default allow outgoing || true
    ufw allow 22/tcp || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    ufw --force enable || true
fi
EOF

# Step 2: Sync Repository to VPS
echo "==> [2/5] Synchronizing repository files to VPS..."
ssh $SSH_OPTS "root@$VPS_IP" "mkdir -p /opt/unnati"
rsync -avz --exclude '.git' --exclude 'node_modules' --exclude 'venv' --exclude 'dist' -e "ssh $SSH_OPTS" ./ "root@$VPS_IP:/opt/unnati/"

# Step 3: Configure Environment Variables
echo "==> [3/5] Initializing secure production environment..."
ssh $SSH_OPTS "root@$VPS_IP" bash -s << 'EOF'
set -euo pipefail
cd /opt/unnati

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    # Generate cryptographic random 50-character secret key
    SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(40))" 2>/dev/null || openssl rand -hex 25)
    sed -i "s|change-me-in-production-use-a-strong-random-secret-key-50-chars-min|$SECRET|g" backend/.env
    sed -i "s|DEBUG=True|DEBUG=False|g" backend/.env
    sed -i "s|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=*,127.0.0.1,localhost|g" backend/.env
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    # Keep VITE_API_ORIGIN empty for same-origin proxy
    sed -i "s|VITE_API_ORIGIN=.*|VITE_API_ORIGIN=|g" frontend/.env
fi
EOF

# Step 4: Build and Launch Containers
echo "==> [4/5] Launching containerized services via Docker Compose..."
ssh $SSH_OPTS "root@$VPS_IP" bash -s << 'EOF'
set -euo pipefail
cd /opt/unnati
docker compose down || true
docker compose up -d --build
EOF

# Step 5: Verification and Probing
echo "==> [5/5] Verifying deployment health..."
sleep 5
ssh $SSH_OPTS "root@$VPS_IP" bash -s << 'EOF'
set -euo pipefail
docker compose ps
echo "--- Probing Health Endpoint ---"
curl -s -f -I http://localhost/healthz || curl -s -f -I http://localhost/ || true
EOF

echo "=================================================================="
echo "  UNNATI Deployment Completed Successfully!"
echo "  Access URL: http://$VPS_IP/"
echo "=================================================================="
