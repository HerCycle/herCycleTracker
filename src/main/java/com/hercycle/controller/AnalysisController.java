package com.hercycle.controller;

import com.hercycle.dto.ApiResponse;
import com.hercycle.dto.response.AnalysisResponse;
import com.hercycle.service.AnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller to fetch menstrual cycle analytics for charts.
 */
@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<AnalysisResponse>> getAnalysis() {
        AnalysisResponse response = analysisService.getAnalysis();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
