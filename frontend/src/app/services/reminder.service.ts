import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { Observable } from 'rxjs';

export interface MedicineReminder {
  id?: number;
  medicineName: string;
  dosage?: string;
  time: string; // "HH:mm"
  frequency?: string; // "DAILY", "WEEKLY", etc.
  startDate: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD"
  completed?: boolean;
}

export interface WaterProgress {
  id?: number;
  goal: number;
  completed: number;
  date?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private readonly api = inject(ApiService);

  // --- Medicine Reminders ---
  getReminders(): Observable<ApiResponse<MedicineReminder[]>> {
    return this.api.get<MedicineReminder[]>('/api/medicine-reminders');
  }

  saveReminder(reminder: MedicineReminder): Observable<ApiResponse<MedicineReminder>> {
    return this.api.post<MedicineReminder>('/api/medicine-reminders', reminder);
  }

  updateReminder(id: number, reminder: MedicineReminder): Observable<ApiResponse<MedicineReminder>> {
    return this.api.put<MedicineReminder>(`/api/medicine-reminders/${id}`, reminder);
  }

  deleteReminder(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/api/medicine-reminders/${id}`);
  }

  completeReminder(id: number, completed: boolean): Observable<ApiResponse<MedicineReminder>> {
    return this.api.put<MedicineReminder>(`/api/medicine-reminders/${id}/complete?completed=${completed}`, {});
  }

  // --- Water Intake ---
  getWaterToday(): Observable<ApiResponse<WaterProgress>> {
    return this.api.get<WaterProgress>('/api/water/today');
  }

  getWaterHistory(): Observable<ApiResponse<WaterProgress[]>> {
    return this.api.get<WaterProgress[]>('/api/water/history');
  }

  addWater(amount: number): Observable<ApiResponse<WaterProgress>> {
    return this.api.post<WaterProgress>(`/api/water/add?amount=${amount}`, {});
  }

  updateWaterGoal(goal: number): Observable<ApiResponse<WaterProgress>> {
    return this.api.put<WaterProgress>(`/api/water/goal?goal=${goal}`, {});
  }
}
