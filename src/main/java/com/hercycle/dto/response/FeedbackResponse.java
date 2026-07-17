package com.hercycle.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO response representing user feedback log details.
 */
@Data
public class FeedbackResponse {

    private Long id;

    private String userEmail;

    private Integer rating;

    private String message;

    private LocalDateTime createdAt;
}
