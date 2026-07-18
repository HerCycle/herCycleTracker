# Production Readiness & Optimization Report

This document reviews the production configuration parameters of Nginx, systemd, the JVM, log rotation, and backup strategies, providing optimization recommendations for production scalability.

---

## 1. JVM Configuration Review & Recommendations

### Current Configuration
The current service script launches the JVM without defining heap memory limits:
`ExecStart=/usr/bin/java -jar /var/www/hercycle/current/HerCycle.jar`

### Implications
In a 2 GiB RAM server environment, the JVM's default memory sizing heuristics will allocate approximately 500 MiB (25% of RAM) for maximum heap. However, under high load or thread generation, JVM native memory usage can grow and exhaust system RAM, causing the Linux Kernel's Out-Of-Memory (OOM) Killer to terminate the backend process.

### Recommendation
Update the `/etc/systemd/system/hercycle.service` script to explicitly set heap bounds and configure the modern G1 garbage collector:
```ini
ExecStart=/usr/bin/java -Xms256m -Xmx512m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError -jar /var/www/hercycle/current/HerCycle.jar
```
- `-Xms256m`: Pre-allocates a 256 MiB heap, reducing garbage collection overhead during startup.
- `-Xmx512m`: Caps the heap allocation at 512 MiB, ensuring sufficient RAM remains for Nginx and OS buffers.
- `-XX:+UseG1GC`: Enables the G1 collector, which minimizes application pause times.
- `-XX:+ExitOnOutOfMemoryError`: Forces the JVM to exit if heap memory is exhausted, allowing systemd to automatically restart the service in a clean state.

---

## 2. Operating System Swapping Profile

### Current Status
No swap file or partition is active on the server (`Swap: 0B total, 0B used`).

### Recommendation
Enable a 1 GiB or 2 GiB swap file to act as a memory buffer and prevent crash triggers:
```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 3. Log Rotation Audit

### Current Status
- System service logs are routed to `journald` and syslog. `journald` has built-in rotation and size boundaries configured.
- Nginx log rotation is managed by a logrotate script at `/etc/logrotate.d/nginx`.

### Recommendations
1. Add a customized log rotation for any application-specific file logging if introduced in `application.properties`.
2. Configure a log aggregator (e.g., AWS CloudWatch Agent) to ship logs off-instance, ensuring they persist if the EC2 instance is terminated.

---

## 4. Database Backup Strategy

### Current Status
The database is hosted on AWS RDS MySQL.

### Recommendations
1. **Automated Backups**: Enable automatic snapshots in the RDS instance settings, configuring a retention window (typically 7 to 30 days).
2. **Point-In-Time Recovery (PITR)**: Verify that binary logging is enabled to allow database restoration to any specific second.
3. **Cross-Region Snapshots**: Set up snapshot replication to a secondary AWS region to ensure disaster recovery capability.
