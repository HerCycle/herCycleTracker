package com.hercycle.service;

import com.hercycle.dto.request.PeriodRequest;
import com.hercycle.dto.response.PeriodResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * Service interface for menstrual period tracking and predictions.
 */
public interface PeriodService {

    PeriodResponse savePeriod(PeriodRequest request);

    PeriodResponse updatePeriod(Long id, PeriodRequest request);

    void deletePeriod(Long id);

    PeriodResponse getTodayPeriod();

    PeriodResponse getCurrentPeriod();

    List<PeriodResponse> getPeriodHistory();

    List<PeriodResponse> getPeriodCalendar();

    List<LocalDate> getNextPeriodPredictions(); // Returns next 6 cycles

    List<LocalDate> getOvulationPredictions(); // Returns next 6 ovulation dates

    List<LocalDate> getFertilityPredictions(); // Returns next fertility window

    List<LocalDate> getSafeDays(); // Returns low-risk days for current cycle

    Double getCycleRegularityScore(); // Returns score between 0.0 and 100.0

    Boolean isLatePeriod(); // Returns if current cycle is late

    Boolean isIrregularCycle(); // Returns if standard deviation is high
}
