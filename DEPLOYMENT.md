# 🚀 Deployment Guide — Latur Pattern Platform
**Domain:** devwithabhi.de  
**Server:** AWS EC2 — 13.206.122.131

---

## PART 1 — LOCAL MACHINE (Do this before pushing to GitHub)

### Step 1: Update backend CORS for production

Open `backend/src/server.js` and make sure the CORS origin reads from env:
```js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```
This is already done. ✅

### Step 2: Set up production .env

Copy the template and fill in the values:
```bash
cp backend/.env.production backend/.env.prod
```
Edit `backend/.env.prod` with your actual secrets. **Never commit this file.**

### Step 3: Push to GitHub

```bash
cd "C:\Users\Abhishek Talole\Desktop\Test-Series"
git init
git add .
git commit -m "Initial production deployment setup"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## PART 2 — HOSTINGER DNS (Do this now)

Log in to Hostinger → DNS Zone for **devwithabhi.de** and add:

| Type | Name | Value              | TTL |
|------|------|--------------------|-----|
| A    | @    | 13.206.122.131     | 300 |
| A    | www  | 13.206.122.131     | 300 |

> DNS propagates in 5–30 minutes. Test with: `ping devwithabhi.de`

---

## PART 3 — AWS EC2 SETUP

### Step 1: EC2 Security Group — open these ports

In AWS Console → EC2 → Security Groups, add inbound rules:

| Port | Protocol | Source    | Purpose          |
|------|----------|-----------|------------------|
| 22   | TCP      | Your IP   | SSH              |
| 80   | TCP      | 0.0.0.0/0 | HTTP             |
| 443  | TCP      | 0.0.0.0/0 | HTTPS            |

### Step 2: SSH into server

```bash
ssh -i your-key.pem ubuntu@13.206.122.131
```

### Step 3: Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker

# Verify
docker --version
docker compose version
```

### Step 4: Clone your repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git app
cd app
```

---

## PART 4 — SERVER CONFIGURATION (One-time)

### Step 5: Create production .env

```bash
cp backend/.env.production backend/.env
nano backend/.env
```

Edit these values:
```env
PORT=5000
NODE_ENV=production
DB_HOST=db
DB_PORT=3306
DB_NAME=test_series_db
DB_USER=latur_user
DB_PASSWORD=StrongPass@2025
DB_ROOT_PASSWORD=RootPass@2025
JWT_SECRET=PASTE_A_LONG_RANDOM_64_CHAR_STRING_HERE
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://devwithabhi.de
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

> Generate JWT secret: `openssl rand -hex 32`

Save with `Ctrl+O`, exit with `Ctrl+X`.

### Step 6: Use HTTP-only Nginx config FIRST (needed for SSL cert)

```bash
cp nginx/nginx.http.conf nginx/nginx.conf
```

### Step 7: Start services (HTTP only — before SSL)

```bash
docker compose up -d --build
```

Wait ~2 minutes for MySQL to initialize. Check:
```bash
docker compose logs -f db        # wait for "ready for connections"
docker compose logs -f backend   # should say "Database synchronized"
docker compose ps                # all should be "Up"
```

Test HTTP works: `curl http://devwithabhi.de/api/health`  
You should see: `{"status":"OK",...}`

---

## PART 5 — SSL CERTIFICATE (Let's Encrypt)

### Step 8: Issue SSL certificate

```bash
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email your@email.com \
  --agree-tos \
  --no-eff-email \
  -d devwithabhi.de \
  -d www.devwithabhi.de
```

### Step 9: Switch to HTTPS Nginx config

```bash
cp nginx/nginx.http.conf nginx/nginx.http.conf.bak
cp nginx/nginx.conf nginx/nginx.conf.bak 2>/dev/null; true

# The nginx/nginx.conf already has HTTPS config
# Restore it from git:
git checkout nginx/nginx.conf
```

### Step 10: Restart frontend with HTTPS config

```bash
docker compose restart frontend
```

Test HTTPS: `curl https://devwithabhi.de/api/health`

---

## PART 6 — DATABASE SEED (One-time)

### Step 11: Run the exam config seeder

```bash
docker compose exec backend node src/seeders/seedExamConfigs.js
```

This sets up MHT-CET, JEE, NEET exam configurations.

### Step 12: Create your first admin account

```bash
docker compose exec backend node -e "
const { User } = require('./src/models');
require('dotenv').config();
async function main() {
  await require('./src/models').sequelize.authenticate();
  const user = await User.create({
    name: 'Admin',
    email: 'admin@devwithabhi.de',
    mobile: '9999999999',
    password: 'Admin@123',
    role: 'admin'
  });
  console.log('Admin created:', user.id);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
"
```

---

## PART 7 — SSL AUTO-RENEWAL

Certbot container already handles auto-renewal (runs every 12 hours).
Verify it's running:
```bash
docker compose ps certbot
```

---

## ONGOING: Deploying Updates

When you push new code to GitHub:

```bash
# On the server
cd ~/app
git pull origin main
docker compose up -d --build
```

---

## USEFUL COMMANDS

```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Restart a service
docker compose restart backend

# Stop everything
docker compose down

# Stop and DELETE database (⚠️ destructive)
docker compose down -v

# MySQL shell
docker compose exec db mysql -u latur_user -p test_series_db

# Backend shell
docker compose exec backend sh
```

---

## FILE STRUCTURE AFTER SETUP

```
Test-Series/
├── docker-compose.yml
├── .gitignore
├── nginx/
│   ├── nginx.conf          ← HTTPS config (production)
│   └── nginx.http.conf     ← HTTP-only (used for cert issuance)
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env                ← ⚠️ NOT committed (production secrets)
│   ├── .env.production     ← Template (committed, no secrets)
│   └── src/
└── frontend/
    ├── Dockerfile
    ├── .dockerignore
    └── nginx.conf          ← Internal nginx for the container
```
