# UNNATI (उन्नति) Cooperative Platform — Production Deployment Guide
**Smart India Hackathon (SIH 2026)**

---

## 1. Production Architecture Overview

UNNATI is built on a clean, scalable decoupled architecture:

```
                  ┌────────────────────────────────────────┐
                  │          Internet Users / Jury         │
                  └───────────────────┬────────────────────┘
                                      │ (HTTP/HTTPS :80/:443)
                                      ▼
                   ┌──────────────────────────────────────┐
                   │          Nginx Reverse Proxy         │
                   └──────┬──────────────────┬────────────┘
                          │                  │
         ┌────────────────┴───────┐   ┌──────┴───────────────────────────┐
         │ Frontend SPA Root (/)  │   │  API & WebSockets (/api, /ws)    │
         │ Serves /frontend/dist  │   │  Daphne ASGI Server (:8000)      │
         └────────────────────────┘   └──────┬────────────────────┬──────┘
                                             │                    │
                             ┌───────────────┴────┐       ┌───────┴──────┐
                             │ MySQL / PostgreSQL │       │ Redis (v7+)  │
                             │ (utf8mb4 / Port 3306)      │ Channels     │
                             └────────────────────┘       └──────────────┘
```

- **Frontend**: Vite + React Single-Page Application (SPA) compiled to pure static assets (`frontend/dist/`).
- **Backend**: Django 5.0 REST Framework running on **Daphne** ASGI server (handling both REST APIs and real-time WebSockets).
- **WebSockets / Real-Time**: Django Channels routing `/ws/notifications/`, `/ws/bookings/<id>/`, and `/ws/chat/<id>/`.
- **Channel Layer**: Redis (`channels_redis.core.RedisChannelLayer`) for multi-worker scaling, with automatic fallback to `InMemoryChannelLayer` for single-node deployments.
- **Relational Database**: MySQL 8.0 or PostgreSQL 15+ configured with `utf8mb4` character set.
- **Reverse Proxy & SSL**: Nginx with HTTP/1.1 WebSocket upgrade headers, gzip compression, and TLS termination.

---

## 2. Deployment Prerequisites

### Option A: Containerized Deployment (Recommended)
- **Docker Engine**: 24.0+
- **Docker Compose**: v2.20+
- **Host Ports**: `80` (HTTP), `443` (HTTPS)

### Option B: Linux Virtual Machine / Bare-Metal (Ubuntu 22.04 / 24.04 LTS)
- **Python**: 3.11 or 3.12 (`python3`, `python3-pip`, `python3-venv`, `default-libmysqlclient-dev` or `libpq-dev`)
- **Node.js**: 20 LTS (`node`, `npm`)
- **Database**: MySQL 8.0 Server or PostgreSQL 15+
- **Redis Server**: Redis 7.0+
- **Web Server**: Nginx
- **Process Manager**: `systemd`

---

## 3. Production Environment Variables

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and supply production values:

```bash
# Security
SECRET_KEY=<generate-a-cryptographically-secure-random-50-character-key>
DEBUG=False
ALLOWED_HOSTS=unnati.coop,api.unnati.coop,127.0.0.1,localhost

# Relational Database
DB_ENGINE=django.db.backends.mysql
DB_NAME=unnati_db
DB_USER=unnati_user
DB_PASSWORD=<secure-database-password>
DB_HOST=127.0.0.1
DB_PORT=3306

# Redis / Channels
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# CORS & CSRF
CORS_ALLOWED_ORIGINS=https://unnati.coop
CSRF_TRUSTED_ORIGINS=https://unnati.coop

# SSL & Cookies (Set to True once SSL certificates are active)
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Email Delivery (SMTP / SendGrid)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=<sendgrid-api-key>
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=notifications@unnati.coop

# Direct Peer Payment Gateway (Advisory)
RAZORPAY_KEY_ID=rzp_live_placeholder
RAZORPAY_KEY_SECRET=rzp_live_secret
```

### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```bash
# Set backend origin if hosted on separate subdomain (leave empty for same-origin proxy)
VITE_API_ORIGIN=https://api.unnati.coop
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>.apps.googleusercontent.com
VITE_UNNATI_DEMO_MODE=false
```

---

## 4. Step-by-Step Deployment (Option A: Docker Compose)

1. **Clone repository on production host**:
   ```bash
   git clone https://github.com/vivek-ambariya/Workizo-A_service_company.git unnati
   cd unnati
   ```

2. **Configure environment**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your production values
   ```

3. **Launch complete containerized stack**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify container health**:
   ```bash
   docker compose ps
   docker compose logs -f backend
   ```

---

## 5. Step-by-Step Deployment (Option B: Linux VM with systemd & Nginx)

### Step 5.1: Database Initialization (MySQL)
```bash
sudo mysql -u root -p
```
```sql
CREATE DATABASE unnati_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'unnati_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON unnati_db.* TO 'unnati_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 5.2: Backend Setup
```bash
cd /opt/unnati/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Verify initial superuser
python manage.py createsuperuser
```

### Step 5.3: Backend Systemd Service (`/etc/systemd/system/unnati-backend.service`)
```ini
[Unit]
Description=UNNATI Cooperative Daphne ASGI Service
After=network.target redis-server.service mysql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/unnati/backend
EnvironmentFile=/opt/unnati/backend/.env
ExecStart=/opt/unnati/backend/venv/bin/daphne -b 127.0.0.1 -p 8000 config.asgi:application
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start Daphne:
```bash
sudo systemctl daemon-reload
sudo systemctl enable unnati-backend
sudo systemctl start unnati-backend
sudo systemctl status unnati-backend
```

### Step 5.4: Frontend Build & Nginx Setup
```bash
cd /opt/unnati/frontend
npm ci
npm run build

# Copy build to web root
sudo mkdir -p /var/www/unnati/frontend
sudo cp -r dist/* /var/www/unnati/frontend/
```

### Step 5.5: Nginx Configuration (`/etc/nginx/sites-available/unnati`)
```nginx
upstream backend_asgi {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name unnati.coop www.unnati.coop;
    client_max_body_size 25M;

    # SPA Root
    location / {
        root /var/www/unnati/frontend;
        try_files $uri $uri/ /index.html;
    }

    # REST APIs & Admin
    location ~ ^/(api|admin)/ {
        proxy_pass http://backend_asgi;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSockets
    location /ws/ {
        proxy_pass http://backend_asgi;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Django Static
    location /static/ {
        alias /opt/unnati/backend/staticfiles/;
        expires 30d;
    }

    # Media Uploads
    location /media/ {
        alias /opt/unnati/backend/media/;
        expires 7d;
    }
}
```

Enable Nginx site and obtain SSL via Let's Encrypt:
```bash
sudo ln -s /etc/nginx/sites-available/unnati /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d unnati.coop -d www.unnati.coop
```

---

## 5.6 Step-by-Step Deployment (Option C: Railway Managed PaaS)

If you prefer managed cloud hosting without configuring a Linux VM or Nginx:

1. **Create a Railway Project**:
   - Go to [railway.app](https://railway.app) and create a new project from your GitHub repository.
2. **Add PostgreSQL & Redis**:
   - Click `+ New` → `Database` → `Add PostgreSQL`.
   - Click `+ New` → `Database` → `Add Redis`.
3. **Configure Backend Service**:
   - Set Root Directory: `/backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `daphne -b 0.0.0.0 -p $PORT config.asgi:application`
   - Environment Variables:
     - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
     - `REDIS_HOST`: `${{Redis.REDIS_HOST}}`
     - `REDIS_PORT`: `${{Redis.REDIS_PORT}}`
     - `SECRET_KEY`: `<generate-secret-key>`
     - `DEBUG`: `False`
     - `ALLOWED_HOSTS`: `*`
     - `CORS_ALLOWED_ORIGINS`: `https://your-frontend.up.railway.app`
     - `CSRF_TRUSTED_ORIGINS`: `https://your-frontend.up.railway.app`
4. **Configure Frontend Service**:
   - Set Root Directory: `/frontend`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npx serve -s dist -l $PORT`
   - Environment Variables:
     - `VITE_API_ORIGIN`: `https://your-backend.up.railway.app`
     - `VITE_UNNATI_DEMO_MODE`: `false`

---

## 6. Health Checks & Verification

1. **Frontend Health**:
   ```bash
   curl -I https://unnati.coop
   # Should return HTTP 200 OK
   ```

2. **Backend API Health**:
   ```bash
   curl -I https://unnati.coop/api/services/categories/
   # Should return HTTP 200 with JSON payload
   ```

3. **WebSocket Connection Verification**:
   Inspect the browser console on `/bookings/<id>` or `/captain/dashboard`:
   Look for `[WS] Connected successfully` with HTTP 101 Switching Protocols.

---

## 7. Rollback Procedures

If an issue occurs post-deployment:

1. **Frontend Rollback**:
   Re-deploy the previous compiled `dist/` directory or revert git commit and run `npm run build`.

2. **Backend Rollback**:
   ```bash
   # Revert code
   git checkout <last-stable-commit>
   # Restart Daphne
   sudo systemctl restart unnati-backend
   ```

3. **Database Migration Rollback**:
   To roll back the recent UNNATI migration files:
   ```bash
   python manage.py migrate workers 0003
   python manage.py migrate bookings 0008
   python manage.py migrate services 0003
   python manage.py migrate billing 0004
   ```
