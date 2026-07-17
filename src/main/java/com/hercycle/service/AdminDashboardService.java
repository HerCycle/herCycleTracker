package com.hercycle.service;

import com.hercycle.dto.response.DashboardStatsResponse;

/**
 * Service interface for Admin Dashboard statistics and aggregation details.
 */
public interface AdminDashboardService {

    DashboardStatsResponse getStats();
}
