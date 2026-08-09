import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Step 1: Account Details, Step 2: Health Info
  readonly currentStep = signal(1);

  // Step 1 Form Fields
  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly phone = signal('');

  // Step 2 Form Fields
  readonly dateOfBirth = signal('');
  readonly height = signal<number | null>(null);
  readonly weight = signal<number | null>(null);
  readonly bloodGroup = signal('');
  readonly pregnancyStatus = signal(false);
  readonly notificationsEnabled = signal(true);

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  nextStep(): void {
    if (!this.firstName() || !this.lastName() || !this.email() || !this.password()) {
      this.errorMessage.set('Please fill in all required fields (First name, Last name, Email, Password)');
      return;
    }
    if (this.password().length < 6) {
      this.errorMessage.set('Password must be at least 6 characters');
      return;
    }
    this.errorMessage.set(null);
    this.currentStep.set(2);
  }

  prevStep(): void {
    this.currentStep.set(1);
  }

  onSubmit(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      firstName: this.firstName(),
      lastName: this.lastName(),
      email: this.email(),
      password: this.password(),
      phone: this.phone() || undefined,
      dateOfBirth: this.dateOfBirth() || undefined,
      height: this.height() || undefined,
      weight: this.weight() || undefined,
      bloodGroup: this.bloodGroup() || undefined,
      pregnancyStatus: this.pregnancyStatus(),
      notificationsEnabled: this.notificationsEnabled()
    };

    this.auth.register(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.successMessage.set('Registration successful! Redirecting to login...');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage.set(res.message || 'Registration failed.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'An error occurred during registration.');
      }
    });
  }
}
