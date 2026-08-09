# Server Configuration & API Deployment Summary

This document describes the configuration files, directory layout, systemd scripts, and API routing structures configured on the HerCycle production application server.

---

## 1. Directory Structure

All files related to the application deployment are organized under `/var/www/hercycle`:

- `/var/www/hercycle/config/`: Configuration values, including environment credentials.
  - `application.env`: Contains sensitive keys (DB connection strings, credentials, JWT secret keys). Owned by `ubuntu` user with restricted read permissions (`chmod 600`).
- `/var/www/hercycle/current/`: Active application directory.
  - `HerCycle.jar`: The running Spring Boot application package.
- `/var/www/hercycle/previous/`: Backup folder.
  - `HerCycle.jar`: Last working version. In case of deployment failure, the system rolls back to this binary.
- `/var/www/hercycle/repo/`: Remote Git repository directory.
  - Houses the cloned Git source code and the maven build wrapper.

---

## 2. Systemd Service Configuration

The Spring Boot backend is managed by `systemd` via a service unit located at `/etc/systemd/system/hercycle.service`:

```ini
[Unit]
Description=HerCycle Spring Boot Backend Application
After=network.target

[Service]
User=ubuntu
Group=ubuntu
EnvironmentFile=/var/www/hercycle/config/application.env
WorkingDirectory=/var/www/hercycle/current
ExecStart=/usr/bin/java -jar /var/www/hercycle/current/HerCycle.jar
SuccessExitStatus=143
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=hercycle

[Install]
WantedBy=multi-user.target
```

---

## 3. Nginx Reverse Proxy Configuration

Nginx acts as a front-end server, handling public HTTP requests (Port 80) and proxying them to Spring Boot on Port 8080.
File location: `/etc/nginx/sites-available/hercycle` (symlinked to `/etc/nginx/sites-enabled/hercycle`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 52.2.37.31;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    gzip_proxied any;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';" always;

    # Proxy Buffers & Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 4. Port Allocations & Interfaces

- **Port 80 (HTTP)**: Exposed publicly. Handled by Nginx.
- **Port 22 (SSH)**: Exposed publicly for remote administrative tasks and CI/CD operations.
- **Port 8080 (TCP)**: Bound to the local loopback interface (`127.0.0.1`) only. Accessible exclusively through Nginx proxying.
- **Port 3306 (MySQL)**: Bound to AWS RDS for Spring Boot database queries.
