package com.hercycle.repository;

import com.hercycle.entity.Symptoms;
import com.hercycle.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Symptoms entity.
 */
@Repository
public interface SymptomsRepository extends JpaRepository<Symptoms, Long> {

    Optional<Symptoms> findByUserAndDate(User user, LocalDate date);

    List<Symptoms> findByUserOrderByDateDesc(User user);

    List<Symptoms> findByUserAndDateBetweenOrderByDateDesc(User user, LocalDate start, LocalDate end);
}
