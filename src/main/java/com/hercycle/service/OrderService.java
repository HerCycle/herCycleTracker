package com.hercycle.service;

import com.hercycle.dto.request.OrderRequest;
import com.hercycle.dto.response.OrderResponse;

import java.util.List;

/**
 * Service interface for customer orders checkout, status tracking and cancellation.
 */
public interface OrderService {

    OrderResponse placeOrder(OrderRequest request);

    OrderResponse cancelOrder(Long id);

    List<OrderResponse> getOrderHistory();

    OrderResponse trackOrder(Long id);

    List<OrderResponse> getAllOrders();

    OrderResponse updateOrderStatus(Long id, String orderStatus, String deliveryStatus);
}
