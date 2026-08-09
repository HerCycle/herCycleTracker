package com.hercycle.dto.response;

import lombok.Data;

/**
 * DTO response representing a single wishlist entry.
 */
@Data
public class WishlistResponse {

    private Long id;

    private ProductResponse product;
}
