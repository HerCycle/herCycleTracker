package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Product Entity for the organic store.
 * Extends Auditable.
 */
@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_product_category", columnList = "category"),
    @Index(name = "idx_product_name", columnList = "name")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "discount", precision = 5, scale = 2)
    private BigDecimal discount; // percentage discount

    @Column(name = "stock", nullable = false)
    private Integer stock;

    @Column(name = "rating")
    private Double rating;

    @Column(name = "reviews_count")
    private Integer reviewsCount;

    @Column(name = "brand")
    private String brand;

    @Column(name = "category")
    private String category;

    @Column(name = "image_url")
    private String imageUrl;

    @PrePersist
    protected void onProductCreate() {
        this.discount = this.discount != null ? this.discount : BigDecimal.ZERO;
        this.stock = this.stock != null ? this.stock : 0;
        this.rating = this.rating != null ? this.rating : 5.0;
        this.reviewsCount = this.reviewsCount != null ? this.reviewsCount : 0;
    }
}
