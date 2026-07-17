package com.hercycle.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO response representing user alerts/notifications.
 */
@Data
public class NotificationResponse {

    private Long id;

    private String title;

    private String message;

    private String type;

    private LocalDateTime scheduledTime;

    private Boolean read;
}
