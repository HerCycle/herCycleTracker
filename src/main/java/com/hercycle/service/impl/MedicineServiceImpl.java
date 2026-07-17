package com.hercycle.service.impl;

import com.hercycle.dto.request.MedicineRequest;
import com.hercycle.dto.response.MedicineResponse;
import com.hercycle.entity.MedicineReminder;
import com.hercycle.entity.User;
import com.hercycle.exception.BadRequestException;
import com.hercycle.exception.ResourceNotFoundException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.MedicineReminderRepository;
import com.hercycle.service.MedicineService;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for MedicineReminder tracker.
 */
@Service
@Transactional
public class MedicineServiceImpl implements MedicineService {

    private static final Logger logger = LoggerFactory.getLogger(MedicineServiceImpl.class);

    private final MedicineReminderRepository reminderRepository;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public MedicineServiceImpl(MedicineReminderRepository reminderRepository, UserService userService, EntityMapper entityMapper) {
        this.reminderRepository = reminderRepository;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Override
    public MedicineResponse saveReminder(MedicineRequest request) {
        User user = userService.getLoggedInUser();
        logger.info("Saving medicine reminder {} for user {}", request.getMedicineName(), user.getEmail());

        MedicineReminder reminder = MedicineReminder.builder()
                .user(user)
                .medicineName(request.getMedicineName())
                .dosage(request.getDosage())
                .time(request.getTime())
                .frequency(request.getFrequency() != null ? request.getFrequency() : "DAILY")
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .completed(false)
                .build();

        MedicineReminder saved = reminderRepository.save(reminder);
        return entityMapper.toMedicineResponse(saved);
    }

    @Override
    public MedicineResponse updateReminder(Long id, MedicineRequest request) {
        User user = userService.getLoggedInUser();
        logger.info("Updating medicine reminder ID {} for user {}", id, user.getEmail());

        MedicineReminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine reminder not found with ID: " + id));

        if (!reminder.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to medicine reminder");
        }

        reminder.setMedicineName(request.getMedicineName());
        reminder.setDosage(request.getDosage());
        reminder.setTime(request.getTime());
        if (request.getFrequency() != null) {
            reminder.setFrequency(request.getFrequency());
        }
        reminder.setStartDate(request.getStartDate());
        reminder.setEndDate(request.getEndDate());

        MedicineReminder updated = reminderRepository.save(reminder);
        return entityMapper.toMedicineResponse(updated);
    }

    @Override
    public void deleteReminder(Long id) {
        User user = userService.getLoggedInUser();
        logger.info("Deleting medicine reminder ID {} for user {}", id, user.getEmail());

        MedicineReminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine reminder not found with ID: " + id));

        if (!reminder.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to medicine reminder");
        }

        reminderRepository.delete(reminder);
    }

    @Override
    public List<MedicineResponse> getReminders() {
        User user = userService.getLoggedInUser();
        return reminderRepository.findByUser(user).stream()
                .map(entityMapper::toMedicineResponse)
                .collect(Collectors.toList());
    }

    @Override
    public MedicineResponse completeReminderToday(Long id, Boolean completed) {
        User user = userService.getLoggedInUser();
        logger.info("Setting medicine reminder ID {} completed status to {} for user {}", id, completed, user.getEmail());

        MedicineReminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine reminder not found with ID: " + id));

        if (!reminder.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to medicine reminder");
        }

        reminder.setCompleted(completed);
        MedicineReminder saved = reminderRepository.save(reminder);
        return entityMapper.toMedicineResponse(saved);
    }
}
