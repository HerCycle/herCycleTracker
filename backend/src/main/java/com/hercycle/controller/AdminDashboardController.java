package com.hercycle.controller;

import com.hercycle.dto.ApiResponse;
import com.hercycle.dto.response.DashboardStatsResponse;
import com.hercycle.dto.response.UserResponse;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.UserRepository;
import com.hercycle.service.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for Admin actions and dashboard operations.
 * Restricted exclusively to users with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final UserRepository userRepository;
    private final EntityMapper entityMapper;

    public AdminDashboardController(AdminDashboardService adminDashboardService, UserRepository userRepository,
                                    EntityMapper entityMapper) {
        this.adminDashboardService = adminDashboardService;
        this.userRepository = userRepository;
        this.entityMapper = entityMapper;
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats() {
        DashboardStatsResponse stats = adminDashboardService.getStats();
        return ResponseEntity.ok(ApiResponse.success("Statistics loaded successfully", stats));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> manageUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(entityMapper::toUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Users list loaded successfully", users));
    }
}
