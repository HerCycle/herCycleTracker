import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PartnerService, PartnerConnection, PartnerSharedData } from '../../../services/partner.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-partner-mode',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './partner-mode.html',
  styleUrl: './partner-mode.scss'
})
export class PartnerModePage implements OnInit, OnDestroy {
  private readonly partnerService = inject(PartnerService);
  private readonly authService = inject(AuthService);

  private connSub?: Subscription;
  private shareSub?: Subscription;

  readonly connection = signal<PartnerConnection | null>(null);
  readonly sharedData = signal<PartnerSharedData | null>(null);
  readonly isLoading = signal(true);
  readonly connectionEnded = signal(false);

  // Month names helper
  private readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  ngOnInit(): void {
    this.subscribeToPartnerData();
  }

  ngOnDestroy(): void {
    this.connSub?.unsubscribe();
    this.shareSub?.unsubscribe();
  }

  private subscribeToPartnerData(): void {
    this.connSub = this.partnerService.getPartnerConnection().pipe(
      switchMap((res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.connection.set(res.data);
          this.connectionEnded.set(false);

          // If role is PARTNER, ownerUid is the person who invited them
          // If role is OWNER, currentUser is the owner
          const ownerUid = res.data.role === 'PARTNER'
            ? (res.data.ownerUid || res.data.partnerUid)
            : this.authService.currentUser()?.uid;

          if (ownerUid) {
            return this.partnerService.getSharedDataForPartner(ownerUid);
          }
        } else {
          this.connection.set(null);
          this.connectionEnded.set(true);
        }
        return of(null);
      })
    ).subscribe({
      next: (data) => {
        this.sharedData.set(data);
        if (!data && this.connection() !== null) {
          // If the connection exists but the share document was deleted / revoked
          // it might mean sharing is disabled or connection was severed
        }
      },
      error: (err) => {
        console.error('Partner mode error:', err);
        this.sharedData.set(null);
      }
    });
  }

  formatDisplayDate(dateStr?: string | null): string {
    if (!dateStr) return 'Not available';
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      const month = this.monthNames[parts[1] - 1];
      const day = parts[2];
      return `${month} ${day}`;
    }
    const d = new Date(dateStr);
    return `${this.monthNames[d.getMonth()]} ${d.getDate()}`;
  }

  formatDateRange(startStr?: string | null, endStr?: string | null): string {
    if (!startStr || !endStr) return 'Not available';
    return `${this.formatDisplayDate(startStr)} – ${this.formatDisplayDate(endStr)}`;
  }
}
