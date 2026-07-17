package com.hercycle.controller;

import com.hercycle.dto.ApiResponse;
import com.hercycle.dto.request.PeriodRequest;
import com.hercycle.dto.response.PeriodResponse;
import com.hercycle.service.PeriodService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller for logging periods and fetching predicted details.
 */
@RestController
@RequestMapping("/api/period")
public class PeriodController {

    private final PeriodService periodService;

    public PeriodController(PeriodService periodService) {
        this.periodService = periodService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PeriodResponse>> savePeriod(@Valid @RequestBody PeriodRequest request) {
        PeriodResponse response = periodService.savePeriod(request);
        return ResponseEntity.ok(ApiResponse.success("Period logged successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PeriodResponse>> updatePeriod(@PathVariable Long id, @Valid @RequestBody PeriodRequest request) {
        PeriodResponse response = periodService.updatePeriod(id, request);
        return ResponseEntity.ok(ApiResponse.success("Period log updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePeriod(@PathVariable Long id) {
        periodService.deletePeriod(id);
        return ResponseEntity.ok(ApiResponse.success("Period log deleted successfully"));
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<PeriodResponse>> getTodayPeriod() {
        PeriodResponse response = periodService.getTodayPeriod();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<PeriodResponse>> getCurrentPeriod() {
        PeriodResponse response = periodService.getCurrentPeriod();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<PeriodResponse>>> getPeriodHistory() {
        List<PeriodResponse> response = periodService.getPeriodHistory();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/calendar")
    public ResponseEntity<ApiResponse<List<PeriodResponse>>> getPeriodCalendar() {
        List<PeriodResponse> response = periodService.getPeriodCalendar();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/next")
    public ResponseEntity<ApiResponse<List<LocalDate>>> getNextPeriodPredictions() {
        List<LocalDate> response = periodService.getNextPeriodPredictions();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/ovulation")
    public ResponseEntity<ApiResponse<List<LocalDate>>> getOvulationPredictions() {
        List<LocalDate> response = periodService.getOvulationPredictions();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/fertility")
    public ResponseEntity<ApiResponse<List<LocalDate>>> getFertilityPredictions() {
        List<LocalDate> response = periodService.getFertilityPredictions();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/safe-days")
    public ResponseEntity<ApiResponse<List<LocalDate>>> getSafeDays() {
        List<LocalDate> response = periodService.getSafeDays();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/regularity-score")
    public ResponseEntity<ApiResponse<Double>> getCycleRegularityScore() {
        Double response = periodService.getCycleRegularityScore();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/is-late")
    public ResponseEntity<ApiResponse<Boolean>> isLatePeriod() {
        Boolean response = periodService.isLatePeriod();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/is-irregular")
    public ResponseEntity<ApiResponse<Boolean>> isIrregularCycle() {
        Boolean response = periodService.isIrregularCycle();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
