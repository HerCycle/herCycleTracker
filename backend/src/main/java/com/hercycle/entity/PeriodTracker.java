package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * PeriodTracker Entity to record menstrual logs.
 * Extends Auditable for audit capabilities.
 */
@Entity
@Table(name = "periods", indexes = {
    @Index(name = "idx_period_user_date", columnList = "user_id, period_start_date")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeriodTracker extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "period_start_date", nullable = false)
    private LocalDate periodStartDate;

    @Column(name = "period_end_date")
    private LocalDate periodEndDate;

    @Column(name = "cycle_length")
    private Integer cycleLength;

    @Column(name = "period_length")
    private Integer periodLength;

    @Enumerated(EnumType.STRING)
    @Column(name = "flow")
    private Flow flow;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    @PreUpdate
    protected void onPeriodSave() {
        if (this.periodStartDate != null && this.periodEndDate != null) {
            this.periodLength = (int) ChronoUnit.DAYS.between(this.periodStartDate, this.periodEndDate) + 1;
        }
    }
}
