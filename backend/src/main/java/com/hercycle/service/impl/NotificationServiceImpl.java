package com.hercycle.service.impl;

import com.hercycle.dto.response.NotificationResponse;
import com.hercycle.entity.Notification;
import com.hercycle.entity.NotificationType;
import com.hercycle.entity.User;
import com.hercycle.exception.BadRequestException;
import com.hercycle.exception.ResourceNotFoundException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.NotificationRepository;
import com.hercycle.service.NotificationService;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for Notifications.
 */
@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UserService userService, EntityMapper entityMapper) {
        this.notificationRepository = notificationRepository;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Override
    public NotificationResponse createNotification(User user, String title, String message, String type) {
        logger.info("Creating notification '{}' for user {}", title, user.getEmail());
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(NotificationType.valueOf(type.toUpperCase()))
                .scheduledTime(LocalDateTime.now())
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        return entityMapper.toNotificationResponse(saved);
    }

    @Override
    public List<NotificationResponse> getNotifications() {
        User user = userService.getLoggedInUser();
        return notificationRepository.findByUserOrderByScheduledTimeDesc(user).stream()
                .map(entityMapper::toNotificationResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationResponse> getUnreadNotifications() {
        User user = userService.getLoggedInUser();
        return notificationRepository.findByUserAndReadFalseOrderByScheduledTimeDesc(user).stream()
                .map(entityMapper::toNotificationResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void markAsRead(Long id) {
        User user = userService.getLoggedInUser();
        logger.info("Marking notification ID {} as read for user {}", id, user.getEmail());

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + id));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to notification record");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }
}
