package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Symptoms Entity representing daily health log entries.
 * Extends Auditable to incorporate database logging markers.
 */
@Entity
@Table(name = "symptoms", indexes = {
    @Index(name = "idx_symptoms_user_date", columnList = "user_id, date")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Symptoms extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "mood")
    private Mood mood;

    @Column(name = "pain")
    private Integer pain; // Pain rating, scale of 1-10

    @Column(name = "cramps")
    private Boolean cramps;

    @Column(name = "headache")
    private Boolean headache;

    @Column(name = "back_pain")
    private Boolean backPain;

    @Column(name = "bloating")
    private Boolean bloating;

    @Column(name = "acne")
    private Boolean acne;

    @Column(name = "fatigue")
    private Boolean fatigue;

    @Column(name = "nausea")
    private Boolean nausea;

    @Column(name = "cravings")
    private Boolean cravings;

    @Column(name = "breast_pain")
    private Boolean breastPain;

    @Column(name = "sleep")
    private Integer sleep; // Sleep quality / hours

    @Column(name = "energy")
    private Integer energy; // Energy rating, scale of 1-10

    @Column(name = "water_intake")
    private Double waterIntake; // Water consumed in ml

    @Column(name = "temperature")
    private Double temperature; // Basal Body Temperature (BBT)

    @Column(name = "weight")
    private Double weight; // Weight tracking

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    protected void onSymptomCreate() {
        if (this.date == null) {
            this.date = LocalDate.now();
        }
        this.cramps = this.cramps != null ? this.cramps : false;
        this.headache = this.headache != null ? this.headache : false;
        this.backPain = this.backPain != null ? this.backPain : false;
        this.bloating = this.bloating != null ? this.bloating : false;
        this.acne = this.acne != null ? this.acne : false;
        this.fatigue = this.fatigue != null ? this.fatigue : false;
        this.nausea = this.nausea != null ? this.nausea : false;
        this.cravings = this.cravings != null ? this.cravings : false;
        this.breastPain = this.breastPain != null ? this.breastPain : false;
        this.waterIntake = this.waterIntake != null ? this.waterIntake : 0.0;
    }
}
