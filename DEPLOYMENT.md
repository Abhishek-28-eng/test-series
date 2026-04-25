# TestSeries Pro — Full Deployment Guide
# EC2 IP: 35.154.125.246 | Domain: devwithabhi.de | Registry: GHCR

## Architecture
```
git push main
    → GitHub Actions builds Docker images
    → Images pushed to ghcr.io (GitHub Container Registry — FREE, private)
    → SSH into EC2
    → Pull new images → Restart containers (DB untouched)
```

---

## STEP 1: GitHub Secrets Setup

Go to: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

You only need **3 secrets** (no Docker Hub account needed!):

| Secret Name | Value |
|---|---|
| `EC2_HOST` | `35.154.125.246` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Full contents of your `.pem` private key file |

> `GITHUB_TOKEN` is automatically provided by GitHub Actions — no setup needed!

---

## STEP 2: One-Time EC2 Server Setup

SSH into your EC2:
```bash
ssh -i your-key.pem ubuntu@35.154.125.246
```

Download and run the setup script:
```bash
curl -fsSL https://raw.githubusercontent.com/Abhishek-28-eng/test-series/main/setup_ec2.sh -o setup_ec2.sh
bash setup_ec2.sh
```

---

## STEP 3: Configure the .env on EC2

```bash
nano /opt/testseries/.env
```

Replace all `CHANGE_ME_*` values. Your `GITHUB_OWNER` is your lowercase GitHub username (e.g. `abhishek-28-eng`):

```env
DB_PASSWORD=MySecurePass123!
DB_ROOT_PASSWORD=MyRootPass456!
JWT_SECRET=some-random-32-char-string-here!
GITHUB_OWNER=abhishek-28-eng
```

---

## STEP 4: Upload docker-compose.prod.yml

From your **local machine**:
```bash
scp -i your-key.pem docker-compose.prod.yml ubuntu@35.154.125.246:/opt/testseries/
```

---

## STEP 5: Authenticate EC2 with GHCR

On the EC2 server, create a GitHub Personal Access Token (PAT):
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → scopes: `read:packages`
3. Copy the token, then on EC2:

```bash
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

This only needs to be done **once** — Docker saves the credentials.

---

## STEP 6: First Deployment (Manual — HTTP)

```bash
cd /opt/testseries

# Apply docker group without logging out
newgrp docker

# Start all services (HTTP only first, before SSL)
docker compose -f docker-compose.prod.yml up -d

# Check all containers are healthy
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend --tail=30
```

---

## STEP 7: Get SSL Certificate (Let's Encrypt)

```bash
# Issue SSL cert
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d devwithabhi.de -d www.devwithabhi.de \
  --email your@email.com \
  --agree-tos --no-eff-email

# Switch nginx to SSL config
cat > /opt/testseries/nginx/nginx.conf << 'EOF'
server {
    listen 80;
    server_name devwithabhi.de www.devwithabhi.de;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    server_name devwithabhi.de www.devwithabhi.de;

    ssl_certificate     /etc/letsencrypt/live/devwithabhi.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/devwithabhi.de/privkey.pem;

    root  /usr/share/nginx/html;
    index index.html;

    location / { try_files $uri $uri/ /index.html; }

    location /api/ {
        proxy_pass         http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /uploads/ { proxy_pass http://backend:5000/uploads/; }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
EOF

# Reload nginx
docker compose -f docker-compose.prod.yml restart frontend
```

---

## STEP 8: Run Database Setup

```bash
cd /opt/testseries

# Run multi-tenant migration
docker compose -f docker-compose.prod.yml exec backend node migrate_multi_tenant.js

# Fix unique indexes for multi-tenant
docker compose -f docker-compose.prod.yml exec backend node fix_unique_indexes.js

# Create the DEFAULT institute
docker compose -f docker-compose.prod.yml exec backend node create_institute.js \
  "Main Institute" DEFAULT "Super Admin" 8767724022 'Abhi@2808'

# Promote to superadmin role
docker compose -f docker-compose.prod.yml exec backend node -e "
const { User } = require('./src/models');
User.findOne({ where: { mobile: '8767724022' } }).then(u => {
  return u.update({ role: 'superadmin', instituteId: null });
}).then(() => { console.log('Done'); process.exit(0); });
"
```

---

## STEP 9: CI/CD Is Now Live!

Every `git push` to `main` will automatically:
1. Build fresh Docker images on GitHub's servers
2. Push to `ghcr.io` (free, private)
3. SSH into EC2 and pull + restart containers
4. Database stays running — zero data loss

```bash
git add .
git commit -m "feat: your feature"
git push origin main
# Watch: GitHub Repo → Actions tab
```

---

## EC2 Security Group Rules

| Type | Protocol | Port | Source |
|---|---|---|---|
| SSH | TCP | 22 | Your IP only |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |

---

## Useful Commands on EC2

```bash
# Follow all logs
docker compose -f /opt/testseries/docker-compose.prod.yml logs -f

# Backend logs only
docker compose -f /opt/testseries/docker-compose.prod.yml logs backend -f

# Restart services
docker compose -f /opt/testseries/docker-compose.prod.yml restart

# Access MySQL
docker exec -it testseries_db mysql -u tsuser -p test_series_db

# Disk usage
df -h && docker system df
```
