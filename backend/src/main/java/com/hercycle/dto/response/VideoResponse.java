package com.hercycle.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO response representing uploaded self-care video details.
 */
@Data
public class VideoResponse {

    private Long id;

    private String title;

    private String description;

    private String category;

    private String thumbnail;

    private String youtubeUrl;

    private LocalDateTime createdAt;
}
