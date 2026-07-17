package com.hercycle.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO request payload to update water tracker details.
 */
@Data
public class WaterRequest {

    private Double goal; // Daily target in ml

    private Double completed; // Added water intake in ml

    private LocalDate date;
}
