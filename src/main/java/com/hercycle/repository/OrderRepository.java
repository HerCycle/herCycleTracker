package com.hercycle.repository;

import com.hercycle.entity.Order;
import com.hercycle.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Order entity.
 * Optimized using JOIN FETCH queries to solve N+1 SELECT loops.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o FROM Order o JOIN FETCH o.address LEFT JOIN FETCH o.orderItems WHERE o.user = :user ORDER BY o.orderedDate DESC")
    List<Order> findByUserOrderByOrderedDateDesc(@Param("user") User user);

    Optional<Order> findByOrderNumber(String orderNumber);
}
