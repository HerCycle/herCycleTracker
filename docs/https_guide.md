# HTTPS Configuration & Custom Domain Guide

HTTPS is fully enabled and active on the HerCycle application server using a wildcard DNS routing subdomain: `52-2-37-31.sslip.io`. A valid, trusted SSL/TLS certificate was issued by Let's Encrypt CA, and Nginx is configured to automatically redirect all HTTP requests to HTTPS.

- **HTTPS API Endpoint**: `https://52-2-37-31.sslip.io/api/health`
- **HTTPS Swagger UI**: `https://52-2-37-31.sslip.io/swagger-ui/swagger-ui/index.html`

If you map a dedicated domain name (e.g., `api.hercycle.com`) in the future, follow the instructions below to configure SSL.

---

## 1. Map Domain to Elastic IP

1. Purchase a domain name (e.g., `api.hercycle.com`) through a domain registrar.
2. In the DNS settings of your registrar or DNS provider, add an **A Record**:
   - **Host/Name**: `api` (or `@` for the root domain)
   - **Type**: `A`
   - **Value**: `52.2.37.31` (The EC2 Elastic IP)
   - **TTL**: `3600` (or default)
3. Verify propagation:
   ```bash
   nslookup api.hercycle.com
   ```

---

## 2. Update Nginx Configuration

1. Connect to the EC2 server via SSH.
2. Open the Nginx configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/hercycle
   ```
3. Update the `server_name` parameter to match your domain name:
   ```nginx
   server_name api.hercycle.com;
   ```
4. Save and close. Validate Nginx syntax:
   ```bash
   sudo nginx -t
   ```
5. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

---

## 3. Run Certbot for the New Domain

Generate the new Let's Encrypt certificate:
```bash
sudo certbot --nginx -d api.hercycle.com
```
Follow the interactive prompts:
- Agree to the Terms of Service.
- Choose whether to redirect HTTP traffic to HTTPS.
Certbot will configure SSL on port 443 and apply the rewrite rules automatically.

---

## 4. Verify Automated Renewal

Let's Encrypt certificates are valid for 90 days. Certbot automatically adds a systemd timer to renew certificates that are within 30 days of expiration.

1. Verify the automatic renewal timer is active:
   ```bash
   sudo systemctl status certbot.timer
   ```
2. Test the renewal process with a dry run:
   ```bash
   sudo certbot renew --dry-run
   ```
