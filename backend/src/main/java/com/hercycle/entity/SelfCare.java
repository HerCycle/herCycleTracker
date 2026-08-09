package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * SelfCare Entity representing videos and education resources.
 * Extends Auditable.
 */
@Entity
@Table(name = "self_care", indexes = {
    @Index(name = "idx_self_care_category", columnList = "category")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SelfCare extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private SelfCareCategory category;

    @Column(name = "thumbnail")
    private String thumbnail;

    @Column(name = "youtube_url", nullable = false)
    private String youtubeUrl;
}
