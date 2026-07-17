package com.hercycle.controller;

import com.hercycle.dto.ApiResponse;
import com.hercycle.dto.request.FeedbackRequest;
import com.hercycle.dto.response.FeedbackResponse;
import com.hercycle.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for User feedbacks submission and Admin review.
 */
@RestController
@RequestMapping("/api")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<FeedbackResponse>> submitFeedback(@Valid @RequestBody FeedbackRequest request) {
        FeedbackResponse response = feedbackService.submitFeedback(request);
        return ResponseEntity.ok(ApiResponse.success("Feedback submitted successfully", response));
    }

    @GetMapping("/admin/feedback")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> getAllFeedback() {
        List<FeedbackResponse> response = feedbackService.getAllFeedback();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
