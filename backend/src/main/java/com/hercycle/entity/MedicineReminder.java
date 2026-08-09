package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * MedicineReminder Entity for user pill and medicine alerts.
 * Extends Auditable.
 */
@Entity
@Table(name = "medicine_reminders", indexes = {
    @Index(name = "idx_medicine_user", columnList = "user_id")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineReminder extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName;

    @Column(name = "dosage")
    private String dosage;

    @Column(name = "time", nullable = false)
    private LocalTime time;

    @Column(name = "frequency")
    private String frequency;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "completed")
    private Boolean completed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @PrePersist
    protected void onReminderCreate() {
        this.completed = this.completed != null ? this.completed : false;
        if (this.startDate == null) {
            this.startDate = LocalDate.now();
        }
    }
}
