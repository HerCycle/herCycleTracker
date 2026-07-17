package com.hercycle.service.impl;

import com.hercycle.dto.request.SymptomRequest;
import com.hercycle.dto.response.SymptomResponse;
import com.hercycle.entity.Mood;
import com.hercycle.entity.Symptoms;
import com.hercycle.entity.User;
import com.hercycle.exception.BadRequestException;
import com.hercycle.exception.ResourceNotFoundException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.SymptomsRepository;
import com.hercycle.service.SymptomService;
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
 * Service implementation for Symptoms tracker.
 */
@Service
@Transactional
public class SymptomServiceImpl implements SymptomService {

    private static final Logger logger = LoggerFactory.getLogger(SymptomServiceImpl.class);

    private final SymptomsRepository symptomsRepository;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public SymptomServiceImpl(SymptomsRepository symptomsRepository, UserService userService, EntityMapper entityMapper) {
        this.symptomsRepository = symptomsRepository;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Override
    public SymptomResponse saveSymptoms(SymptomRequest request) {
        User user = userService.getLoggedInUser();
        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now();
        logger.info("Logging symptoms for user {} on date {}", user.getEmail(), date);

        // Check if log already exists for this date, if so, update instead of insert
        Optional<Symptoms> existing = symptomsRepository.findByUserAndDate(user, date);
        Symptoms symptoms;
        if (existing.isPresent()) {
            symptoms = existing.get();
        } else {
            symptoms = new Symptoms();
            symptoms.setUser(user);
            symptoms.setDate(date);
        }

        if (request.getMood() != null) symptoms.setMood(Mood.valueOf(request.getMood().toUpperCase()));
        if (request.getPain() != null) symptoms.setPain(request.getPain());
        if (request.getCramps() != null) symptoms.setCramps(request.getCramps());
        if (request.getHeadache() != null) symptoms.setHeadache(request.getHeadache());
        if (request.getBackPain() != null) symptoms.setBackPain(request.getBackPain());
        if (request.getBloating() != null) symptoms.setBloating(request.getBloating());
        if (request.getAcne() != null) symptoms.setAcne(request.getAcne());
        if (request.getFatigue() != null) symptoms.setFatigue(request.getFatigue());
        if (request.getNausea() != null) symptoms.setNausea(request.getNausea());
        if (request.getCravings() != null) symptoms.setCravings(request.getCravings());
        if (request.getBreastPain() != null) symptoms.setBreastPain(request.getBreastPain());
        if (request.getSleep() != null) symptoms.setSleep(request.getSleep());
        if (request.getEnergy() != null) symptoms.setEnergy(request.getEnergy());
        if (request.getWaterIntake() != null) symptoms.setWaterIntake(request.getWaterIntake());
        if (request.getNotes() != null) symptoms.setNotes(request.getNotes());

        Symptoms saved = symptomsRepository.save(symptoms);
        return entityMapper.toSymptomResponse(saved);
    }

    @Override
    public SymptomResponse updateSymptoms(Long id, SymptomRequest request) {
        User user = userService.getLoggedInUser();
        logger.info("Updating symptom log ID {} for user {}", id, user.getEmail());

        Symptoms symptoms = symptomsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Symptom log not found with ID: " + id));

        if (!symptoms.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to symptom record");
        }

        if (request.getMood() != null) symptoms.setMood(Mood.valueOf(request.getMood().toUpperCase()));
        if (request.getPain() != null) symptoms.setPain(request.getPain());
        if (request.getCramps() != null) symptoms.setCramps(request.getCramps());
        if (request.getHeadache() != null) symptoms.setHeadache(request.getHeadache());
        if (request.getBackPain() != null) symptoms.setBackPain(request.getBackPain());
        if (request.getBloating() != null) symptoms.setBloating(request.getBloating());
        if (request.getAcne() != null) symptoms.setAcne(request.getAcne());
        if (request.getFatigue() != null) symptoms.setFatigue(request.getFatigue());
        if (request.getNausea() != null) symptoms.setNausea(request.getNausea());
        if (request.getCravings() != null) symptoms.setCravings(request.getCravings());
        if (request.getBreastPain() != null) symptoms.setBreastPain(request.getBreastPain());
        if (request.getSleep() != null) symptoms.setSleep(request.getSleep());
        if (request.getEnergy() != null) symptoms.setEnergy(request.getEnergy());
        if (request.getWaterIntake() != null) symptoms.setWaterIntake(request.getWaterIntake());
        if (request.getNotes() != null) symptoms.setNotes(request.getNotes());

        Symptoms updated = symptomsRepository.save(symptoms);
        return entityMapper.toSymptomResponse(updated);
    }

    @Override
    public void deleteSymptoms(Long id) {
        User user = userService.getLoggedInUser();
        logger.info("Deleting symptom log ID {} for user {}", id, user.getEmail());

        Symptoms symptoms = symptomsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Symptom log not found with ID: " + id));

        if (!symptoms.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to symptom record");
        }

        symptomsRepository.delete(symptoms);
    }

    @Override
    public SymptomResponse getSymptomLog(LocalDate date) {
        User user = userService.getLoggedInUser();
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return symptomsRepository.findByUserAndDate(user, targetDate)
                .map(entityMapper::toSymptomResponse)
                .orElse(null);
    }

    @Override
    public List<SymptomResponse> getSymptomHistory() {
        User user = userService.getLoggedInUser();
        return symptomsRepository.findByUserOrderByDateDesc(user).stream()
                .map(entityMapper::toSymptomResponse)
                .collect(Collectors.toList());
    }
}
