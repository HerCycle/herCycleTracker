package com.hercycle.service;

import com.hercycle.dto.response.NotificationResponse;
import com.hercycle.entity.User;

import java.util.List;

/**
 * Service interface for logging and retrieving in-app notifications.
 */
public interface NotificationService {

    NotificationResponse createNotification(User user, String title, String message, String type);

    List<NotificationResponse> getNotifications();

    List<NotificationResponse> getUnreadNotifications();

    void markAsRead(Long id);
}
