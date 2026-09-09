import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  PartnerService,
  PartnerConnection,
  PartnerInvitation,
  PartnerSharingPermissions,
  DEFAULT_SHARING_PERMISSIONS
} from '../../../services/partner.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-partner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './partner.html',
  styleUrl: './partner.scss'
})
export class PartnerPage implements OnInit, OnDestroy {
  private readonly partnerService = inject(PartnerService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  private connSub?: Subscription;
  private sentSub?: Subscription;
  private incomingSub?: Subscription;

  // Connection & Invitation Signals
  readonly connection = signal<PartnerConnection | null>(null);
  readonly pendingSentInvitation = signal<PartnerInvitation | null>(null);
  readonly incomingInvitations = signal<PartnerInvitation[]>([]);
  readonly linkInvitation = signal<PartnerInvitation | null>(null);

  // Sharing Permissions State
  readonly permissions = signal<PartnerSharingPermissions>({ ...DEFAULT_SHARING_PERMISSIONS });
  readonly isSavingSettings = signal(false);

  // Form & Action State
  readonly inviteEmail = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showDisconnectModal = signal(false);
  readonly showCopiedToast = signal(false);
  readonly activeTab = signal<'overview' | 'sharing'>('overview');
  readonly isDevEnvironment = signal(
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  );

  // Authenticated user
  readonly currentUser = this.authService.currentUser;

  ngOnInit(): void {
    this.subscribeToConnection();
    this.subscribeToSentInvitations();
    this.subscribeToIncomingInvitations();
    this.loadSharingSettings();
    this.checkInviteQueryParam();
  }

  ngOnDestroy(): void {
    this.connSub?.unsubscribe();
    this.sentSub?.unsubscribe();
    this.incomingSub?.unsubscribe();
  }

  private subscribeToConnection(): void {
    this.connSub = this.partnerService.getPartnerConnection().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.connection.set(res.data);
        } else {
          this.connection.set(null);
        }
      }
    });
  }

  private subscribeToSentInvitations(): void {
    this.sentSub = this.partnerService.getSentInvitations().subscribe({
      next: async (invitations) => {
        // 1. Pending invitation for display in UI
        const pending = invitations.find((inv) => inv.status === 'PENDING');
        this.pendingSentInvitation.set(pending || null);

        // 2. Real-time acceptance detection on Owner side:
        // Find if any sent invitation has transitioned to ACCEPTED
        const accepted = invitations.find((inv) => inv.status === 'ACCEPTED');
        const currentConn = this.connection();

        // If an invitation was accepted and owner's connection is not yet established:
        if (
          accepted &&
          accepted.partnerUid &&
          (!currentConn || currentConn.status !== 'CONNECTED' || currentConn.partnerUid !== accepted.partnerUid)
        ) {
          console.log('Realtime acceptance detected for owner. Finalizing owner connection...');
          await this.partnerService.finalizeOwnerConnection(accepted);
        }
      }
    });
  }

  private subscribeToIncomingInvitations(): void {
    this.incomingSub = this.partnerService.getIncomingInvitations().subscribe({
      next: (invitations) => {
        this.incomingInvitations.set(invitations);
      }
    });
  }

  async loadSharingSettings(): Promise<void> {
    const perms = await this.partnerService.getSharingPermissions();
    this.permissions.set(perms);
  }

  private async checkInviteQueryParam(): Promise<void> {
    const inviteId =
      this.route.snapshot.queryParamMap.get('invitationId') ||
      this.route.snapshot.queryParamMap.get('invite');
    if (inviteId) {
      const inv = await this.partnerService.getInvitationById(inviteId);
      if (inv && inv.status === 'PENDING') {
        this.linkInvitation.set(inv);
      }
    }
  }

  getExpirationDate(inv?: PartnerInvitation | null): Date | null {
    if (!inv?.expiresAt) return null;
    if (typeof inv.expiresAt.toDate === 'function') return inv.expiresAt.toDate();
    if (typeof inv.expiresAt.toMillis === 'function') return new Date(inv.expiresAt.toMillis());
    if (inv.expiresAt.seconds) return new Date(inv.expiresAt.seconds * 1000);
    return new Date(inv.expiresAt);
  }

  getInviteLink(invitationId?: string): string {
    const id = invitationId || this.pendingSentInvitation()?.id;
    if (!id) return '';
    return this.partnerService.getInvitationUrl(id);
  }

  copyInviteLink(invitationId?: string): void {
    const link = this.getInviteLink(invitationId);
    if (!link) return;

    navigator.clipboard.writeText(link).then(() => {
      this.showCopiedToast.set(true);
      setTimeout(() => this.showCopiedToast.set(false), 3000);
    });
  }

  // --- Send Partner Invitation ---
  async sendInvite(): Promise<void> {
    const email = this.inviteEmail().trim();
    if (!email) {
      this.errorMessage.set('Please enter your partner\'s email address.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const res = await this.partnerService.createInvitation(email);
    this.isLoading.set(false);

    if (res.success && res.invitation) {
      this.inviteEmail.set('');
      this.pendingSentInvitation.set(res.invitation);
      this.successMessage.set(
        'Invitation created! Share the secure link below with your partner, or they can sign in to HerCycle with this email to accept.'
      );
    } else {
      this.errorMessage.set(res.message || 'Failed to create partner invitation.');
    }
  }

  // --- Cancel Sent Invitation ---
  async cancelSentInvitation(): Promise<void> {
    const pending = this.pendingSentInvitation();
    if (!pending?.id) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const res = await this.partnerService.cancelInvitation(pending.id);
    this.isLoading.set(false);

    if (res.success) {
      this.pendingSentInvitation.set(null);
      this.successMessage.set('Partner invitation cancelled.');
      setTimeout(() => this.successMessage.set(null), 3500);
    } else {
      this.errorMessage.set(res.message || 'Failed to cancel invitation.');
    }
  }

  // --- Accept Incoming Invitation ---
  async acceptIncoming(invitationId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const res = await this.partnerService.acceptInvitation(invitationId);
    this.isLoading.set(false);

    if (res.success) {
      this.linkInvitation.set(null);
      this.successMessage.set('Partner connection established successfully!');
      setTimeout(() => this.successMessage.set(null), 3500);
    } else {
      this.errorMessage.set(res.message || 'Failed to accept partner invitation.');
    }
  }

  // --- Decline Incoming Invitation ---
  async declineIncoming(invitationId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const res = await this.partnerService.declineInvitation(invitationId);
    this.isLoading.set(false);

    if (res.success) {
      this.linkInvitation.set(null);
      this.incomingInvitations.update((list) => list.filter((i) => i.id !== invitationId));
      this.successMessage.set('Invitation declined.');
      setTimeout(() => this.successMessage.set(null), 3000);
    } else {
      this.errorMessage.set(res.message || 'Failed to decline invitation.');
    }
  }

  // --- Save Sharing Permissions ---
  async saveSharingSettings(): Promise<void> {
    this.isSavingSettings.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const currentPerms = this.permissions();
    const res = await this.partnerService.updateSharingPermissions(currentPerms);
    this.isSavingSettings.set(false);

    if (res.success) {
      this.successMessage.set('Sharing settings saved! Shared partner view updated.');
      setTimeout(() => this.successMessage.set(null), 3500);
    } else {
      this.errorMessage.set(res.message || 'Failed to update sharing settings.');
    }
  }

  // --- Disconnect Partner ---
  openDisconnectModal(): void {
    this.showDisconnectModal.set(true);
  }

  closeDisconnectModal(): void {
    this.showDisconnectModal.set(false);
  }

  async confirmDisconnect(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const res = await this.partnerService.disconnectPartner();
    this.isLoading.set(false);
    this.showDisconnectModal.set(false);

    if (res.success) {
      this.connection.set(null);
      this.successMessage.set('Partner disconnected. All sharing access has been immediately revoked.');
      setTimeout(() => this.successMessage.set(null), 4000);
    } else {
      this.errorMessage.set(res.message || 'Failed to disconnect partner.');
    }
  }

  // Toggle individual permission field
  togglePermission(field: keyof PartnerSharingPermissions): void {
    this.permissions.update((p) => ({
      ...p,
      [field]: !p[field]
    }));
  }
}
