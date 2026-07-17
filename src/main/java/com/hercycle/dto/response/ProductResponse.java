package com.hercycle.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO response representing store product details.
 */
@Data
public class ProductResponse {

    private Long id;

    private String name;

    private String description;

    private BigDecimal price;

    private BigDecimal discount;

    private Integer stock;

    private Double rating;

    private Integer reviewsCount;

    private String brand;

    private String category;

    private String imageUrl;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
