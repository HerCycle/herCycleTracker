import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { Observable } from 'rxjs';

export interface PeriodLog {
  id?: number;
  periodStartDate: string;
  periodEndDate?: string;
  flow?: string;
  notes?: string;
  cycleLength?: number;
  periodLength?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CycleService {
  private readonly api = inject(ApiService);

  logPeriod(request: PeriodLog): Observable<ApiResponse<PeriodLog>> {
    return this.api.post<PeriodLog>('/api/period', request);
  }

  updatePeriod(id: number, request: PeriodLog): Observable<ApiResponse<PeriodLog>> {
    return this.api.put<PeriodLog>(`/api/period/${id}`, request);
  }

  deletePeriod(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/api/period/${id}`);
  }

  getCalendar(): Observable<ApiResponse<PeriodLog[]>> {
    return this.api.get<PeriodLog[]>('/api/period/calendar');
  }

  getHistory(): Observable<ApiResponse<PeriodLog[]>> {
    return this.api.get<PeriodLog[]>('/api/period/history');
  }

  getCurrent(): Observable<ApiResponse<PeriodLog>> {
    return this.api.get<PeriodLog>('/api/period/current');
  }

  getTodayPeriod(): Observable<ApiResponse<PeriodLog>> {
    return this.api.get<PeriodLog>('/api/period/today');
  }

  getFertilityWindow(): Observable<ApiResponse<string[]>> {
    return this.api.get<string[]>('/api/period/fertility');
  }

  getOvulationDays(): Observable<ApiResponse<string[]>> {
    return this.api.get<string[]>('/api/period/ovulation');
  }

  getSafeDays(): Observable<ApiResponse<string[]>> {
    return this.api.get<string[]>('/api/period/safe-days');
  }

  getNextPeriodPrediction(): Observable<ApiResponse<string>> {
    return this.api.get<string>('/api/period/next');
  }

  getIsLate(): Observable<ApiResponse<boolean>> {
    return this.api.get<boolean>('/api/period/is-late');
  }

  getIsIrregular(): Observable<ApiResponse<boolean>> {
    return this.api.get<boolean>('/api/period/is-irregular');
  }

  getRegularityScore(): Observable<ApiResponse<number>> {
    return this.api.get<number>('/api/period/regularity-score');
  }

  getOverallAnalysis(): Observable<ApiResponse<any>> {
    return this.api.get<any>('/api/analysis');
  }
}
