package com.hercycle.service;

import com.hercycle.dto.response.AnalysisResponse;

/**
 * Service interface for cycle analysis statistics, formatted for frontend/Angular charts.
 */
public interface AnalysisService {

    AnalysisResponse getAnalysis();
}
