import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { PartnerService } from '../../../services/partner.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss'
})
export class DashboardLayout implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly partnerService = inject(PartnerService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly isSidebarOpen = signal(true);
  readonly activePath = signal('');
  readonly hasPartnerConnection = signal(false);

  private routerSub?: Subscription;
  private partnerSub?: Subscription;

  ngOnInit(): void {
    this.activePath.set(this.router.url);
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.activePath.set(e.url);
      // Close sidebar after navigation on mobile/tablet
      if (window.innerWidth < 1024) {
        this.isSidebarOpen.set(false);
      }
    });

    // Handle initial responsive sidebar state
    if (window.innerWidth < 1024) {
      this.isSidebarOpen.set(false);
    }

    this.partnerSub = this.partnerService.getPartnerConnection().subscribe({
      next: (res) => {
        this.hasPartnerConnection.set(!!(res.success && res.data));
      },
      error: () => {
        this.hasPartnerConnection.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.partnerSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }

  onNavClick(): void {
    if (window.innerWidth < 1024) {
      this.isSidebarOpen.set(false);
    }
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
