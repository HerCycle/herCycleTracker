package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Coupon Entity for the organic care store checkout discount codes.
 * Extends Auditable.
 */
@Entity
@Table(name = "coupons", indexes = {
    @Index(name = "idx_coupon_code", columnList = "code", unique = true)
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount; // absolute value deduction (e.g. $5.00 off)

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage; // percentage deduction (e.g. 10.00 for 10%)

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "is_active", nullable = false)
    private Boolean active;

    @PrePersist
    protected void onCouponCreate() {
        this.active = this.active != null ? this.active : true;
        this.discountAmount = this.discountAmount != null ? this.discountAmount : BigDecimal.ZERO;
        this.discountPercentage = this.discountPercentage != null ? this.discountPercentage : BigDecimal.ZERO;
    }
}
