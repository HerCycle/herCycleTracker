package com.hercycle.repository;

import com.hercycle.entity.Partner;
import com.hercycle.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Partner entity.
 */
@Repository
public interface PartnerRepository extends JpaRepository<Partner, Long> {

    Optional<Partner> findByUser(User user);

    Optional<Partner> findByPartnerEmail(String partnerEmail);

    Optional<Partner> findByUserAndPartnerEmail(User user, String partnerEmail);

    List<Partner> findByUserOrPartnerEmail(User user, String partnerEmail);
}
