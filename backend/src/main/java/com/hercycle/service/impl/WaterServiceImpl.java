package com.hercycle.service.impl;

import com.hercycle.dto.response.WaterResponse;
import com.hercycle.entity.WaterTracker;
import com.hercycle.entity.User;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.WaterTrackerRepository;
import com.hercycle.service.WaterService;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service implementation for WaterTracker.
 */
@Service
@Transactional
public class WaterServiceImpl implements WaterService {

    private static final Logger logger = LoggerFactory.getLogger(WaterServiceImpl.class);

    private final WaterTrackerRepository waterRepository;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public WaterServiceImpl(WaterTrackerRepository waterRepository, UserService userService, EntityMapper entityMapper) {
        this.waterRepository = waterRepository;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Override
    public WaterResponse updateGoal(Double goal) {
        User user = userService.getLoggedInUser();
        LocalDate today = LocalDate.now();
        logger.info("Updating daily water intake goal to {} ml for user {}", goal, user.getEmail());

        WaterTracker tracker = getOrCreateDailyTracker(user, today);
        tracker.setGoal(goal);
        
        WaterTracker saved = waterRepository.save(tracker);
        return entityMapper.toWaterResponse(saved);
    }

    @Override
    public WaterResponse addWater(Double amount) {
        User user = userService.getLoggedInUser();
        LocalDate today = LocalDate.now();
        logger.info("Adding {} ml of water intake for user {}", amount, user.getEmail());

        WaterTracker tracker = getOrCreateDailyTracker(user, today);
        tracker.setCompleted(tracker.getCompleted() + amount);

        WaterTracker saved = waterRepository.save(tracker);
        return entityMapper.toWaterResponse(saved);
    }

    @Override
    public WaterResponse getProgressToday() {
        User user = userService.getLoggedInUser();
        LocalDate today = LocalDate.now();
        WaterTracker tracker = getOrCreateDailyTracker(user, today);
        return entityMapper.toWaterResponse(tracker);
    }

    @Override
    public List<WaterResponse> getHistory() {
        User user = userService.getLoggedInUser();
        return waterRepository.findByUserOrderByDateDesc(user).stream()
                .map(entityMapper::toWaterResponse)
                .collect(Collectors.toList());
    }

    // Helper to get today's tracker or create one with default settings
    private WaterTracker getOrCreateDailyTracker(User user, LocalDate date) {
        Optional<WaterTracker> existing = waterRepository.findByUserAndDate(user, date);
        if (existing.isPresent()) {
            return existing.get();
        }
        
        WaterTracker tracker = WaterTracker.builder()
                .user(user)
                .date(date)
                .goal(2000.0) // default 2L daily goal
                .completed(0.0)
                .build();
        return waterRepository.save(tracker);
    }
}
