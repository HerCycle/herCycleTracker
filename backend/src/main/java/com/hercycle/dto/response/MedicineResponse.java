package com.hercycle.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO response representing medicine reminders.
 */
@Data
public class MedicineResponse {

    private Long id;

    private String medicineName;

    private String dosage;

    private LocalTime time;

    private String frequency;

    private LocalDate startDate;

    private LocalDate endDate;

    private Boolean completed;
}
