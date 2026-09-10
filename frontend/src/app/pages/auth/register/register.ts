import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterPage implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private authSubscription?: Subscription;

  // Google User Onboarding Mode
  readonly isGoogleUser = signal(false);

  // Step 1: Account Details, Step 2: Health Info, Step 3: Period Information
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

  // Step 3 Form Fields (Period Information)
  readonly periodStartDate = signal('');
  readonly cycleLength = signal<number | null>(28);
  readonly periodLength = signal<number | null>(5);
  readonly flow = signal('MEDIUM');
  readonly notes = signal('');

  // Inline Validation Error Signals
  readonly periodStartDateError = signal<string | null>(null);
  readonly cycleLengthError = signal<string | null>(null);
  readonly periodLengthError = signal<string | null>(null);

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  // Max selectable date for last period start date (cannot be future)
  readonly todayDateStr = this.getTodayDateStr();

  ngOnInit(): void {
    this.authSubscription = this.auth.user$.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await this.auth.getProfileSnapshot(firebaseUser.uid);
          if (this.auth.isProfileComplete(profile)) {
            this.router.navigate(['/dashboard/home']);
            return;
          }

          // User is authenticated but onboarding is incomplete (first-time Google user or partial setup)
          this.isGoogleUser.set(true);
          const nameParts = (firebaseUser.displayName || '').trim().split(' ');
          if (!this.firstName()) this.firstName.set(profile?.firstName || nameParts[0] || '');
          if (!this.lastName()) this.lastName.set(profile?.lastName || nameParts.slice(1).join(' ') || '');
          if (!this.email()) this.email.set(profile?.email || firebaseUser.email || '');

          if (profile?.phone && !this.phone()) this.phone.set(profile.phone);
          if (profile?.dateOfBirth && !this.dateOfBirth()) this.dateOfBirth.set(profile.dateOfBirth);
          if (profile?.height != null && this.height() === null) this.height.set(profile.height);
          if (profile?.weight != null && this.weight() === null) this.weight.set(profile.weight);
          if (profile?.bloodGroup && !this.bloodGroup()) this.bloodGroup.set(profile.bloodGroup);
          if (profile?.pregnancyStatus != null) this.pregnancyStatus.set(profile.pregnancyStatus);
          if (profile?.cycleLength) this.cycleLength.set(profile.cycleLength);
          if (profile?.periodLength) this.periodLength.set(profile.periodLength);
        } catch (err) {
          console.warn('Error fetching profile in RegisterPage:', err);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  private getTodayDateStr(): string {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  nextStep(): void {
    if (this.currentStep() === 1) {
      if (this.isGoogleUser()) {
        if (!this.firstName().trim() || !this.lastName().trim() || !this.email().trim()) {
          this.errorMessage.set('Please fill in all required fields (First name, Last name, Email)');
          return;
        }
      } else {
        if (!this.firstName().trim() || !this.lastName().trim() || !this.email().trim() || !this.password()) {
          this.errorMessage.set('Please fill in all required fields (First name, Last name, Email, Password)');
          return;
        }
        if (this.password().length < 6) {
          this.errorMessage.set('Password must be at least 6 characters');
          return;
        }
      }
      this.errorMessage.set(null);
      this.currentStep.set(2);
    } else if (this.currentStep() === 2) {
      this.errorMessage.set(null);
      this.currentStep.set(3);
    }
  }

  prevStep(): void {
    if (this.currentStep() === 3) {
      this.currentStep.set(2);
      this.errorMessage.set(null);
    } else if (this.currentStep() === 2) {
      this.currentStep.set(1);
      this.errorMessage.set(null);
    }
  }

  onStartDateChange(val: string): void {
    this.periodStartDate.set(val);
    if (this.periodStartDateError()) {
      this.validateStartDate(val);
    }
  }

  onCycleLengthChange(val: any): void {
    this.cycleLength.set(val !== '' && val !== null ? Number(val) : null);
    if (this.cycleLengthError()) {
      this.validateCycleLength(this.cycleLength());
    }
  }

  onPeriodLengthChange(val: any): void {
    this.periodLength.set(val !== '' && val !== null ? Number(val) : null);
    if (this.periodLengthError()) {
      this.validatePeriodLength(this.periodLength());
    }
  }

  private validateStartDate(startDateVal: string): boolean {
    if (!startDateVal || !startDateVal.trim()) {
      this.periodStartDateError.set('Last period start date is required');
      return false;
    }
    const parts = startDateVal.split('-').map(Number);
    if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      this.periodStartDateError.set('Please enter a valid date');
      return false;
    }
    const enteredDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (enteredDate.getTime() > today.getTime()) {
      this.periodStartDateError.set('Period start date cannot be a future date');
      return false;
    }
    this.periodStartDateError.set(null);
    return true;
  }

  private validateCycleLength(cycleVal: number | null): boolean {
    if (cycleVal === null || cycleVal === undefined || isNaN(cycleVal)) {
      this.cycleLengthError.set('Cycle length is required');
      return false;
    }
    if (!Number.isInteger(cycleVal) || cycleVal < 15 || cycleVal > 60) {
      this.cycleLengthError.set('Cycle length must be between 15 and 60 days (typical average: 28 days)');
      return false;
    }
    this.cycleLengthError.set(null);
    return true;
  }

  private validatePeriodLength(periodVal: number | null): boolean {
    if (periodVal !== null && periodVal !== undefined && !isNaN(periodVal)) {
      if (!Number.isInteger(periodVal) || periodVal < 1 || periodVal > 15) {
        this.periodLengthError.set('Period duration must be between 1 and 15 days');
        return false;
      }
    }
    this.periodLengthError.set(null);
    return true;
  }

  validatePeriodInfo(): boolean {
    const isStartValid = this.validateStartDate(this.periodStartDate());
    const isCycleValid = this.validateCycleLength(this.cycleLength());
    const isPeriodValid = this.validatePeriodLength(this.periodLength());

    return isStartValid && isCycleValid && isPeriodValid;
  }

  onSubmit(): void {
    if (!this.validatePeriodInfo()) {
      this.errorMessage.set('Please correct the validation errors in the period information section');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      email: this.email().trim(),
      password: this.password(),
      phone: this.phone().trim() || undefined,
      dateOfBirth: this.dateOfBirth() || undefined,
      height: this.height() || undefined,
      weight: this.weight() || undefined,
      bloodGroup: this.bloodGroup() || undefined,
      pregnancyStatus: this.pregnancyStatus(),
      notificationsEnabled: this.notificationsEnabled(),
      periodStartDate: this.periodStartDate(),
      cycleLength: Number(this.cycleLength()) || 28,
      periodLength: this.periodLength() != null ? Number(this.periodLength()) : 5,
      flow: this.flow() || 'MEDIUM',
      notes: this.notes().trim() || undefined
    };

    if (this.isGoogleUser()) {
      this.auth.completeGoogleOnboarding(payload).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success) {
            this.successMessage.set('Profile setup completed! Taking you to your dashboard...');
            setTimeout(() => {
              this.router.navigate(['/dashboard/home']);
            }, 1000);
          } else {
            this.errorMessage.set(res.message || 'Failed to complete profile onboarding.');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.message || 'An error occurred while completing your profile.');
        }
      });
    } else {
      this.auth.register(payload).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success) {
            this.successMessage.set('Account created successfully! Taking you to your dashboard...');
            setTimeout(() => {
              this.router.navigate(['/dashboard/home']);
            }, 1200);
          } else {
            this.errorMessage.set(res.message || 'Registration failed.');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.message || 'An error occurred during registration.');
        }
      });
    }
  }

  onGoogleSignUp(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.auth.loginWithGoogle().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          if (res.requiresOnboarding) {
            this.isGoogleUser.set(true);
            if (res.user) {
              if (res.user.firstName) this.firstName.set(res.user.firstName);
              if (res.user.lastName) this.lastName.set(res.user.lastName);
              if (res.user.email) this.email.set(res.user.email);
            }
            this.successMessage.set('Google account connected! Please complete your profile.');
          } else {
            this.successMessage.set('Welcome back! Taking you to your dashboard...');
            setTimeout(() => {
              this.router.navigate(['/dashboard/home']);
            }, 800);
          }
        } else {
          this.errorMessage.set(res.message || 'Google sign-up failed.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.message || 'Google sign-up failed.');
      }
    });
  }
}
