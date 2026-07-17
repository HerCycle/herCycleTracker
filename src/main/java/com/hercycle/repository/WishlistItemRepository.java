package com.hercycle.repository;

import com.hercycle.entity.Product;
import com.hercycle.entity.User;
import com.hercycle.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for WishlistItem entity.
 * Optimized using JOIN FETCH.
 */
@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    @Query("SELECT w FROM WishlistItem w JOIN FETCH w.product WHERE w.user = :user")
    List<WishlistItem> findByUser(@Param("user") User user);

    Optional<WishlistItem> findByUserAndProduct(User user, Product product);
}
