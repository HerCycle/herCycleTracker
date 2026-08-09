import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.html',
  styleUrl: './feedback.scss'
})
export class FeedbackPage {
  private readonly adminService = inject(AdminService);

  readonly rating = signal(5);
  readonly message = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  setRating(val: number): void {
    this.rating.set(val);
  }

  onSubmit(): void {
    if (!this.message()) {
      this.errorMessage.set('Please enter a feedback message');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.adminService.submitFeedback({
      rating: this.rating(),
      message: this.message()
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.successMessage.set('Thank you for your valuable feedback! We appreciate your input.');
          this.message.set('');
          this.rating.set(5);
        } else {
          this.errorMessage.set(res.message || 'Failed to submit feedback');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'An error occurred during submission.');
      }
    });
  }
}
