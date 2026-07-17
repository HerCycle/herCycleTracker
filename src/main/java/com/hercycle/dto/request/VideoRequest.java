package com.hercycle.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO request payload for Admin uploading self-care videos.
 */
@Data
public class VideoRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Category is required")
    private String category; // maps to SelfCareCategory enum

    private String thumbnail;

    @NotBlank(message = "YouTube URL is required")
    private String youtubeUrl;
}
