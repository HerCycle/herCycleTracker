package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Order Entity representing purchase transactions.
 * Extends Auditable.
 */
@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_order_number", columnList = "order_number", unique = true),
    @Index(name = "idx_order_user", columnList = "user_id")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "address_id", nullable = false)
    private Address address;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    @Column(name = "payment_status", nullable = false)
    private String paymentStatus;

    @Column(name = "order_status", nullable = false)
    private String orderStatus;

    @Column(name = "delivery_status", nullable = false)
    private String deliveryStatus;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "coupon_discount", precision = 10, scale = 2)
    private BigDecimal couponDiscount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @Column(name = "ordered_date", nullable = false, updatable = false)
    private LocalDateTime orderedDate;

    @Column(name = "delivery_date")
    private LocalDateTime deliveryDate;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<OrderItem> orderItems = new ArrayList<>();

    @PrePersist
    protected void onOrderCreate() {
        this.orderedDate = LocalDateTime.now();
        this.paymentStatus = this.paymentStatus != null ? this.paymentStatus : "PENDING";
        this.orderStatus = this.orderStatus != null ? this.orderStatus : "PLACED";
        this.deliveryStatus = this.deliveryStatus != null ? this.deliveryStatus : "PENDING";
        this.couponDiscount = this.couponDiscount != null ? this.couponDiscount : BigDecimal.ZERO;
        if (this.orderNumber == null) {
            this.orderNumber = "HC-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 900 + 100);
        }
    }
}
