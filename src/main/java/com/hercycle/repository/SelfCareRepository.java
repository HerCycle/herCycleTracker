package com.hercycle.repository;

import com.hercycle.entity.SelfCare;
import com.hercycle.entity.SelfCareCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for SelfCare entity.
 */
@Repository
public interface SelfCareRepository extends JpaRepository<SelfCare, Long> {

    List<SelfCare> findByCategory(SelfCareCategory category);

    List<SelfCare> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String description);
}
