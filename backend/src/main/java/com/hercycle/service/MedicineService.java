package com.hercycle.service;

import com.hercycle.dto.request.MedicineRequest;
import com.hercycle.dto.response.MedicineResponse;

import java.util.List;

/**
 * Service interface for managing medicine intake reminders.
 */
public interface MedicineService {

    MedicineResponse saveReminder(MedicineRequest request);

    MedicineResponse updateReminder(Long id, MedicineRequest request);

    void deleteReminder(Long id);

    List<MedicineResponse> getReminders();

    MedicineResponse completeReminderToday(Long id, Boolean completed);
}
