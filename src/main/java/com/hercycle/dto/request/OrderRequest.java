package com.hercycle.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO request payload to checkout and place an order.
 * Supports optional checkout coupon discount codes.
 */
@Data
public class OrderRequest {

    @NotNull(message = "Delivery address ID is required")
    private Long addressId;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // e.g. CARD, UPI, COD

    private String couponCode; // Optional checkout coupon
}
