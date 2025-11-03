# FormaTrack Deployment – Challenges & Resolutions

## 1️⃣ Overview
This document summarizes the major technical challenges encountered during the FormaTrack production deployment (MERN stack) and how each was successfully resolved.  
It serves as a reflection and postmortem record of the deployment process.

---

## 🧩 2️⃣ Key Challenges & Solutions

### **1. Mixed Content and Path Resolution Errors**
**Problem:**  
When moving from local development (HTTP on `localhost:5000`) to production (HTTPS on `formatrack.xyz`), all API requests failed due to mixed content and incorrect path references.

**Symptoms:**  
Frontend requests to `/api/login` returned `ERR_MIXED_CONTENT` or failed silently.

**Root Cause:**  
Hardcoded absolute URLs (`http://localhost:5000/...`) in frontend components.

**Solution:**  
Implemented a unified dynamic path builder in `Path.ts`:
```ts
const app_name = 'www.formatrack.xyz';
function buildPath(route: string): string {
  return import.meta.env.MODE !== 'development'
    ? 'https://' + app_name + '/api/' + route
    : 'http://localhost:5000/api/' + route;
}
```
This eliminated mixed content errors and allowed the frontend to automatically switch between dev and prod environments.

---

### **2. MongoDB Connection Failures (SSL / IP Whitelist)**
**Problem:**  
The backend repeatedly failed to connect to MongoDB Atlas, throwing TLS handshake and `ReplicaSetNoPrimary` errors.

**Symptoms:**  
PM2 logs showed `MongoServerSelectionError` and `SSL routines: ssl3_read_bytes: tlsv1 alert internal error`.

**Root Cause:**  
Atlas cluster access control: droplet IP was not whitelisted.  
Additionally, the `.env` used on the droplet pointed to a different database (`Cards` instead of `COP4331Cards`).

**Solution:**  
- Added droplet’s static IP to Atlas Network Access whitelist.  
- Updated the `.env` connection string to point to the correct DB name.  
- Verified with PM2 logs:
  ```bash
  DB name: COP4331Cards
  Users count: 1
  Cards count: 4
  ```

---

### **3. Reverse Proxy Path Stripping (/api issue)**
**Problem:**  
`POST /api/login` was being rewritten as `/login` by Nginx, resulting in “Cannot POST /login” from Express.

**Root Cause:**  
Nginx config used:
```nginx
proxy_pass http://127.0.0.1:5000/;  # trailing slash stripped the /api prefix
```

**Solution:**  
Removed the trailing slash so `/api/...` was preserved:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:5000;
}
```
After reloading Nginx, API routes were correctly proxied to Express.

---

### **4. Missing Frontend Assets / MIME Type Errors**
**Problem:**  
Browser console showed “Expected JavaScript module script but got text/html.”

**Symptoms:**  
Vite-generated JS assets were not loading on production; Nginx served `index.html` instead of `.js` files.

**Root Cause:**  
The `/var/www/html/assets` folder had restrictive permissions (`drwx------`), preventing Nginx (user `www-data`) from reading JS/CSS files.

**Solution:**  
Fixed ownership and permissions:
```bash
sudo chown -R www-data:www-data /var/www/html
sudo find /var/www/html -type d -exec chmod 755 {} \;
sudo find /var/www/html -type f -exec chmod 644 {} \;
```
After this, assets loaded correctly and MIME types were served as `application/javascript`.

---

### **5. PM2 Crashes & Restart Loops**
**Problem:**  
`pm2 logs` showed constant restarts (`exited with code [1] via signal [SIGINT]`).

**Root Cause:**  
App was crashing before Mongoose could connect or due to missing model files.

**Solution:**  
- Ensured `/var/cardsServer/models/` contained all required schema files.  
- Re-synced `.env` variables and verified DB connection success in logs.  
- Once stable, saved the process list and enabled autostart:
  ```bash
  pm2 save
  pm2 startup systemd
  ```

---

### **6. No Persistence After Reboot**
**Problem:**  
After droplet reboots, backend was offline until manually restarted.

**Solution:**  
Enabled PM2’s boot persistence:
```bash
pm2 save
pm2 startup systemd
```
Verified with:
```bash
systemctl status pm2-root
```
Now Express auto-restarts after reboot.

---

### **7. Health Check Endpoint Missing**
**Problem:**  
`/api/health` returned 404; needed a quick monitoring endpoint for uptime tests.

**Solution:**  
Added a simple route in Express:
```js
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({ ok: true, db: mongoose.connection.name });
});
```
This provides instant DB connection confirmation in JSON.

---

## 💡 Lessons Learned

- **Trailing slashes in proxy_pass matter** – they rewrite request URIs.  
- **File permissions** are just as critical as code when deploying web servers.  
- **Logs are gold** – `pm2 logs` and `nginx -T` provided nearly every clue.  
- **Dynamic paths** prevent environment mismatches between local and production.  
- **Autostart + persistence** via PM2 turns a fragile setup into a professional-grade deployment.

---

## 🏁 Conclusion
Despite multiple breaking issues across MongoDB, Nginx, SSL, and permissions, the deployment was systematically debugged and stabilized.  
FormaTrack is now a fully functioning production application with HTTPS, persistent backend services, and a smooth CI/CD-style deployment workflow.

_– FormaTrack Deployment Postmortem, 2025_
