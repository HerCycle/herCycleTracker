package com.hercycle.service.impl;

import com.hercycle.dto.request.FeedbackRequest;
import com.hercycle.dto.response.FeedbackResponse;
import com.hercycle.entity.Feedback;
import com.hercycle.entity.User;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.FeedbackRepository;
import com.hercycle.service.FeedbackService;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for Feedback logs.
 */
@Service
@Transactional
public class FeedbackServiceImpl implements FeedbackService {

    private static final Logger logger = LoggerFactory.getLogger(FeedbackServiceImpl.class);

    private final FeedbackRepository feedbackRepository;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public FeedbackServiceImpl(FeedbackRepository feedbackRepository, UserService userService, EntityMapper entityMapper) {
        this.feedbackRepository = feedbackRepository;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Override
    public FeedbackResponse submitFeedback(FeedbackRequest request) {
        User user = userService.getLoggedInUser();
        logger.info("Feedback submitted by user: {}", user.getEmail());

        Feedback feedback = Feedback.builder()
                .user(user)
                .rating(request.getRating())
                .message(request.getMessage())
                .build();

        Feedback saved = feedbackRepository.save(feedback);
        return entityMapper.toFeedbackResponse(saved);
    }

    @Override
    public List<FeedbackResponse> getAllFeedback() {
        logger.info("Admin fetching all feedback records");
        return feedbackRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(entityMapper::toFeedbackResponse)
                .collect(Collectors.toList());
    }
}
