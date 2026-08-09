import { Injectable, inject, signal } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface UserProfile {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  bloodGroup?: string;
  pregnancyStatus?: boolean;
  notificationsEnabled?: boolean;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);
  
  // Current user signal
  readonly currentUser = signal<UserProfile | null>(this.api.getUser());

  isLoggedIn(): boolean {
    return this.api.getToken() !== null;
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role === 'ROLE_ADMIN';
  }

  login(credentials: { email: string; password?: string }): Observable<ApiResponse<any>> {
    return this.api.post<any>('/api/auth/login', credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          const user: UserProfile = {
            firstName: res.data.firstName,
            lastName: res.data.lastName,
            email: res.data.email,
            role: res.data.role
          };
          this.api.saveAuthData(res.data.token, res.data.refreshToken, user);
          this.currentUser.set(user);
          
          // Fetch complete profile details to supplement core auth details
          this.getProfile().subscribe(profileRes => {
            if (profileRes.success) {
              const fullUser = { ...user, ...profileRes.data };
              this.api.saveAuthData(res.data.token, res.data.refreshToken, fullUser);
              this.currentUser.set(fullUser);
            }
          });
        }
      })
    );
  }

  register(userData: any): Observable<ApiResponse<any>> {
    return this.api.post<any>('/api/auth/register', userData);
  }

  logout(): Observable<ApiResponse<void>> {
    return this.api.post<void>('/api/auth/logout', {}).pipe(
      tap(() => {
        this.api.clearAuthData();
        this.currentUser.set(null);
      })
    );
  }

  forgotPassword(email: string): Observable<ApiResponse<string>> {
    return this.api.post<string>('/api/auth/forgot-password', { email });
  }

  resetPassword(resetData: any): Observable<ApiResponse<void>> {
    return this.api.post<void>('/api/auth/reset-password', resetData);
  }

  changePassword(passwordData: any): Observable<ApiResponse<void>> {
    return this.api.post<void>('/api/auth/change-password', passwordData);
  }

  getProfile(): Observable<ApiResponse<UserProfile>> {
    return this.api.get<UserProfile>('/api/users/profile');
  }

  updateProfile(profileData: UserProfile): Observable<ApiResponse<UserProfile>> {
    return this.api.put<UserProfile>('/api/users/profile', profileData).pipe(
      tap(res => {
        if (res.success) {
          const updated = { ...this.currentUser(), ...res.data };
          localStorage.setItem('hc_user_profile', JSON.stringify(updated));
          this.currentUser.set(updated);
        }
      })
    );
  }

  deleteAccount(): Observable<ApiResponse<void>> {
    return this.api.delete<void>('/api/users/profile').pipe(
      tap(() => {
        this.api.clearAuthData();
        this.currentUser.set(null);
      })
    );
  }
}
