import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfilePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Profile Form fields
  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly email = signal('');
  readonly phone = signal('');
  readonly dateOfBirth = signal('');
  readonly height = signal<number | null>(null);
  readonly weight = signal<number | null>(null);
  readonly bloodGroup = signal('');
  readonly pregnancyStatus = signal(false);
  readonly notificationsEnabled = signal(true);

  // Password Change fields
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');

  readonly isEditing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isSaving = signal(false);

  readonly pErrorMessage = signal<string | null>(null);
  readonly pSuccessMessage = signal<string | null>(null);
  readonly isChangingPassword = signal(false);

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.populateFields(user);
    }

    this.auth.getProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.populateFields(res.data);
        }
      }
    });
  }

  private populateFields(u: UserProfile): void {
    this.firstName.set(u.firstName || '');
    this.lastName.set(u.lastName || '');
    this.email.set(u.email || '');
    this.phone.set(u.phone || '');
    this.dateOfBirth.set(u.dateOfBirth || '');
    this.height.set(u.height ?? null);
    this.weight.set(u.weight ?? null);
    this.bloodGroup.set(u.bloodGroup || '');
    this.pregnancyStatus.set(!!u.pregnancyStatus);
    this.notificationsEnabled.set(u.notificationsEnabled !== false);
  }

  enableEdit(): void {
    this.isEditing.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.loadProfile();
  }

  saveProfile(): void {
    if (!this.firstName().trim() || !this.lastName().trim()) {
      this.errorMessage.set('First name and Last name are required');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: Partial<UserProfile> = {
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      phone: this.phone().trim() || undefined,
      dateOfBirth: this.dateOfBirth() || undefined,
      height: this.height() ?? undefined,
      weight: this.weight() ?? undefined,
      bloodGroup: this.bloodGroup() || undefined,
      pregnancyStatus: this.pregnancyStatus(),
      notificationsEnabled: this.notificationsEnabled()
    };

    this.auth.updateProfile(payload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.successMessage.set('Profile updated successfully in Firestore!');
          this.isEditing.set(false);
          this.loadProfile();
        } else {
          this.errorMessage.set(res.message || 'Failed to update profile.');
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.message || 'An error occurred while saving.');
      }
    });
  }

  changePassword(): void {
    if (!this.newPassword() || !this.confirmPassword()) {
      this.pErrorMessage.set('New password and confirmation are required');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.pErrorMessage.set('New passwords do not match');
      return;
    }
    if (this.newPassword().length < 6) {
      this.pErrorMessage.set('New password must be at least 6 characters');
      return;
    }

    this.isChangingPassword.set(true);
    this.pErrorMessage.set(null);
    this.pSuccessMessage.set(null);

    this.auth.changePassword(this.newPassword()).subscribe({
      next: (res) => {
        this.isChangingPassword.set(false);
        if (res.success) {
          this.pSuccessMessage.set('Password changed successfully in Firebase!');
          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmPassword.set('');
        } else {
          this.pErrorMessage.set(res.message || 'Failed to change password.');
        }
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        this.pErrorMessage.set(err.message || 'An error occurred while updating password.');
      }
    });
  }

  deleteAccount(): void {
    if (!confirm('CAUTION: Are you sure you want to permanently delete your account? This action is irreversible and permanently deletes your cycle and health records.')) return;
    
    this.auth.deleteAccount().subscribe({
      next: (res) => {
        if (res.success) {
          alert('Account deleted successfully.');
          this.router.navigate(['/login']);
        } else {
          alert(res.message || 'Could not delete account. You may need to log in again first.');
        }
      }
    });
  }
}
