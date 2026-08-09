import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { Observable } from 'rxjs';

export interface SymptomLog {
  id?: number;
  date: string;
  mood?: string;
  pain?: number;
  cramps?: boolean;
  headache?: boolean;
  backPain?: boolean;
  bloating?: boolean;
  acne?: boolean;
  fatigue?: boolean;
  nausea?: boolean;
  cravings?: boolean;
  breastPain?: boolean;
  sleep?: number;
  energy?: number;
  waterIntake?: number;
  temperature?: number;
  weight?: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SymptomService {
  private readonly api = inject(ApiService);

  saveSymptoms(request: SymptomLog): Observable<ApiResponse<SymptomLog>> {
    return this.api.post<SymptomLog>('/api/symptoms', request);
  }

  updateSymptoms(id: number, request: SymptomLog): Observable<ApiResponse<SymptomLog>> {
    return this.api.put<SymptomLog>(`/api/symptoms/${id}`, request);
  }

  deleteSymptoms(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/api/symptoms/${id}`);
  }

  getSymptomLog(date?: string): Observable<ApiResponse<SymptomLog>> {
    const endpoint = date ? `/api/symptoms?date=${date}` : '/api/symptoms';
    return this.api.get<SymptomLog>(endpoint);
  }

  getSymptomHistory(): Observable<ApiResponse<SymptomLog[]>> {
    return this.api.get<SymptomLog[]>('/api/symptoms/history');
  }
}
