import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerService, PartnerConnection } from '../../../services/partner.service';
import { CycleService } from '../../../services/cycle.service';

@Component({
  selector: 'app-partner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partner.html',
  styleUrl: './partner.scss'
})
export class PartnerPage implements OnInit {
  private readonly partnerService = inject(PartnerService);
  private readonly cycleService = inject(CycleService);

  readonly partner = signal<PartnerConnection | null>(null);
  readonly inviteEmail = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  // Shared statistics state (mock or loaded from cycleService for shared summary visualization)
  readonly sharedCycleDay = signal(14);
  readonly sharedPhase = signal('Ovulatory Phase');
  readonly sharedNextPeriod = signal('Calculating...');

  ngOnInit(): void {
    this.loadPartnerStatus();
    this.loadSharedCycle();
  }

  loadPartnerStatus(): void {
    this.partnerService.getPartnerStatus().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.partner.set(res.data);
        } else {
          this.partner.set(null);
        }
      },
      error: () => {
        this.partner.set(null);
      }
    });
  }

  loadSharedCycle(): void {
    // For rendering a mock summary dashboard of self care/cycle log details when connected
    this.cycleService.getNextPeriodPrediction().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.sharedNextPeriod.set(new Date(res.data).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        }
      }
    });
  }

  sendInvite(): void {
    if (!this.inviteEmail()) {
      this.errorMessage.set('Please enter a valid email address');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.partnerService.invitePartner(this.inviteEmail()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.partner.set(res.data);
          this.inviteEmail.set('');
        } else {
          this.errorMessage.set(res.message || 'Invitation failed.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'An error occurred during invitation.');
      }
    });
  }

  acceptInvite(): void {
    this.partnerService.acceptInvitation().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.partner.set(res.data);
        }
      }
    });
  }

  rejectInvite(): void {
    this.partnerService.rejectInvitation().subscribe({
      next: (res) => {
        if (res.success) {
          this.partner.set(null);
        }
      }
    });
  }

  disconnectPartner(): void {
    if (!confirm('Are you sure you want to disconnect from your partner? This stops sharing self-care and health logs.')) return;

    this.partnerService.disconnectPartner().subscribe({
      next: (res) => {
        if (res.success) {
          this.partner.set(null);
        }
      }
    });
  }
}
