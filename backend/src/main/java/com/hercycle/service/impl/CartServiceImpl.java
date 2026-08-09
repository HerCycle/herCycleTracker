package com.hercycle.service.impl;

import com.hercycle.dto.request.CartRequest;
import com.hercycle.dto.response.CartItemResponse;
import com.hercycle.dto.response.CartResponse;
import com.hercycle.entity.CartItem;
import com.hercycle.entity.Product;
import com.hercycle.entity.User;
import com.hercycle.exception.BadRequestException;
import com.hercycle.exception.ResourceNotFoundException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.CartItemRepository;
import com.hercycle.repository.ProductRepository;
import com.hercycle.service.CartService;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service implementation for Cart management.
 */
@Service
@Transactional
public class CartServiceImpl implements CartService {

    private static final Logger logger = LoggerFactory.getLogger(CartServiceImpl.class);

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public CartServiceImpl(CartItemRepository cartItemRepository, ProductRepository productRepository,
                           UserService userService, EntityMapper entityMapper) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Override
    public CartResponse addToCart(CartRequest request) {
        User user = userService.getLoggedInUser();
        logger.info("Adding product ID {} to user {}'s cart", request.getProductId(), user.getEmail());

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + request.getProductId()));

        if (product.getStock() < request.getQuantity()) {
            throw new BadRequestException("Insufficient product stock available");
        }

        Optional<CartItem> existing = cartItemRepository.findByUserAndProduct(user, product);
        CartItem cartItem;
        if (existing.isPresent()) {
            cartItem = existing.get();
            int newQuantity = cartItem.getQuantity() + request.getQuantity();
            if (product.getStock() < newQuantity) {
                throw new BadRequestException("Insufficient product stock available");
            }
            cartItem.setQuantity(newQuantity);
        } else {
            cartItem = CartItem.builder()
                    .user(user)
                    .product(product)
                    .quantity(request.getQuantity())
                    .price(product.getPrice())
                    .build();
        }

        cartItem.calculateSubtotal();
        cartItemRepository.save(cartItem);
        return viewCart();
    }

    @Override
    public CartResponse updateQuantity(Long id, Integer quantity) {
        User user = userService.getLoggedInUser();
        logger.info("Updating quantity for cart item ID {} to {}", id, quantity);

        CartItem item = cartItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with ID: " + id));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to cart item");
        }

        if (item.getProduct().getStock() < quantity) {
            throw new BadRequestException("Insufficient product stock available");
        }

        item.setQuantity(quantity);
        item.calculateSubtotal();
        cartItemRepository.save(item);
        return viewCart();
    }

    @Override
    public CartResponse removeItem(Long id) {
        User user = userService.getLoggedInUser();
        logger.info("Removing item ID {} from user {}'s cart", id, user.getEmail());

        CartItem item = cartItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with ID: " + id));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to cart item");
        }

        cartItemRepository.delete(item);
        return viewCart();
    }

    @Override
    public void clearCart() {
        User user = userService.getLoggedInUser();
        logger.info("Clearing cart for user: {}", user.getEmail());
        List<CartItem> items = cartItemRepository.findByUser(user);
        cartItemRepository.deleteAll(items);
    }

    @Override
    public CartResponse viewCart() {
        User user = userService.getLoggedInUser();
        List<CartItem> items = cartItemRepository.findByUser(user);

        List<CartItemResponse> itemResponses = items.stream()
                .map(entityMapper::toCartItemResponse)
                .collect(Collectors.toList());

        BigDecimal total = items.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(itemResponses, total);
    }
}
