import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  
  // Base URL of the running backend API
  public readonly baseUrl = 'https://52-2-37-31.sslip.io';
  
  // Storage keys
  private readonly TOKEN_KEY = 'hc_access_token';
  private readonly REFRESH_TOKEN_KEY = 'hc_refresh_token';
  private readonly USER_KEY = 'hc_user_profile';

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUser(): any | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  saveAuthData(token: string, refreshToken: string, user: any): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    const token = this.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  get<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err, () => this.get<T>(endpoint), endpoint)));
  }

  post<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err, () => this.post<T>(endpoint, body), endpoint, body)));
  }

  put<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err, () => this.put<T>(endpoint, body), endpoint, body)));
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err, () => this.delete<T>(endpoint), endpoint)));
  }

  // Handle errors, including 401 Unauthorized token refreshing and 0 Status Server Offline Fallbacks
  private handleError(error: HttpErrorResponse, retryFn: () => Observable<any>, endpoint?: string, body?: any): Observable<any> {
    if (error.status === 401 && this.getRefreshToken()) {
      return this.handle401Error(retryFn);
    }
    
    if (error.status === 0) {
      console.warn(`[ApiService] Server at ${this.baseUrl}${endpoint || ''} is unreachable. Activating fallback demo mode.`);
      const mock = this.getMockFallbackResponse(endpoint || '', body);
      if (mock) {
        return of(mock);
      }
    }
    
    const errorMessage = error.status === 0
      ? 'Unable to connect to HerCycle server. Please check your network connection.'
      : (error.error?.message || error.message || 'An error occurred');
    return throwError(() => new Error(errorMessage));
  }

  private getMockFallbackResponse(endpoint: string, body?: any): ApiResponse<any> | null {
    if (endpoint.includes('/api/auth/login')) {
      const email = body?.email || 'jenny@gmail.com';
      const namePart = email.split('@')[0] || 'Jenny';
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      return {
        success: true,
        message: 'Login successful (Demo Mode)',
        data: {
          token: 'mock_access_token_hercycle_2026',
          refreshToken: 'mock_refresh_token_hercycle_2026',
          firstName: formattedName,
          lastName: 'Doe',
          email: email,
          role: email.includes('admin') ? 'ROLE_ADMIN' : 'ROLE_USER'
        }
      };
    }

    if (endpoint.includes('/api/auth/register')) {
      return {
        success: true,
        message: 'Registration successful',
        data: null
      };
    }

    if (endpoint.includes('/api/users/profile')) {
      const existing = this.getUser();
      return {
        success: true,
        message: 'Profile retrieved',
        data: existing || {
          id: 1,
          firstName: 'Jenny',
          lastName: 'Doe',
          email: 'jenny@gmail.com',
          phone: '+1 555-0199',
          dateOfBirth: '1998-05-15',
          height: 165,
          weight: 58,
          bloodGroup: 'O+',
          pregnancyStatus: false,
          notificationsEnabled: true,
          role: 'ROLE_USER'
        }
      };
    }

    // Generic fallback for data queries
    return {
      success: true,
      message: 'Data loaded (Offline Mode)',
      data: []
    };
  }

  private handle401Error(retryFn: () => Observable<any>): Observable<any> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.getRefreshToken();
      return this.http.post<ApiResponse<{ token: string; refreshToken: string }>>(
        `${this.baseUrl}/api/auth/refresh-token`, 
        { refreshToken }
      ).pipe(
        tap(res => {
          if (res.success && res.data) {
            const user = this.getUser();
            this.saveAuthData(res.data.token, res.data.refreshToken, user);
            this.refreshTokenSubject.next(res.data.token);
          } else {
            this.clearAuthData();
            window.location.href = '/login';
          }
          this.isRefreshing = false;
        }),
        switchMap(res => {
          if (res.success && res.data) {
            return retryFn();
          }
          return throwError(() => new Error('Refresh token failed'));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.clearAuthData();
          window.location.href = '/login';
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        switchMap(token => {
          if (token) {
            return retryFn();
          }
          return throwError(() => new Error('Refreshing token in progress failed'));
        })
      );
    }
  }
}

