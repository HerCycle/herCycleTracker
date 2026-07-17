package com.hercycle.service.impl;

import com.hercycle.dto.response.WishlistResponse;
import com.hercycle.entity.Product;
import com.hercycle.entity.User;
import com.hercycle.entity.WishlistItem;
import com.hercycle.exception.ResourceNotFoundException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.ProductRepository;
import com.hercycle.repository.WishlistItemRepository;
import com.hercycle.service.WishlistService;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service implementation for Wishlist.
 */
@Service
@Transactional
public class WishlistServiceImpl implements WishlistService {

    private static final Logger logger = LoggerFactory.getLogger(WishlistServiceImpl.class);

    private final WishlistItemRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public WishlistServiceImpl(WishlistItemRepository wishlistRepository, ProductRepository productRepository,
                               UserService userService, EntityMapper entityMapper) {
        this.wishlistRepository = wishlistRepository;
        this.productRepository = productRepository;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Override
    public WishlistResponse addToWishlist(Long productId) {
        User user = userService.getLoggedInUser();
        logger.info("Adding product ID {} to user {}'s wishlist", productId, user.getEmail());

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));

        Optional<WishlistItem> existing = wishlistRepository.findByUserAndProduct(user, product);
        if (existing.isPresent()) {
            return entityMapper.toWishlistResponse(existing.get());
        }

        WishlistItem wish = WishlistItem.builder()
                .user(user)
                .product(product)
                .build();

        WishlistItem saved = wishlistRepository.save(wish);
        return entityMapper.toWishlistResponse(saved);
    }

    @Override
    public void removeFromWishlist(Long productId) {
        User user = userService.getLoggedInUser();
        logger.info("Removing product ID {} from user {}'s wishlist", productId, user.getEmail());

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));

        WishlistItem wish = wishlistRepository.findByUserAndProduct(user, product)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found in user wishlist"));

        wishlistRepository.delete(wish);
    }

    @Override
    public List<WishlistResponse> viewWishlist() {
        User user = userService.getLoggedInUser();
        return wishlistRepository.findByUser(user).stream()
                .map(entityMapper::toWishlistResponse)
                .collect(Collectors.toList());
    }
}
