# FormaTrack – Production Deployment Guide

## 1️⃣ Overview
**Stack:** MERN (MongoDB Atlas + Express + React/Vite + Node)  
**Domain:** https://www.formatrack.xyz  
**Server:** DigitalOcean Ubuntu droplet  
**Reverse Proxy:** Nginx  
**Process Manager:** PM2  

---

## 2️⃣ Folder Layout (on Droplet)

| Path | Purpose |
|------|----------|
| `/var/cardsServer/` | Node + Express backend |
| `/var/cardsServer/.env` | Environment variables (see below) |
| `/var/www/html/` | Compiled React build served by Nginx |
| `/etc/nginx/sites-available/formatrack` | Nginx server block |
| `/root/.pm2/` | PM2 process data + logs |

---

## 3️⃣ Environment Variables (`/var/cardsServer/.env`)
```bash
PORT=5000
MONGODB_URI="mongodb+srv://<user>:<password>@idigxij.mongodb.net/COP4331Cards?retryWrites=true&w=majority"
ACCESS_TOKEN_SECRET="your-JWT-secret"
```
> Never commit this file to GitHub.

---

## 4️⃣ Backend Deployment Commands
```bash
cd /var/cardsServer
git pull                        # pull latest code
pm2 restart express-server       # restart running app
pm2 logs express-server --lines 50
```

### First-time setup
```bash
npm install
pm2 start server.js --name express-server
pm2 save
pm2 startup systemd
```

PM2 auto-starts on reboot via `pm2-root.service`.

---

## 5️⃣ Frontend Deployment Commands
On your **local machine**:

```bash
cd frontend
npm run build
scp -r dist/* root@formatrack.xyz:/var/www/html/
```

On the **droplet**:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6️⃣ Nginx Configuration Snippet
`/etc/nginx/sites-available/formatrack`
```nginx
server {
    listen 80;
    server_name formatrack.xyz www.formatrack.xyz;
    return 301 https://formatrack.xyz$request_uri;
}

server {
    listen 443 ssl http2;
    server_name formatrack.xyz www.formatrack.xyz;

    ssl_certificate     /etc/letsencrypt/live/formatrack.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/formatrack.xyz/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # Proxy API → Node backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;  # ← no trailing slash
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reload Nginx after edits:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7️⃣ Health Endpoint
Check backend connectivity:
```bash
curl -s https://www.formatrack.xyz/api/health
# → {"ok":true,"dbState":1,"dbName":"COP4331Cards"}
```

---

## 8️⃣ Maintenance & Security

| Task | Command |
|------|----------|
| View running apps | `pm2 ls` |
| Tail logs | `pm2 logs express-server --lines 100` |
| System updates | `sudo apt update && sudo apt upgrade -y` |
| SSL renewal test | `sudo certbot renew --dry-run` |
| Mongo IP whitelist | only your droplet IP in Atlas > Network Access |

---

## 9️⃣ Deployment Flow Summary

1. **Local:** update code → `npm run build`
2. **Push:** `git push origin main`
3. **Server:** `git pull && pm2 restart express-server`
4. **Copy build:** `scp dist/* root@formatrack.xyz:/var/www/html/`
5. **Reload Nginx:** `sudo nginx -t && sudo systemctl reload nginx`
6. ✅ Visit [https://www.formatrack.xyz](https://www.formatrack.xyz)

---

## 🔚 Notes
- Frontend JS/TS files (e.g., `Login.tsx`, `CardUI.tsx`) exist only on your dev machine; production serves the compiled output.
- PM2 auto-restores apps on reboot (`pm2-root.service`).
- Logs live in `/root/.pm2/logs/`.
- Health endpoint + `pm2 logs` are your best quick-diagnostics.

---

Happy shipping 🚀  
_– FormaTrack Deployment Docs, 2025_
