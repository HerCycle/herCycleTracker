package com.hercycle.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO request payload to log menstrual period.
 */
@Data
public class PeriodRequest {

    @NotNull(message = "Start date is required")
    private LocalDate periodStartDate;

    private LocalDate periodEndDate;

    private String flow; // String corresponding to Flow enum values (LIGHT, MEDIUM, etc.)

    private String notes;
}
