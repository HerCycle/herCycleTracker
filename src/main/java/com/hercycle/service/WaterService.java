package com.hercycle.service;

import com.hercycle.dto.response.WaterResponse;

import java.util.List;

/**
 * Service interface for tracking daily water intake goal vs completion.
 */
public interface WaterService {

    WaterResponse updateGoal(Double goal);

    WaterResponse addWater(Double amount);

    WaterResponse getProgressToday();

    List<WaterResponse> getHistory();
}
