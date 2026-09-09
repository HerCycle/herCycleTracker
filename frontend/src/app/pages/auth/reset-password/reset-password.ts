import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPasswordPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly email = signal('');
  readonly token = signal('');
  readonly newPassword = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  ngOnInit(): void {
    // Read oobCode / token from query parameters if redirected from Firebase email
    this.route.queryParams.subscribe(params => {
      const code = params['oobCode'] || params['token'] || '';
      if (code) {
        this.token.set(code);
      }
    });
  }

  onSubmit(): void {
    if (!this.token() || !this.newPassword()) {
      this.errorMessage.set('Please provide both the reset code/token and your new password');
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
      email: this.email().trim(),
      token: this.token().trim(),
      newPassword: this.newPassword()
    }).subscribe({
      next: (res: { success: boolean; message: string }) => {
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
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.message || 'Invalid or expired reset token.');
      }
    });
  }
}
