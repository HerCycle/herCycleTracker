package com.hercycle.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * DTO representing Cycle Analysis with details designed for frontend charts.
 * Extended with safety windows, lateness indicators and regularity indexes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisResponse {

    private Integer currentCycleDay;

    private Integer averageCycleLength;

    private Integer averagePeriodLength;

    private LocalDate nextPeriodDate;

    private LocalDate ovulationDate;

    private LocalDate fertilityWindowStart;

    private LocalDate fertilityWindowEnd;

    private List<LocalDate> safeDays;

    private Double cycleRegularityScore;

    private Boolean latePeriod;

    private Boolean irregularCycle;

    private List<Map<String, Object>> monthlyStats;

    private List<Map<String, Object>> yearlyStats;
}
