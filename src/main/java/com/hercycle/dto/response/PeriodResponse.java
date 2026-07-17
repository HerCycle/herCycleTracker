package com.hercycle.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO response representinglogged period details.
 */
@Data
public class PeriodResponse {

    private Long id;

    private LocalDate periodStartDate;

    private LocalDate periodEndDate;

    private Integer cycleLength;

    private Integer periodLength;

    private String flow;

    private String notes;

    private LocalDateTime createdAt;
}
