package com.hercycle.dto.response;

import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO response representing a single order line item.
 */
@Data
public class OrderItemResponse {

    private Long id;

    private Long productId;

    private String productName;

    private Integer quantity;

    private BigDecimal price;

    private BigDecimal subtotal;
}
