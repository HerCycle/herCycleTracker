# HTTPS (SSL/TLS) Deployment Report

This report documents the verification audits, hostname resolutions, certificate properties, and redirection configurations applied to enable secure communication (HTTPS) for the HerCycle backend application.

---

## 1. Summary of HTTPS Configuration

- **Target Hostname**: `52-2-37-31.sslip.io`
- **Target IP Address**: `52.2.37.31` (AWS EC2 Elastic IP)
- **SSL Authority**: Let's Encrypt CA
- **Active Ports**:
  - Port `80` (HTTP): Configured to automatically redirect (301) to HTTPS.
  - Port `443` (HTTPS): Configured to process secure TLS connections, proxied to the local Spring Boot service on Port 8080.
- **Overall Verdict**: **PASS**

---

## 2. Detailed Verification Logs

### A. Hostname DNS Resolution Check
A remote lookup on the EC2 server confirms that the wildcard hostname maps directly to the server's public interface:
```text
$ nslookup 52-2-37-31.sslip.io
Server:         127.0.0.53
Address:        127.0.0.53#53

Non-authoritative answer:
Name:   52-2-37-31.sslip.io
Address: 52.2.37.31
```
- **Verdict**: **PASS**

### B. SSL Certificate Audit
Inspecting the active TLS certificate details via `openssl` confirms the issuance by Let's Encrypt:
- **Common Name (CN)**: `52-2-37-31.sslip.io`
- **Subject Alternative Name (SAN)**: `DNS:52-2-37-31.sslip.io`
- **Issuer**: `C=US, O=Let's Encrypt, CN=YE1`
- **Validity Window**: Active until `Oct 16 12:25:01 2026 GMT` (90 days duration).
- **Verdict**: **PASS**

### C. Nginx Port Listening Status
We verified that Nginx is active and listening on ports 80 and 443 (both IPv4 and IPv6):
```text
$ sudo ss -tulpn | grep -E '80|443'
tcp   LISTEN 0      511               0.0.0.0:443       0.0.0.0:*     users:(("nginx",...))
tcp   LISTEN 0      511               0.0.0.0:80        0.0.0.0:*     users:(("nginx",...))
tcp   LISTEN 0      511                  [::]:443          [::]:*     users:(("nginx",...))
tcp   LISTEN 0      511                  [::]:80           [::]:*     users:(("nginx",...))
```
- **Verdict**: **PASS**

### D. Automated Certificate Renewal Check
Certbot configures a background systemd timer (`certbot.timer`) that runs twice daily to automatically renew certificates within 30 days of expiry.
```text
$ sudo systemctl status certbot.timer
● certbot.timer - Run certbot twice daily
     Loaded: loaded (/usr/lib/systemd/system/certbot.timer; enabled; preset: enabled)
     Active: active (waiting) since Sat 2026-07-18 07:15:11 UTC; 6h ago
```
- **Verdict**: **PASS**

---

## 3. Verified Endpoints & Redirects

We verified that the server handles redirection and processes API queries securely:

| Requested URL | Target protocol | Response Code | Description |
| :--- | :---: | :---: | :--- |
| `http://52-2-37-31.sslip.io/api/health` | HTTP | `301 Moved Permanently` | Successfully redirects traffic to HTTPS. |
| `https://52-2-37-31.sslip.io/api/health` | HTTPS | `200 OK` | Resolves cleanly. Body: `{"database":"Connected","status":"UP"}`. |
| `https://52-2-37-31.sslip.io/swagger-ui/swagger-ui/index.html` | HTTPS | `200 OK` | Swagger UI is fully rendered and accessible over secure TLS. |
| `https://52-2-37-31.sslip.io` | HTTPS | `404 Not Found` | Handled properly by backend mapping. |

---

## 4. Troubleshooting & Maintenance

- **View Certificate Expiry Date manually**:
  ```bash
  sudo certbot certificates
  ```
- **Dry-run SSL renewal**:
  ```bash
  sudo certbot renew --dry-run
  ```
- **Inspect Nginx HTTPS log streams**:
  ```bash
  sudo tail -f /var/log/nginx/error.log
  ```
