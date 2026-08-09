import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { Observable } from 'rxjs';

export interface PartnerConnection {
  id?: number;
  partnerEmail: string;
  status: string; // PENDING, ACCEPTED, REJECTED
  inviteDate?: string;
  acceptedDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PartnerService {
  private readonly api = inject(ApiService);

  getPartnerStatus(): Observable<ApiResponse<PartnerConnection>> {
    return this.api.get<PartnerConnection>('/api/partner');
  }

  invitePartner(email: string): Observable<ApiResponse<PartnerConnection>> {
    return this.api.post<PartnerConnection>('/api/partner/invite', { partnerEmail: email });
  }

  acceptInvitation(): Observable<ApiResponse<PartnerConnection>> {
    return this.api.put<PartnerConnection>('/api/partner/accept', {});
  }

  rejectInvitation(): Observable<ApiResponse<PartnerConnection>> {
    return this.api.put<PartnerConnection>('/api/partner/reject', {});
  }

  disconnectPartner(): Observable<ApiResponse<void>> {
    return this.api.delete<void>('/api/partner');
  }
}
