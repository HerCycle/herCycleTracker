package com.hercycle.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO representing Admin Dashboard Statistics.
 * Extended with popular products list.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsResponse {

    private Long totalUsers;

    private Long activeUsersToday;

    private Long totalOrders;

    private BigDecimal totalRevenue;

    private Long totalProducts;

    private List<ProductResponse> popularProducts;

    private List<FeedbackResponse> recentFeedback;
}
