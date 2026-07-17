package com.hercycle.repository;

import com.hercycle.entity.Notification;
import com.hercycle.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Notification entity.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserOrderByScheduledTimeDesc(User user);

    List<Notification> findByUserAndReadFalseOrderByScheduledTimeDesc(User user);
}
