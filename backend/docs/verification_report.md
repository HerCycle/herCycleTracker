# Deployment Verification & Audit Report

This report summarizes the comprehensive verification diagnostics conducted on the deployed HerCycle production backend system.

---

## 1. System Health Checklist

| Component / Service | Verification Target | Status | Verification Commands & Results |
| :--- | :--- | :---: | :--- |
| **Compute Instance** | AWS EC2 (Ubuntu 26.04) | **PASS** | Checked CPU allocation, memory status, and disk volumes.<br>- **CPU**: 2 vCPUs (Intel Xeon Platinum 8259CL)<br>- **RAM**: 1.9 GiB (buff/cache 1.1Gi, available 1.1Gi)<br>- **Disk**: 19G Total, 15G Available (20% used) |
| **Java VM** | OpenJDK 21 Runtime | **PASS** | `java -version` returns JDK 21.0.11 on Ubuntu. |
| **Build Tools** | Maven Wrapper (`mvnw`) | **PASS** | `./mvnw -version` executes successfully and runs Maven 3.9.6. |
| **Control Tools** | Git Version Control | **PASS** | `git --version` returns version 2.53.0. |
| **Proxy Server** | Nginx Service | **PASS** | `systemctl is-active nginx` returns `active`. Configuration syntax is valid (`nginx -t` passed). |
| **Application Daemon** | HerCycle Backend Service | **PASS** | `systemctl is-active hercycle` returns `active` (running since Jul 18 12:42:26 UTC). |
| **Auto-Start Config** | systemd Auto-Start | **PASS** | Both `nginx` and `hercycle` systemd services are marked `enabled` for boot. |
| **Database Gateway** | AWS RDS MySQL Connectivity | **PASS** | Verified connection establishment from Hikari connection pool in system logs. |
| **Connection Pool** | HikariCP Pool Manager | **PASS** | Logs confirm: `HerCycleHikariPool - Added connection ... Start completed`. |
| **External API access** | Port 80 Proxy Routing | **PASS** | Requesting health API publicly over Port 80 returns HTTP 200 OK. |
| **Documentation UI** | Swagger UI Interface | **PASS** | Public URL `https://52-2-37-31.sslip.io/swagger-ui/swagger-ui/index.html` resolves securely over HTTPS and serves HTML structure. |
| **System Security (SSL)** | Let's Encrypt Certificate | **PASS** | Domain `52-2-37-31.sslip.io` configured. SSL handshakes execute without warnings. |
| **System Firewalls** | UFW Configuration | **PASS** | Firewall active. Ports 22, 80, and 443 are allowed; all other inbound traffic is rejected. |

---

## 2. API Endpoint Verification Metrics

A validation script executed test requests against the active system REST controllers. All API test calls completed successfully:

1. **Authentication API - Register User**:
   - **Endpoint**: `POST /api/auth/register`
   - **Payload**: Register Request DTO containing credentials, metrics, and profiles.
   - **Status**: **PASS** (HTTP 200 OK, User registered successfully, ID: 27).
2. **Authentication API - Login User**:
   - **Endpoint**: `POST /api/auth/login`
   - **Payload**: Login Request DTO containing email/password.
   - **Status**: **PASS** (HTTP 200 OK, returns active JWT Bearer token and Refresh Token).
3. **Period API - Save Period Log**:
   - **Endpoint**: `POST /api/period`
   - **Headers**: `Authorization: Bearer <JWT>`
   - **Payload**: Start date, end date, flow status, and notes.
   - **Status**: **PASS** (HTTP 200 OK, Period logged successfully, ID: 12).
4. **Period API - Fetch History**:
   - **Endpoint**: `GET /api/period/history`
   - **Headers**: `Authorization: Bearer <JWT>`
   - **Status**: **PASS** (HTTP 200 OK, returns list of logged periods, DB write successfully verified).
5. **Period API - Update Entry**:
   - **Endpoint**: `PUT /api/period/12`
   - **Headers**: `Authorization: Bearer <JWT>`
   - **Payload**: Updated flow rates and extended dates.
   - **Status**: **PASS** (HTTP 200 OK, Period log updated successfully, DB update successfully verified).
6. **Period API - Delete Entry**:
   - **Endpoint**: `DELETE /api/period/12`
   - **Headers**: `Authorization: Bearer <JWT>`
   - **Status**: **PASS** (HTTP 200 OK, Period log deleted successfully, DB deletion successfully verified).
7. **System Health Check API**:
   - **Endpoint**: `GET /api/health`
   - **Status**: **PASS** (HTTP 200 OK, returns `{"database":"Connected","status":"UP"}` over HTTPS).

---

## 3. Server Security Rules Verification

The active firewall configuration protects the instance from unauthorized connection attempts:

- **Security Groups (AWS)**: Allows Port 22 (SSH), Port 80 (HTTP), and Port 443 (HTTPS) globally.
- **UFW (Linux Firewall)**: Active and verifying connections:
  - Port `22` (SSH): Allowed
  - Port `80` (HTTP): Allowed (automatically redirected to Port 443)
  - Port `443` (HTTPS): Allowed (Secured with Let's Encrypt SSL)
  - Incoming defaults: Denied
- **Port Binding**: Local application processes (Spring Boot port `8080`) are bound to the loopback interface (`127.0.0.1`) only, preventing external direct bypass attempts.
