package com.hercycle.service;

import com.hercycle.dto.request.FeedbackRequest;
import com.hercycle.dto.response.FeedbackResponse;

import java.util.List;

/**
 * Service interface for customer support and system improvement feedback.
 */
public interface FeedbackService {

    FeedbackResponse submitFeedback(FeedbackRequest request);

    List<FeedbackResponse> getAllFeedback();
}
