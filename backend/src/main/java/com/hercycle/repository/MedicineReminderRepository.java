package com.hercycle.repository;

import com.hercycle.entity.MedicineReminder;
import com.hercycle.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for MedicineReminder entity.
 */
@Repository
public interface MedicineReminderRepository extends JpaRepository<MedicineReminder, Long> {

    List<MedicineReminder> findByUser(User user);

    List<MedicineReminder> findByUserAndStartDateLessThanEqualAndEndDateGreaterThanEqual(User user, LocalDate date1, LocalDate date2);
}
