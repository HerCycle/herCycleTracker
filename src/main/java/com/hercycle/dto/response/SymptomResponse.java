package com.hercycle.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO response representinglogged symptoms and moods.
 */
@Data
public class SymptomResponse {

    private Long id;

    private LocalDate date;

    private String mood;

    private Integer pain;

    private Boolean cramps;

    private Boolean headache;

    private Boolean backPain;

    private Boolean bloating;

    private Boolean acne;

    private Boolean fatigue;

    private Boolean nausea;

    private Boolean cravings;

    private Boolean breastPain;

    private Integer sleep;

    private Integer energy;

    private Double waterIntake;

    private Double temperature;

    private Double weight;

    private String notes;

    private LocalDateTime createdAt;
}
