import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { PartnerService, PartnerInvitation } from '../../services/partner.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-partner-accept',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './partner-accept.html',
  styleUrl: './partner-accept.scss'
})
export class PartnerAcceptPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly partnerService = inject(PartnerService);
  private readonly auth = inject(Auth);
  private readonly authService = inject(AuthService);

  readonly invitationId = signal<string | null>(null);
  readonly invitation = signal<PartnerInvitation | null>(null);
  readonly currentUser = signal<any>(null);

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly wrongEmailError = signal(false);
  readonly expiredError = signal(false);
  readonly notPendingError = signal<string | null>(null);
  readonly acceptedSuccess = signal(false);
  readonly declinedSuccess = signal(false);

  ngOnInit(): void {
    const id =
      this.route.snapshot.queryParamMap.get('invitationId') ||
      this.route.snapshot.queryParamMap.get('invite');
    this.invitationId.set(id);

    // Listen to Firebase auth state
    user(this.auth).subscribe(async (firebaseUser) => {
      this.currentUser.set(firebaseUser);
      if (firebaseUser && id) {
        await this.loadAndValidateInvitation(id, firebaseUser.email || '');
      } else {
        this.isLoading.set(false);
      }
    });
  }

  async loadAndValidateInvitation(id: string, userEmail: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.wrongEmailError.set(false);
    this.expiredError.set(false);
    this.notPendingError.set(null);

    try {
      const inv = await this.partnerService.getInvitationById(id);
      this.isLoading.set(false);

      if (!inv) {
        // In Firestore rules, read is only permitted if request.auth.token.email matches recipientEmail or senderUid
        // If read fails or returns null, it may also be because this user is not the recipient
        this.errorMessage.set('This invitation could not be found or you do not have permission to view it.');
        return;
      }

      this.invitation.set(inv);

      // 1. Email validation: Only the invited email may accept the invitation
      const normalizedUserEmail = (userEmail || '').trim().toLowerCase();
      const normalizedRecipient = (inv.recipientEmail || '').trim().toLowerCase();

      if (normalizedUserEmail !== normalizedRecipient) {
        this.wrongEmailError.set(true);
        return;
      }

      // 2. Check pending status
      if (inv.status !== 'PENDING') {
        this.notPendingError.set(inv.status);
        return;
      }

      // 3. Check expiration
      const nowMs = Date.now();
      const expiryMs = inv.expiresAt?.toMillis
        ? inv.expiresAt.toMillis()
        : (typeof inv.expiresAt === 'string' ? new Date(inv.expiresAt).getTime() : nowMs);

      if (expiryMs < nowMs) {
        this.expiredError.set(true);
        return;
      }
    } catch (err: any) {
      this.isLoading.set(false);
      console.error('Error validating invitation:', err);
      // If Firestore denies read because of email mismatch:
      this.wrongEmailError.set(true);
    }
  }

  async onAccept(): Promise<void> {
    const id = this.invitationId();
    if (!id) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const res = await this.partnerService.acceptInvitation(id);
    this.isSubmitting.set(false);

    if (res.success) {
      this.acceptedSuccess.set(true);
      setTimeout(() => {
        this.router.navigate(['/dashboard/partner-mode']);
      }, 2000);
    } else {
      this.errorMessage.set(res.message || 'Failed to accept invitation.');
    }
  }

  async onDecline(): Promise<void> {
    const id = this.invitationId();
    if (!id) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const res = await this.partnerService.declineInvitation(id);
    this.isSubmitting.set(false);

    if (res.success) {
      this.declinedSuccess.set(true);
    } else {
      this.errorMessage.set(res.message || 'Failed to decline invitation.');
    }
  }

  signOutAndSwitch(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
