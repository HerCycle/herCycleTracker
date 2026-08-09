package com.hercycle.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO response representing completed order transactions.
 * Extends fields to return discount coupon information.
 */
@Data
public class OrderResponse {

    private Long id;

    private String orderNumber;

    private AddressResponse address;

    private String paymentMethod;

    private String paymentStatus;

    private String orderStatus;

    private String deliveryStatus;

    private BigDecimal totalAmount;

    private BigDecimal couponDiscount;

    private String couponCode;

    private LocalDateTime orderedDate;

    private LocalDateTime deliveryDate;

    private List<OrderItemResponse> orderItems;
}
