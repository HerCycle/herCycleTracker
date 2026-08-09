import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly token = signal('');
  readonly newPassword = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  onSubmit(): void {
    if (!this.email() || !this.token() || !this.newPassword()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }
    if (this.newPassword().length < 6) {
      this.errorMessage.set('New password must be at least 6 characters');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.auth.resetPassword({
      email: this.email(),
      token: this.token(),
      newPassword: this.newPassword()
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.successMessage.set('Password reset successfully! Redirecting to login...');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage.set(res.message || 'Failed to reset password.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Invalid token or reset parameters.');
      }
    });
  }
}
