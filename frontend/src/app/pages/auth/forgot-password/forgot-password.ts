import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly resetToken = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  onSubmit(): void {
    if (!this.email()) {
      this.errorMessage.set('Please enter your email address');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.resetToken.set(null);

    this.auth.forgotPassword(this.email()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.resetToken.set(res.data);
          this.successMessage.set('Reset token generated! Copy the token and proceed to reset your password.');
        } else {
          this.errorMessage.set(res.message || 'Failed to request password reset.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Email not found or error occurred.');
      }
    });
  }
}
