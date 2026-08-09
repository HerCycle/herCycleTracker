package com.hercycle.controller;

import com.hercycle.dto.ApiResponse;
import com.hercycle.dto.response.NotificationResponse;
import com.hercycle.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for User in-app notifications/alerts.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(
            @RequestParam(required = false, defaultValue = "false") boolean unreadOnly) {
        List<NotificationResponse> response;
        if (unreadOnly) {
            response = notificationService.getUnreadNotifications();
        } else {
            response = notificationService.getNotifications();
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read"));
    }
}
