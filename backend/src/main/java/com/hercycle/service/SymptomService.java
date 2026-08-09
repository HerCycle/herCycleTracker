package com.hercycle.service;

import com.hercycle.dto.request.SymptomRequest;
import com.hercycle.dto.response.SymptomResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * Service interface to manage daily symptom and mood logs.
 */
public interface SymptomService {

    SymptomResponse saveSymptoms(SymptomRequest request);

    SymptomResponse updateSymptoms(Long id, SymptomRequest request);

    void deleteSymptoms(Long id);

    SymptomResponse getSymptomLog(LocalDate date);

    List<SymptomResponse> getSymptomHistory();
}
