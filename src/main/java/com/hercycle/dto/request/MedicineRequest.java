package com.hercycle.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO request payload to create/update medicine reminders.
 */
@Data
public class MedicineRequest {

    @NotBlank(message = "Medicine name is required")
    private String medicineName;

    private String dosage; // e.g. "1 pill", "5ml"

    @NotNull(message = "Reminder time is required")
    private LocalTime time;

    private String frequency; // e.g. "DAILY", "WEEKLY"

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;
}
