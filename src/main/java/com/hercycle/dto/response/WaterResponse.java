package com.hercycle.dto.response;

import lombok.Data;

import java.time.LocalDate;

/**
 * DTO response representing daily water intake details.
 */
@Data
public class WaterResponse {

    private Long id;

    private Double goal;

    private Double completed;

    private LocalDate date;
}
