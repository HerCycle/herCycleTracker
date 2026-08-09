package com.hercycle.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for checking system health status.
 * Verifies active database connection connectivity.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                response.put("database", "Connected");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            response.put("database", "Disconnected: " + e.getMessage());
        }
        response.put("status", "DOWN");
        return ResponseEntity.status(503).body(response);
    }
}
