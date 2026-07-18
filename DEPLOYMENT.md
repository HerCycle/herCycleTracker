# HerCycle System Deployment Documentation

This document provides a comprehensive overview of the HerCycle backend system deployment. It details the system architecture, configuration parameters, CI/CD pipeline setup, and instructions to transition the system to HTTPS in the future.

---

## 1. System Architecture Overview

The system is deployed on AWS and includes the following components:

- **Compute**: AWS EC2 instance (Ubuntu Server) reachable at Elastic IP `52.2.37.31`.
- **Database**: AWS RDS MySQL instance (`hercycle.cczkqckgorra.us-east-1.rds.amazonaws.com`).
- **Reverse Proxy**: Nginx routing public HTTP traffic (port 80) to the Spring Boot service (port 8080) and serving Swagger UI.
- **Firewall**: UFW restricting incoming access to ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) only.
- **Application Runner**: Systemd service named `hercycle` executing the JAR inside `/var/www/hercycle/current/`.

---

## 2. Server Deployment Structure

Deployment folder structure on the EC2 instance under `/var/www/hercycle`:

```text
/var/www/hercycle/
├── config/
│   └── application.env   # Contains production environment variables (DB credentials, JWT secrets)
├── current/
│   └── HerCycle.jar      # The currently running active application binary
├── previous/
│   └── HerCycle.jar      # Backup of the last successful deployment (used for rollbacks)
├── logs/                 # Folder reserved for application log files (if configured)
└── repo/                 # Local git repository clone where builds can be executed
```

### Systemd Service Configuration
The service unit file is configured at `/etc/systemd/system/hercycle.service`:
- **Executable**: `/usr/bin/java -jar /var/www/hercycle/current/HerCycle.jar`
- **Environment**: Loaded from `/var/www/hercycle/config/application.env`
- **Restart Policy**: `always` (restarts within 10 seconds if it crashes)

---

## 3. GitHub Actions CI/CD Secrets Setup

To enable the automatic CI/CD pipeline, the following secrets must be added to your GitHub repository under **Settings -> Secrets and variables -> Actions**:

| Secret Name | Value Description | Example |
| :--- | :--- | :--- |
| `SSH_HOST` | The Elastic IP of the EC2 instance | `52.2.37.31` |
| `SSH_USER` | The deployment user username | `ubuntu` |
| `SSH_PRIVATE_KEY` | Content of your SSH private key file | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

Once these secrets are configured, every push to the `main` branch will build the project, run tests, backup the running application, deploy the new candidate JAR, perform a health check, and rollback automatically if the health check fails.

## 4. HTTPS (SSL/TLS) Configuration & Transitioning to a Custom Domain

HTTPS is fully enabled and active using a free wildcard DNS service resolving to `52-2-37-31.sslip.io`. A valid Let's Encrypt SSL certificate has been issued and Nginx automatically redirects all HTTP traffic to secure HTTPS.

- **HTTPS API Endpoint**: `https://52-2-37-31.sslip.io/api/health`
- **HTTPS Swagger UI**: `https://52-2-37-31.sslip.io/swagger-ui/swagger-ui/index.html`

If you purchase a dedicated domain name in the future (e.g., `api.hercycle.com`), follow these steps to transition:

### Step 1: Map Domain to Elastic IP
1. Register your domain name (e.g., `api.hercycle.com`) through a registrar.
2. In your DNS provider dashboard, add an **A Record** pointing `api.hercycle.com` (or your chosen subdomain) to the Elastic IP `52.2.37.31`.
3. Wait for DNS propagation.

### Step 2: Update Nginx Configuration
Edit the Nginx configuration on the EC2 server:
```bash
sudo nano /etc/nginx/sites-available/hercycle
```
Change the `server_name` parameter to match your domain name:
```nginx
server_name api.hercycle.com;
```
Save the file and reload Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Step 3: Run Certbot to Generate Let's Encrypt Certificate
Execute Certbot to request the SSL certificates for your new domain:
```bash
sudo certbot --nginx -d api.hercycle.com
```
Follow the interactive prompts (agree to TOS, redirect HTTP traffic to HTTPS, etc.). Certbot will rewrite the Nginx blocks to map the SSL certificates to the new domain.

### Step 4: Validate Automated Renewal
Certbot's renewal process remains automated:
```bash
sudo certbot renew --dry-run
```
