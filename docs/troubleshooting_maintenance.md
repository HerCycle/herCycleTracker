# Troubleshooting & Maintenance Guide

This guide provides procedures for monitoring, diagnosing, and maintaining the HerCycle backend deployment.

---

## 1. Diagnostics & Log Analysis

### Read Application Logs
The Spring Boot backend standard output is routed to syslog. You can view the application logs using `journald`:

- **Real-time Log Stream**:
  ```bash
  journalctl -u hercycle.service -f
  ```
- **Show Last 100 Lines**:
  ```bash
  journalctl -u hercycle.service -n 100 --no-pager
  ```
- **Search logs for Errors/Warnings**:
  ```bash
  journalctl -u hercycle.service --no-pager | grep -iE 'error|warning|exception'
  ```

### Read Nginx Web Logs
- **Error Log**:
  ```bash
  sudo tail -f /var/log/nginx/error.log
  ```
- **Access Log**:
  ```bash
  sudo tail -f /var/log/nginx/access.log
  ```

---

## 2. Common Troubleshooting Scenarios

### Scenario A: Nginx returns "502 Bad Gateway"
This indicates Nginx cannot communicate with the Spring Boot backend on port 8080.
1. **Check if Spring Boot is running**:
   ```bash
   systemctl status hercycle.service
   ```
2. **If inactive, check service logs for boot failures**:
   ```bash
   journalctl -u hercycle.service -n 50 --no-pager
   ```
3. **If active, verify that the application is listening on port 8080**:
   ```bash
   sudo ss -tulpn | grep 8080
   ```
4. **Restart the backend service**:
   ```bash
   sudo systemctl restart hercycle.service
   ```

### Scenario B: Database Connection Errors
Spring Boot fails to start or outputs database query timeout errors.
1. **Verify RDS Network Route**: Test connectivity from the EC2 instance to the RDS endpoint on port 3306:
   ```bash
   nc -zv hercycle.cczkqckgorra.us-east-1.rds.amazonaws.com 3306
   ```
2. **Check Database Credentials**: Ensure the database URL, username, and password configured in `/var/www/hercycle/config/application.env` are correct.
3. **Check RDS Status**: Log in to the AWS console and confirm that the RDS database instance state is `Available` and is not undergoing maintenance.

### Scenario C: Backend Service Crashes (OOM Issues)
The application crashes under high load or throws `java.lang.OutOfMemoryError`.
1. **Check if Kernel terminated the process**: Search syslog for out of memory messages:
   ```bash
   sudo dmesg -T | grep -i -E 'oom|kill'
   ```
2. **Apply Heap Caps**: Review and configure heap memory parameters as described in the `production_readiness.md` guide.

---

## 3. Maintenance Operations

### Start/Stop/Restart Services

- **Nginx proxy**:
  ```bash
  sudo systemctl start nginx
  sudo systemctl stop nginx
  sudo systemctl restart nginx
  ```
- **Backend Application**:
  ```bash
  sudo systemctl start hercycle
  sudo systemctl stop hercycle
  sudo systemctl restart hercycle
  ```

### Upgrading the Application Manually
If you need to deploy a new JAR manually without the CI/CD pipeline:
1. Copy the new JAR to `/var/www/hercycle/current/HerCycle.jar.new`.
2. Back up the active JAR:
   ```bash
   cp /var/www/hercycle/current/HerCycle.jar /var/www/hercycle/previous/HerCycle.jar
   ```
3. Swap the files:
   ```bash
   mv /var/www/hercycle/current/HerCycle.jar.new /var/www/hercycle/current/HerCycle.jar
   ```
4. Restart the service and verify startup:
   ```bash
   sudo systemctl restart hercycle && sleep 15 && curl -I http://localhost:8080/swagger-ui/swagger-ui/index.html
   ```
