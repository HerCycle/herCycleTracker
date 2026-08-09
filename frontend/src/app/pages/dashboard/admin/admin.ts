import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminStats, AdminUser, Feedback } from '../../../services/admin.service';
import { Order } from '../../../services/shop.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminPage implements OnInit {
  private readonly adminService = inject(AdminService);

  // Sub-tabs: 'STATS' | 'USERS' | 'ORDERS' | 'VIDEOS' | 'FEEDBACK'
  readonly currentTab = signal<'STATS' | 'USERS' | 'ORDERS' | 'VIDEOS' | 'FEEDBACK'>('STATS');

  readonly stats = signal<AdminStats | null>(null);
  readonly users = signal<AdminUser[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly feedbacks = signal<Feedback[]>([]);

  // Video Form Fields
  readonly videoTitle = signal('');
  readonly videoDesc = signal('');
  readonly videoCategory = signal('NUTRITION');
  readonly videoThumbnail = signal('');
  readonly videoYoutubeUrl = signal('');
  readonly videoErrorMessage = signal<string | null>(null);
  readonly videoSuccessMessage = signal<string | null>(null);
  readonly isPublishingVideo = signal(false);

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.loadOrders();
    this.loadFeedbacks();
  }

  loadStats(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
      }
    });
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users.set(res.data);
        }
      }
    });
  }

  loadOrders(): void {
    this.adminService.getAllOrders().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.orders.set(res.data);
        }
      }
    });
  }

  loadFeedbacks(): void {
    this.adminService.getAllFeedback().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.feedbacks.set(res.data);
        }
      }
    });
  }

  // --- Order Status Adjuster ---
  changeOrderStatus(orderId: number, status: string): void {
    this.adminService.updateOrderStatus(orderId, status, undefined).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadOrders();
          this.loadStats();
        }
      }
    });
  }

  changeDeliveryStatus(orderId: number, deliveryStatus: string): void {
    this.adminService.updateOrderStatus(orderId, undefined, deliveryStatus).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadOrders();
        }
      }
    });
  }

  // --- Self Care Publisher ---
  publishVideo(): void {
    if (!this.videoTitle() || !this.videoYoutubeUrl()) {
      this.videoErrorMessage.set('Title and YouTube URL are required');
      return;
    }

    this.isPublishingVideo.set(true);
    this.videoErrorMessage.set(null);
    this.videoSuccessMessage.set(null);

    this.adminService.addVideo({
      title: this.videoTitle(),
      description: this.videoDesc(),
      category: this.videoCategory(),
      thumbnail: this.videoThumbnail() || undefined,
      youtubeUrl: this.videoYoutubeUrl()
    }).subscribe({
      next: (res) => {
        this.isPublishingVideo.set(false);
        if (res.success) {
          this.videoSuccessMessage.set('Self-care video published successfully!');
          this.videoTitle.set('');
          this.videoDesc.set('');
          this.videoThumbnail.set('');
          this.videoYoutubeUrl.set('');
        } else {
          this.videoErrorMessage.set(res.message || 'Failed to publish video');
        }
      },
      error: (err) => {
        this.isPublishingVideo.set(false);
        this.videoErrorMessage.set(err.message || 'An error occurred.');
      }
    });
  }
}
