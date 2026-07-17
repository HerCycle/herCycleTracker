package com.hercycle.mapper;

import com.hercycle.dto.response.*;
import com.hercycle.entity.*;

/**
 * Interface mapping database Entities to Response DTOs.
 */
public interface EntityMapper {
    UserResponse toUserResponse(User user);
    PeriodResponse toPeriodResponse(PeriodTracker period);
    SymptomResponse toSymptomResponse(Symptoms symptoms);
    MedicineResponse toMedicineResponse(MedicineReminder reminder);
    WaterResponse toWaterResponse(WaterTracker tracker);
    PartnerResponse toPartnerResponse(Partner partner);
    VideoResponse toVideoResponse(SelfCare video);
    ProductResponse toProductResponse(Product product);
    CartItemResponse toCartItemResponse(CartItem item);
    WishlistResponse toWishlistResponse(WishlistItem item);
    AddressResponse toAddressResponse(Address address);
    OrderItemResponse toOrderItemResponse(OrderItem item);
    OrderResponse toOrderResponse(Order order);
    NotificationResponse toNotificationResponse(Notification notification);
    FeedbackResponse toFeedbackResponse(Feedback feedback);
}
