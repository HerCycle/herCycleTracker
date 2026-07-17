package com.hercycle.controller;

import com.hercycle.dto.ApiResponse;
import com.hercycle.dto.request.MedicineRequest;
import com.hercycle.dto.response.MedicineResponse;
import com.hercycle.dto.response.WaterResponse;
import com.hercycle.service.MedicineService;
import com.hercycle.service.WaterService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for habit tracking: Water intake and Medicine pill reminders.
 */
@RestController
@RequestMapping("/api")
public class ReminderController {

    private final MedicineService medicineService;
    private final WaterService waterService;

    public ReminderController(MedicineService medicineService, WaterService waterService) {
        this.medicineService = medicineService;
        this.waterService = waterService;
    }

    // --- Medicine Reminder Endpoints ---

    @PostMapping("/medicine-reminders")
    public ResponseEntity<ApiResponse<MedicineResponse>> saveReminder(@Valid @RequestBody MedicineRequest request) {
        MedicineResponse response = medicineService.saveReminder(request);
        return ResponseEntity.ok(ApiResponse.success("Medicine reminder saved successfully", response));
    }

    @PutMapping("/medicine-reminders/{id}")
    public ResponseEntity<ApiResponse<MedicineResponse>> updateReminder(@PathVariable Long id, @Valid @RequestBody MedicineRequest request) {
        MedicineResponse response = medicineService.updateReminder(id, request);
        return ResponseEntity.ok(ApiResponse.success("Medicine reminder updated successfully", response));
    }

    @DeleteMapping("/medicine-reminders/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReminder(@PathVariable Long id) {
        medicineService.deleteReminder(id);
        return ResponseEntity.ok(ApiResponse.success("Medicine reminder deleted successfully"));
    }

    @GetMapping("/medicine-reminders")
    public ResponseEntity<ApiResponse<List<MedicineResponse>>> getReminders() {
        List<MedicineResponse> response = medicineService.getReminders();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/medicine-reminders/{id}/complete")
    public ResponseEntity<ApiResponse<MedicineResponse>> completeReminder(
            @PathVariable Long id, @RequestParam Boolean completed) {
        MedicineResponse response = medicineService.completeReminderToday(id, completed);
        return ResponseEntity.ok(ApiResponse.success("Reminder status updated", response));
    }

    // --- Water Tracker Endpoints ---

    @PutMapping("/water/goal")
    public ResponseEntity<ApiResponse<WaterResponse>> updateWaterGoal(@RequestParam Double goal) {
        WaterResponse response = waterService.updateGoal(goal);
        return ResponseEntity.ok(ApiResponse.success("Water goal updated", response));
    }

    @PostMapping("/water/add")
    public ResponseEntity<ApiResponse<WaterResponse>> addWaterIntake(@RequestParam Double amount) {
        WaterResponse response = waterService.addWater(amount);
        return ResponseEntity.ok(ApiResponse.success("Water intake recorded", response));
    }

    @GetMapping("/water/today")
    public ResponseEntity<ApiResponse<WaterResponse>> getWaterProgressToday() {
        WaterResponse response = waterService.getProgressToday();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/water/history")
    public ResponseEntity<ApiResponse<List<WaterResponse>>> getWaterHistory() {
        List<WaterResponse> response = waterService.getHistory();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
