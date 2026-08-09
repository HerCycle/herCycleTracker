package com.hercycle.service.impl;

import com.hercycle.dto.request.OrderRequest;
import com.hercycle.dto.response.OrderResponse;
import com.hercycle.entity.*;
import com.hercycle.exception.BadRequestException;
import com.hercycle.exception.ResourceNotFoundException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.*;
import com.hercycle.service.OrderService;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for Order processing.
 */
@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderServiceImpl.class);

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final AddressRepository addressRepository;
    private final CouponRepository couponRepository;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public OrderServiceImpl(OrderRepository orderRepository, CartItemRepository cartItemRepository,
                            ProductRepository productRepository, AddressRepository addressRepository,
                            CouponRepository couponRepository, UserService userService, EntityMapper entityMapper) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.addressRepository = addressRepository;
        this.couponRepository = couponRepository;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Override
    public OrderResponse placeOrder(OrderRequest request) {
        User user = userService.getLoggedInUser();
        logger.info("Placing order for user: {}", user.getEmail());

        List<CartItem> cartItems = cartItemRepository.findByUser(user);
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Your shopping cart is empty");
        }

        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Delivery address not found with ID: " + request.getAddressId()));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized delivery address selection");
        }

        BigDecimal baseTotal = BigDecimal.ZERO;
        Order order = Order.builder()
                .user(user)
                .address(address)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus("PENDING")
                .orderStatus("PLACED")
                .deliveryStatus("PENDING")
                .build();

        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            if (product.getStock() < item.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product: " + product.getName());
            }

            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(item.getQuantity())
                    .price(item.getPrice())
                    .subtotal(item.getSubtotal())
                    .build();

            order.getOrderItems().add(orderItem);
            baseTotal = baseTotal.add(item.getSubtotal());
        }

        // Apply promo code discount if present
        BigDecimal discount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().trim().isEmpty()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(request.getCouponCode().trim())
                    .orElseThrow(() -> new BadRequestException("Invalid promo coupon code: " + request.getCouponCode()));

            if (Boolean.FALSE.equals(coupon.getActive()) || coupon.getExpiryDate().isBefore(LocalDate.now())) {
                throw new BadRequestException("Promo coupon code is expired or inactive");
            }

            if (coupon.getDiscountPercentage().compareTo(BigDecimal.ZERO) > 0) {
                discount = baseTotal.multiply(coupon.getDiscountPercentage().divide(BigDecimal.valueOf(100)));
            } else if (coupon.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                discount = coupon.getDiscountAmount();
            }

            order.setCoupon(coupon);
        }

        order.setCouponDiscount(discount);
        BigDecimal finalAmount = baseTotal.subtract(discount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }
        order.setTotalAmount(finalAmount);

        Order savedOrder = orderRepository.save(order);
        cartItemRepository.deleteAll(cartItems);

        return entityMapper.toOrderResponse(savedOrder);
    }

    @Override
    public OrderResponse cancelOrder(Long id) {
        User user = userService.getLoggedInUser();
        logger.info("Cancelling order ID {} for user {}", id, user.getEmail());

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));

        if (!order.getUser().getId().equals(user.getId()) && !user.getRole().equals(Role.ROLE_ADMIN)) {
            throw new BadRequestException("Unauthorized access to cancel this order");
        }

        if ("DELIVERED".equalsIgnoreCase(order.getOrderStatus()) || "CANCELLED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new BadRequestException("Order cannot be cancelled as it is already " + order.getOrderStatus());
        }

        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);
        }

        order.setOrderStatus("CANCELLED");
        order.setDeliveryStatus("CANCELLED");
        Order saved = orderRepository.save(order);

        return entityMapper.toOrderResponse(saved);
    }

    @Override
    public List<OrderResponse> getOrderHistory() {
        User user = userService.getLoggedInUser();
        return orderRepository.findByUserOrderByOrderedDateDesc(user).stream()
                .map(entityMapper::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OrderResponse trackOrder(Long id) {
        User user = userService.getLoggedInUser();
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));

        if (!order.getUser().getId().equals(user.getId()) && !user.getRole().equals(Role.ROLE_ADMIN)) {
            throw new BadRequestException("Unauthorized access to view this order");
        }

        return entityMapper.toOrderResponse(order);
    }

    @Override
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(entityMapper::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OrderResponse updateOrderStatus(Long id, String orderStatus, String deliveryStatus) {
        logger.info("Admin updating order status of order ID {} to orderStatus={}, deliveryStatus={}", id, orderStatus, deliveryStatus);
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));

        if (orderStatus != null) {
            order.setOrderStatus(orderStatus.toUpperCase());
        }
        if (deliveryStatus != null) {
            order.setDeliveryStatus(deliveryStatus.toUpperCase());
            if ("DELIVERED".equalsIgnoreCase(deliveryStatus)) {
                order.setDeliveryDate(LocalDateTime.now());
                order.setPaymentStatus("PAID");
            }
        }

        Order saved = orderRepository.save(order);
        return entityMapper.toOrderResponse(saved);
    }
}
