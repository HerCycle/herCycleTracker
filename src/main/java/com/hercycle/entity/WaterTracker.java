package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * WaterTracker Entity to log daily water intake.
 * Extends Auditable.
 */
@Entity
@Table(name = "water_trackers", uniqueConstraints = {
    @UniqueConstraint(name = "uc_water_user_date", columnNames = {"user_id", "date"})
}, indexes = {
    @Index(name = "idx_water_user_date", columnList = "user_id, date")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterTracker extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "goal", nullable = false)
    private Double goal;

    @Column(name = "completed", nullable = false)
    private Double completed;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @PrePersist
    protected void onWaterCreate() {
        if (this.date == null) {
            this.date = LocalDate.now();
        }
        this.completed = this.completed != null ? this.completed : 0.0;
        this.goal = this.goal != null ? this.goal : 2000.0;
    }
}
