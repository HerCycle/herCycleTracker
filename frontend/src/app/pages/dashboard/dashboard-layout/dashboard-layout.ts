import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string; // LATE_PERIOD, REMINDER, PARTNER_INVITE, etc.
  scheduledTime?: string;
  isRead: boolean;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss'
})
export class DashboardLayout implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly isSidebarOpen = signal(true);
  readonly isNotificationDropdownOpen = signal(false);
  readonly notifications = signal<NotificationItem[]>([]);
  readonly unreadCount = signal(0);
  readonly activePath = signal('');

  private routerSub?: Subscription;
  private notifInterval?: any;

  ngOnInit(): void {
    this.activePath.set(this.router.url);
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.activePath.set(e.url);
      // Close sidebar after navigation
      this.isSidebarOpen.set(false);
    });

    // Handle initial responsive sidebar state
    if (window.innerWidth < 768) {
      this.isSidebarOpen.set(false);
    }

    // Load initial notifications and poll every 30 seconds
    this.fetchNotifications();
    this.notifInterval = setInterval(() => this.fetchNotifications(), 30000);
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    if (this.notifInterval) {
      clearInterval(this.notifInterval);
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }

  onNavClick(): void {
    this.isSidebarOpen.set(false);
  }

  toggleNotificationDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isNotificationDropdownOpen.update(v => !v);
  }

  closeNotificationDropdown(): void {
    this.isNotificationDropdownOpen.set(false);
  }

  fetchNotifications(): void {
    if (!this.auth.isLoggedIn()) return;
    this.api.get<NotificationItem[]>('/api/notifications').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notifications.set(res.data);
          this.unreadCount.set(res.data.filter(n => !n.isRead).length);
        }
      },
      error: () => {}
    });
  }

  markAsRead(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.api.put<void>(`/api/notifications/${id}/read`, {}).subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.update(list => 
            list.map(n => n.id === id ? { ...n, isRead: true } : n)
          );
          this.unreadCount.update(c => Math.max(0, c - 1));
        }
      }
    });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Fallback logout client-side in case server connection is lost
        this.api.clearAuthData();
        this.router.navigate(['/login']);
      }
    });
  }
}
