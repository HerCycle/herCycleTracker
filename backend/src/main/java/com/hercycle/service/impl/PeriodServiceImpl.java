package com.hercycle.service.impl;

import com.hercycle.dto.request.PeriodRequest;
import com.hercycle.dto.response.PeriodResponse;
import com.hercycle.entity.Flow;
import com.hercycle.entity.PeriodTracker;
import com.hercycle.entity.User;
import com.hercycle.exception.BadRequestException;
import com.hercycle.exception.ResourceNotFoundException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.PeriodTrackerRepository;
import com.hercycle.service.PeriodService;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for period tracking logic and mathematical calculations.
 */
@Service
@Transactional
public class PeriodServiceImpl implements PeriodService {

    private static final Logger logger = LoggerFactory.getLogger(PeriodServiceImpl.class);

    private final PeriodTrackerRepository periodRepository;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public PeriodServiceImpl(PeriodTrackerRepository periodRepository, UserService userService, EntityMapper entityMapper) {
        this.periodRepository = periodRepository;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Override
    public PeriodResponse savePeriod(PeriodRequest request) {
        User user = userService.getLoggedInUser();
        logger.info("Logging new period start date {} for user {}", request.getPeriodStartDate(), user.getEmail());

        PeriodTracker period = PeriodTracker.builder()
                .user(user)
                .periodStartDate(request.getPeriodStartDate())
                .periodEndDate(request.getPeriodEndDate())
                .flow(request.getFlow() != null ? Flow.valueOf(request.getFlow().toUpperCase()) : Flow.MEDIUM)
                .notes(request.getNotes())
                .build();

        List<PeriodTracker> history = periodRepository.findByUserOrderByPeriodStartDateDesc(user);
        if (!history.isEmpty()) {
            PeriodTracker lastPeriod = history.get(0);
            if (period.getPeriodStartDate().isAfter(lastPeriod.getPeriodStartDate())) {
                long days = ChronoUnit.DAYS.between(lastPeriod.getPeriodStartDate(), period.getPeriodStartDate());
                period.setCycleLength((int) days);
            }
        }

        PeriodTracker saved = periodRepository.save(period);
        return entityMapper.toPeriodResponse(saved);
    }

    @Override
    public PeriodResponse updatePeriod(Long id, PeriodRequest request) {
        User user = userService.getLoggedInUser();
        logger.info("Updating period log ID {} for user {}", id, user.getEmail());

        PeriodTracker period = periodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Period log not found with ID: " + id));

        if (!period.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to period log");
        }

        period.setPeriodStartDate(request.getPeriodStartDate());
        period.setPeriodEndDate(request.getPeriodEndDate());
        if (request.getFlow() != null) {
            period.setFlow(Flow.valueOf(request.getFlow().toUpperCase()));
        }
        period.setNotes(request.getNotes());

        if (period.getPeriodStartDate() != null && period.getPeriodEndDate() != null) {
            period.setPeriodLength((int) ChronoUnit.DAYS.between(period.getPeriodStartDate(), period.getPeriodEndDate()) + 1);
        }

        PeriodTracker updated = periodRepository.save(period);
        return entityMapper.toPeriodResponse(updated);
    }

    @Override
    public void deletePeriod(Long id) {
        User user = userService.getLoggedInUser();
        logger.info("Deleting period log ID {} for user {}", id, user.getEmail());

        PeriodTracker period = periodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Period log not found with ID: " + id));

        if (!period.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to period log");
        }

        periodRepository.delete(period);
    }

    @Override
    public PeriodResponse getTodayPeriod() {
        User user = userService.getLoggedInUser();
        LocalDate today = LocalDate.now();
        List<PeriodTracker> history = periodRepository.findByUserOrderByPeriodStartDateDesc(user);
        for (PeriodTracker p : history) {
            LocalDate start = p.getPeriodStartDate();
            LocalDate end = p.getPeriodEndDate() != null ? p.getPeriodEndDate() : start.plusDays(4);
            if (!today.isBefore(start) && !today.isAfter(end)) {
                return entityMapper.toPeriodResponse(p);
            }
        }
        return null;
    }

    @Override
    public PeriodResponse getCurrentPeriod() {
        User user = userService.getLoggedInUser();
        return periodRepository.findFirstByUserOrderByPeriodStartDateDesc(user)
                .map(entityMapper::toPeriodResponse)
                .orElse(null);
    }

    @Override
    public List<PeriodResponse> getPeriodHistory() {
        User user = userService.getLoggedInUser();
        return periodRepository.findByUserOrderByPeriodStartDateDesc(user).stream()
                .map(entityMapper::toPeriodResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PeriodResponse> getPeriodCalendar() {
        return getPeriodHistory();
    }

    @Override
    public List<LocalDate> getNextPeriodPredictions() {
        User user = userService.getLoggedInUser();
        int avgCycle = calculateAverageCycleLength(user);
        
        PeriodTracker latest = periodRepository.findFirstByUserOrderByPeriodStartDateDesc(user).orElse(null);
        if (latest == null) {
            return Collections.emptyList();
        }

        List<LocalDate> predictions = new ArrayList<>();
        LocalDate currentStart = latest.getPeriodStartDate();
        for (int i = 1; i <= 6; i++) {
            currentStart = currentStart.plusDays(avgCycle);
            predictions.add(currentStart);
        }
        return predictions;
    }

    @Override
    public List<LocalDate> getOvulationPredictions() {
        List<LocalDate> nextPeriods = getNextPeriodPredictions();
        return nextPeriods.stream()
                .map(d -> d.minusDays(14))
                .collect(Collectors.toList());
    }

    @Override
    public List<LocalDate> getFertilityPredictions() {
        List<LocalDate> ovulations = getOvulationPredictions();
        List<LocalDate> fertilityWindow = new ArrayList<>();
        for (LocalDate ovulation : ovulations) {
            for (int i = -5; i <= 1; i++) {
                fertilityWindow.add(ovulation.plusDays(i));
            }
        }
        return fertilityWindow.stream().distinct().sorted().collect(Collectors.toList());
    }

    @Override
    public List<LocalDate> getSafeDays() {
        User user = userService.getLoggedInUser();
        PeriodTracker latest = periodRepository.findFirstByUserOrderByPeriodStartDateDesc(user).orElse(null);
        if (latest == null) {
            return Collections.emptyList();
        }

        int avgCycle = calculateAverageCycleLength(user);
        int avgPeriod = calculateAveragePeriodLength(user);

        LocalDate cycleStart = latest.getPeriodStartDate();
        LocalDate nextPeriodStart = cycleStart.plusDays(avgCycle);
        LocalDate ovulation = nextPeriodStart.minusDays(14);

        // Fertile Window: [Ovulation - 5, Ovulation + 1]
        LocalDate fertileStart = ovulation.minusDays(5);
        LocalDate fertileEnd = ovulation.plusDays(1);

        // Period bleeding: [CycleStart, CycleStart + avgPeriod - 1]
        LocalDate bleedingEnd = cycleStart.plusDays(avgPeriod - 1);

        List<LocalDate> safeDays = new ArrayList<>();
        LocalDate current = cycleStart;
        while (current.isBefore(nextPeriodStart)) {
            boolean isBleeding = !current.isBefore(cycleStart) && !current.isAfter(bleedingEnd);
            boolean isFertile = !current.isBefore(fertileStart) && !current.isAfter(fertileEnd);

            if (!isBleeding && !isFertile) {
                safeDays.add(current);
            }
            current = current.plusDays(1);
        }
        return safeDays;
    }

    @Override
    public Double getCycleRegularityScore() {
        User user = userService.getLoggedInUser();
        double stdDev = calculateCycleStandardDeviation(user);
        if (stdDev < 0) {
            return 100.0; // Assume perfect score if not enough data points
        }
        double score = 100.0 - (stdDev * 10);
        return Math.max(0.0, Math.min(100.0, score));
    }

    @Override
    public Boolean isLatePeriod() {
        User user = userService.getLoggedInUser();
        PeriodTracker latest = periodRepository.findFirstByUserOrderByPeriodStartDateDesc(user).orElse(null);
        if (latest == null) {
            return false;
        }
        int avgCycle = calculateAverageCycleLength(user);
        long daysSinceLastPeriod = ChronoUnit.DAYS.between(latest.getPeriodStartDate(), LocalDate.now()) + 1;
        return daysSinceLastPeriod > (avgCycle + 5);
    }

    @Override
    public Boolean isIrregularCycle() {
        User user = userService.getLoggedInUser();
        double stdDev = calculateCycleStandardDeviation(user);
        return stdDev > 4.0; // Standard deviation greater than 4 days signals irregularity
    }

    // Helper to calculate cycle length standard deviation
    private double calculateCycleStandardDeviation(User user) {
        List<PeriodTracker> list = periodRepository.findByUserOrderByPeriodStartDateDesc(user);
        if (list.size() < 3) {
            return -1.0; // Insufficient data to calculate standard deviation
        }

        List<Double> cycleLengths = new ArrayList<>();
        for (int i = 0; i < list.size() - 1; i++) {
            long days = ChronoUnit.DAYS.between(list.get(i + 1).getPeriodStartDate(), list.get(i).getPeriodStartDate());
            if (days > 15 && days < 45) {
                cycleLengths.add((double) days);
            }
        }

        if (cycleLengths.size() < 2) {
            return -1.0;
        }

        double sum = 0.0;
        for (double val : cycleLengths) {
            sum += val;
        }
        double mean = sum / cycleLengths.size();

        double sqSum = 0.0;
        for (double val : cycleLengths) {
            sqSum += Math.pow(val - mean, 2);
        }

        return Math.sqrt(sqSum / (cycleLengths.size() - 1));
    }

    private int calculateAverageCycleLength(User user) {
        List<PeriodTracker> list = periodRepository.findByUserOrderByPeriodStartDateDesc(user);
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

    private int calculateAveragePeriodLength(User user) {
        List<PeriodTracker> list = periodRepository.findByUserOrderByPeriodStartDateDesc(user);
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
}
