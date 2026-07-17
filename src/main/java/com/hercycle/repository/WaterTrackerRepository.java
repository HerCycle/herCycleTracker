package com.hercycle.repository;

import com.hercycle.entity.WaterTracker;
import com.hercycle.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for WaterTracker entity.
 */
@Repository
public interface WaterTrackerRepository extends JpaRepository<WaterTracker, Long> {

    Optional<WaterTracker> findByUserAndDate(User user, LocalDate date);

    List<WaterTracker> findByUserOrderByDateDesc(User user);
}
