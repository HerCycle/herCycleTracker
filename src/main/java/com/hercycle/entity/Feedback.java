package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Feedback Entity representing user feedback and ratings.
 * Extends Auditable.
 */
@Entity
@Table(name = "feedbacks")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;
}
