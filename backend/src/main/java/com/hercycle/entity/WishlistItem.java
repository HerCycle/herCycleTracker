package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * WishlistItem Entity representing a user's wishlist item.
 * Extends Auditable.
 */
@Entity
@Table(name = "wishlist_items", uniqueConstraints = {
    @UniqueConstraint(name = "uc_wishlist_user_product", columnNames = {"user_id", "product_id"})
}, indexes = {
    @Index(name = "idx_wishlist_user", columnList = "user_id")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistItem extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
}
