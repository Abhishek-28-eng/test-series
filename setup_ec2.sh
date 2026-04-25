#!/bin/bash
# =============================================================
# EC2 Initial Setup Script for TestSeries Pro
# Run ONCE on a fresh Ubuntu 22.04 EC2 instance
# Usage: bash setup_ec2.sh
# =============================================================
set -e

echo "🚀 Starting EC2 setup for TestSeries Pro..."

# ─── 1. Update system ────────────────────────────────────────
sudo apt-get update -y
sudo apt-get upgrade -y

# ─── 2. Install Docker ───────────────────────────────────────
echo "Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group (no sudo needed)
sudo usermod -aG docker $USER

# ─── 3. Create project directory ─────────────────────────────
sudo mkdir -p /opt/testseries/nginx
sudo chown -R $USER:$USER /opt/testseries
cd /opt/testseries

# ─── 4. Create .env template ─────────────────────────────────
cat > /opt/testseries/.env << 'ENVEOF'
DB_HOST=db
DB_PORT=3306
DB_NAME=test_series_db
DB_USER=tsuser
DB_PASSWORD=CHANGE_ME_DB_PASSWORD
DB_ROOT_PASSWORD=CHANGE_ME_ROOT_PASSWORD

NODE_ENV=production
PORT=5000
JWT_SECRET=CHANGE_ME_JWT_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://devwithabhi.de

# Your GitHub username (lowercase) — used by docker-compose.prod.yml
GITHUB_OWNER=CHANGE_ME_GITHUB_USERNAME_LOWERCASE
ENVEOF

echo ""
echo "⚠️  Edit /opt/testseries/.env NOW before starting containers!"

# ─── 5. Create nginx HTTP config (before SSL is issued) ───────
cat > /opt/testseries/nginx/nginx.conf << 'NGINXEOF'
server {
    listen 80;
    server_name devwithabhi.de www.devwithabhi.de;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    root  /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass         http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }

    location /uploads/ {
        proxy_pass http://backend:5000/uploads/;
    }
}
NGINXEOF

echo ""
echo "✅ EC2 setup complete! Next:"
echo "  1. nano /opt/testseries/.env     (fill in real values)"
echo "  2. Upload docker-compose.prod.yml here"
echo "  3. docker login ghcr.io -u YOUR_GITHUB_USERNAME"
echo "  4. docker compose -f docker-compose.prod.yml up -d"
