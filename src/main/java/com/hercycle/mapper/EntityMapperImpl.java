package com.hercycle.mapper;

import com.hercycle.dto.response.*;
import com.hercycle.entity.*;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

/**
 * Implementation of EntityMapper mapping Database models to API Response DTOs.
 */
@Component
public class EntityMapperImpl implements EntityMapper {

    private final ModelMapper modelMapper;

    public EntityMapperImpl(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    @Override
    public UserResponse toUserResponse(User user) {
        if (user == null) return null;
        UserResponse response = modelMapper.map(user, UserResponse.class);
        response.setRole(user.getRole().name());
        return response;
    }

    @Override
    public PeriodResponse toPeriodResponse(PeriodTracker period) {
        if (period == null) return null;
        PeriodResponse response = modelMapper.map(period, PeriodResponse.class);
        if (period.getFlow() != null) {
            response.setFlow(period.getFlow().name());
        }
        return response;
    }

    @Override
    public SymptomResponse toSymptomResponse(Symptoms symptoms) {
        if (symptoms == null) return null;
        SymptomResponse response = modelMapper.map(symptoms, SymptomResponse.class);
        if (symptoms.getMood() != null) {
            response.setMood(symptoms.getMood().name());
        }
        response.setTemperature(symptoms.getTemperature());
        response.setWeight(symptoms.getWeight());
        return response;
    }

    @Override
    public MedicineResponse toMedicineResponse(MedicineReminder reminder) {
        if (reminder == null) return null;
        return modelMapper.map(reminder, MedicineResponse.class);
    }

    @Override
    public WaterResponse toWaterResponse(WaterTracker tracker) {
        if (tracker == null) return null;
        return modelMapper.map(tracker, WaterResponse.class);
    }

    @Override
    public PartnerResponse toPartnerResponse(Partner partner) {
        if (partner == null) return null;
        PartnerResponse response = modelMapper.map(partner, PartnerResponse.class);
        response.setStatus(partner.getStatus().name());
        return response;
    }

    @Override
    public VideoResponse toVideoResponse(SelfCare video) {
        if (video == null) return null;
        VideoResponse response = modelMapper.map(video, VideoResponse.class);
        response.setCategory(video.getCategory().name());
        return response;
    }

    @Override
    public ProductResponse toProductResponse(Product product) {
        if (product == null) return null;
        return modelMapper.map(product, ProductResponse.class);
    }

    @Override
    public CartItemResponse toCartItemResponse(CartItem item) {
        if (item == null) return null;
        CartItemResponse response = new CartItemResponse();
        response.setId(item.getId());
        response.setQuantity(item.getQuantity());
        response.setPrice(item.getPrice());
        response.setSubtotal(item.getSubtotal());
        response.setProduct(toProductResponse(item.getProduct()));
        return response;
    }

    @Override
    public WishlistResponse toWishlistResponse(WishlistItem item) {
        if (item == null) return null;
        WishlistResponse response = new WishlistResponse();
        response.setId(item.getId());
        response.setProduct(toProductResponse(item.getProduct()));
        return response;
    }

    @Override
    public AddressResponse toAddressResponse(Address address) {
        if (address == null) return null;
        return modelMapper.map(address, AddressResponse.class);
    }

    @Override
    public OrderItemResponse toOrderItemResponse(OrderItem item) {
        if (item == null) return null;
        OrderItemResponse response = new OrderItemResponse();
        response.setId(item.getId());
        response.setProductId(item.getProduct().getId());
        response.setProductName(item.getProduct().getName());
        response.setQuantity(item.getQuantity());
        response.setPrice(item.getPrice());
        response.setSubtotal(item.getSubtotal());
        return response;
    }

    @Override
    public OrderResponse toOrderResponse(Order order) {
        if (order == null) return null;
        OrderResponse response = modelMapper.map(order, OrderResponse.class);
        response.setAddress(toAddressResponse(order.getAddress()));
        response.setCouponDiscount(order.getCouponDiscount());
        if (order.getCoupon() != null) {
            response.setCouponCode(order.getCoupon().getCode());
        }
        if (order.getOrderItems() != null) {
            response.setOrderItems(order.getOrderItems().stream()
                    .map(this::toOrderItemResponse)
                    .collect(Collectors.toList()));
        }
        return response;
    }

    @Override
    public NotificationResponse toNotificationResponse(Notification notification) {
        if (notification == null) return null;
        NotificationResponse response = modelMapper.map(notification, NotificationResponse.class);
        response.setType(notification.getType().name());
        return response;
    }

    @Override
    public FeedbackResponse toFeedbackResponse(Feedback feedback) {
        if (feedback == null) return null;
        FeedbackResponse response = modelMapper.map(feedback, FeedbackResponse.class);
        if (feedback.getUser() != null) {
            response.setUserEmail(feedback.getUser().getEmail());
        }
        return response;
    }
}
