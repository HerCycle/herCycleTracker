import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly showPassword = signal(false);

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.login({
      email: this.email().trim(),
      password: this.password()
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          if (res.user && !this.auth.isProfileComplete(res.user)) {
            this.router.navigate(['/register']);
          } else {
            this.router.navigate(['/dashboard/home']);
          }
        } else {
          this.errorMessage.set(res.message || 'Login failed. Please check credentials.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Incorrect email or password.');
      }
    });
  }

  onGoogleSignIn(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.loginWithGoogle().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          if (res.requiresOnboarding) {
            this.router.navigate(['/register']);
          } else {
            this.router.navigate(['/dashboard/home']);
          }
        } else {
          this.errorMessage.set(res.message || 'Google sign-in failed.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.message || 'Google sign-in failed.');
      }
    });
  }
}
