package com.hercycle.service;

import com.hercycle.dto.response.WishlistResponse;

import java.util.List;

/**
 * Service interface for wishlist management.
 */
public interface WishlistService {

    WishlistResponse addToWishlist(Long productId);

    void removeFromWishlist(Long productId);

    List<WishlistResponse> viewWishlist();
}
