package com.hercycle.controller;

import com.hercycle.dto.ApiResponse;
import com.hercycle.dto.request.SymptomRequest;
import com.hercycle.dto.response.SymptomResponse;
import com.hercycle.service.SymptomService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller for logging daily physical symptoms and moods.
 */
@RestController
@RequestMapping("/api/symptoms")
public class SymptomController {

    private final SymptomService symptomService;

    public SymptomController(SymptomService symptomService) {
        this.symptomService = symptomService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SymptomResponse>> saveSymptoms(@Valid @RequestBody SymptomRequest request) {
        SymptomResponse response = symptomService.saveSymptoms(request);
        return ResponseEntity.ok(ApiResponse.success("Symptoms logged successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SymptomResponse>> updateSymptoms(@PathVariable Long id, @Valid @RequestBody SymptomRequest request) {
        SymptomResponse response = symptomService.updateSymptoms(id, request);
        return ResponseEntity.ok(ApiResponse.success("Symptoms log updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSymptoms(@PathVariable Long id) {
        symptomService.deleteSymptoms(id);
        return ResponseEntity.ok(ApiResponse.success("Symptoms log deleted successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<SymptomResponse>> getSymptomLog(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        SymptomResponse response = symptomService.getSymptomLog(date);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<SymptomResponse>>> getSymptomHistory() {
        List<SymptomResponse> response = symptomService.getSymptomHistory();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
