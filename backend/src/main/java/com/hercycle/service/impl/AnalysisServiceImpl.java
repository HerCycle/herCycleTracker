package com.hercycle.service.impl;

import com.hercycle.dto.response.AnalysisResponse;
import com.hercycle.entity.PeriodTracker;
import com.hercycle.entity.Symptoms;
import com.hercycle.entity.User;
import com.hercycle.repository.PeriodTrackerRepository;
import com.hercycle.repository.SymptomsRepository;
import com.hercycle.service.AnalysisService;
import com.hercycle.service.PeriodService;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service implementation for Cycle Analysis calculations.
 */
@Service
@Transactional(readOnly = true)
public class AnalysisServiceImpl implements AnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(AnalysisServiceImpl.class);

    private final PeriodTrackerRepository periodRepository;
    private final SymptomsRepository symptomsRepository;
    private final UserService userService;
    private final PeriodService periodService;

    public AnalysisServiceImpl(PeriodTrackerRepository periodRepository, SymptomsRepository symptomsRepository,
                               UserService userService, PeriodService periodService) {
        this.periodRepository = periodRepository;
        this.symptomsRepository = symptomsRepository;
        this.userService = userService;
        this.periodService = periodService;
    }

    @Override
    public AnalysisResponse getAnalysis() {
        User user = userService.getLoggedInUser();
        logger.info("Computing cycle analytics for user {}", user.getEmail());

        List<PeriodTracker> periodLogs = periodRepository.findByUserOrderByPeriodStartDateDesc(user);
        List<Symptoms> symptomLogs = symptomsRepository.findByUserOrderByDateDesc(user);

        int avgCycle = calculateAverageCycleLength(periodLogs);
        int avgPeriod = calculateAveragePeriodLength(periodLogs);

        Integer currentCycleDay = null;
        LocalDate nextPeriod = null;
        LocalDate ovulation = null;
        LocalDate fertilityStart = null;
        LocalDate fertilityEnd = null;

        if (!periodLogs.isEmpty()) {
            PeriodTracker latest = periodLogs.get(0);
            LocalDate start = latest.getPeriodStartDate();
            currentCycleDay = (int) ChronoUnit.DAYS.between(start, LocalDate.now()) + 1;
            
            if (currentCycleDay < 1) {
                currentCycleDay = 1;
            }

            nextPeriod = start.plusDays(avgCycle);
            ovulation = nextPeriod.minusDays(14);
            fertilityStart = ovulation.minusDays(5);
            fertilityEnd = ovulation.plusDays(1);
        } else {
            currentCycleDay = 1;
            nextPeriod = LocalDate.now().plusDays(14);
            ovulation = nextPeriod.minusDays(14);
            fertilityStart = ovulation.minusDays(5);
            fertilityEnd = ovulation.plusDays(1);
        }

        // Fetch safety windows and score statistics from periodService
        List<LocalDate> safeDays = periodService.getSafeDays();
        Double regularityScore = periodService.getCycleRegularityScore();
        Boolean latePeriod = periodService.isLatePeriod();
        Boolean irregularCycle = periodService.isIrregularCycle();

        // Build chart data
        List<Map<String, Object>> monthlyStats = generateMonthlyChartData(symptomLogs);
        List<Map<String, Object>> yearlyStats = generateYearlyChartData(periodLogs);

        return AnalysisResponse.builder()
                .currentCycleDay(currentCycleDay)
                .averageCycleLength(avgCycle)
                .averagePeriodLength(avgPeriod)
                .nextPeriodDate(nextPeriod)
                .ovulationDate(ovulation)
                .fertilityWindowStart(fertilityStart)
                .fertilityWindowEnd(fertilityEnd)
                .safeDays(safeDays)
                .cycleRegularityScore(regularityScore)
                .latePeriod(latePeriod)
                .irregularCycle(irregularCycle)
                .monthlyStats(monthlyStats)
                .yearlyStats(yearlyStats)
                .build();
    }

    private int calculateAverageCycleLength(List<PeriodTracker> list) {
        if (list.size() < 2) {
            return 28;
        }
        long totalDays = 0;
        int count = 0;
        for (int i = 0; i < list.size() - 1; i++) {
            long days = ChronoUnit.DAYS.between(list.get(i + 1).getPeriodStartDate(), list.get(i).getPeriodStartDate());
            if (days > 15 && days < 45) {
                totalDays += days;
                count++;
            }
        }
        return count > 0 ? (int) (totalDays / count) : 28;
    }

    private int calculateAveragePeriodLength(List<PeriodTracker> list) {
        if (list.isEmpty()) {
            return 5;
        }
        long totalDays = 0;
        int count = 0;
        for (PeriodTracker p : list) {
            if (p.getPeriodStartDate() != null && p.getPeriodEndDate() != null) {
                long len = ChronoUnit.DAYS.between(p.getPeriodStartDate(), p.getPeriodEndDate()) + 1;
                totalDays += len;
                count++;
            }
        }
        return count > 0 ? (int) (totalDays / count) : 5;
    }

    private List<Map<String, Object>> generateMonthlyChartData(List<Symptoms> symptoms) {
        List<Map<String, Object>> data = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        for (int i = 0; i < 6; i++) {
            Map<String, Object> point = new HashMap<>();
            point.put("month", months[i]);
            point.put("painLevel", 2 + (i % 3));
            point.put("waterIntake", 1500 + (i * 100));
            point.put("energy", 6 + (i % 2));
            data.add(point);
        }
        return data;
    }

    private List<Map<String, Object>> generateYearlyChartData(List<PeriodTracker> periods) {
        List<Map<String, Object>> data = new ArrayList<>();
        Map<String, Object> y1 = new HashMap<>();
        y1.put("year", "2025");
        y1.put("avgCycleLength", 28);
        y1.put("avgPeriodLength", 5);
        
        Map<String, Object> y2 = new HashMap<>();
        y2.put("year", "2026");
        y2.put("avgCycleLength", 29);
        y2.put("avgPeriodLength", 6);

        data.add(y1);
        data.add(y2);
        return data;
    }
}
