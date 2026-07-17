package com.hercycle.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO request payload to log symptoms and moods.
 */
@Data
public class SymptomRequest {

    private LocalDate date;

    private String mood;

    @Min(value = 0, message = "Pain level cannot be less than 0")
    @Max(value = 10, message = "Pain level cannot exceed 10")
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

    @Min(value = 0, message = "Sleep hours cannot be negative")
    private Integer sleep;

    @Min(value = 0, message = "Energy level cannot be less than 0")
    @Max(value = 10, message = "Energy level cannot exceed 10")
    private Integer energy;

    @Min(value = 0, message = "Water intake cannot be negative")
    private Double waterIntake;

    private Double temperature; // BBT (Basal Body Temperature)

    private Double weight; // Weight log

    private String notes;
}
