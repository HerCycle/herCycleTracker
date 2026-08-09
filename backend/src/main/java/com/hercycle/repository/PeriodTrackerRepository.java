package com.hercycle.repository;

import com.hercycle.entity.PeriodTracker;
import com.hercycle.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for PeriodTracker entity.
 */
@Repository
public interface PeriodTrackerRepository extends JpaRepository<PeriodTracker, Long> {

    List<PeriodTracker> findByUserOrderByPeriodStartDateDesc(User user);

    Optional<PeriodTracker> findFirstByUserOrderByPeriodStartDateDesc(User user);

    List<PeriodTracker> findByUserAndPeriodStartDateBetween(User user, LocalDate start, LocalDate end);
}
