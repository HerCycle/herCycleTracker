package com.hercycle.dto.response;

import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO response representing a single line item in user's cart.
 */
@Data
public class CartItemResponse {

    private Long id;

    private ProductResponse product;

    private Integer quantity;

    private BigDecimal price;

    private BigDecimal subtotal;
}
