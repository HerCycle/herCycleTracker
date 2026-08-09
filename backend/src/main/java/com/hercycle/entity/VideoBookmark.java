package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * VideoBookmark Entity representing user bookmarked self-care resources.
 * Extends Auditable.
 */
@Entity
@Table(name = "video_bookmarks", uniqueConstraints = {
    @UniqueConstraint(name = "uc_bookmark_user_video", columnNames = {"user_id", "video_id"})
}, indexes = {
    @Index(name = "idx_bookmark_user", columnList = "user_id")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoBookmark extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    private SelfCare video;
}
