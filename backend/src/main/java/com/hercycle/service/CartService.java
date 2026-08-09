package com.hercycle.service;

import com.hercycle.dto.request.CartRequest;
import com.hercycle.dto.response.CartResponse;

/**
 * Service interface for managing user shopping cart operations.
 */
public interface CartService {

    CartResponse addToCart(CartRequest request);

    CartResponse updateQuantity(Long id, Integer quantity);

    CartResponse removeItem(Long id);

    void clearCart();

    CartResponse viewCart();
}
