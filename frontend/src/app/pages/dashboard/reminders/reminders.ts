import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReminderService, MedicineReminder, WaterProgress } from '../../../services/reminder.service';
import { Subscription } from 'rxjs';

export interface WaterLogEntry {
  id: string;
  amount: number;
  time: string;
}

export interface MedicinePreset {
  name: string;
  dosage: string;
  freq: string;
  time: string;
}

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reminders.html',
  styleUrl: './reminders.scss'
})
export class RemindersPage implements OnInit, OnDestroy {
  private readonly reminderService = inject(ReminderService);
  private remindersSub?: Subscription;
  private waterSub?: Subscription;

  // Notification Toast
  readonly toastMessage = signal<string | null>(null);

  // Filter State
  readonly filterTab = signal<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Reminders List from Firestore
  readonly reminders = signal<MedicineReminder[]>([]);
  readonly isLoading = signal(true);

  // Filtered Reminders
  readonly filteredReminders = computed(() => {
    const list = this.reminders();
    const tab = this.filterTab();
    if (tab === 'ACTIVE') return list.filter(r => !r.completed);
    if (tab === 'COMPLETED') return list.filter(r => r.completed);
    return list;
  });

  // Modal State
  readonly isModalOpen = signal(false);
  readonly selectedReminder = signal<MedicineReminder | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Form Fields
  readonly medicineName = signal('');
  readonly dosage = signal('');
  readonly time = signal('08:00');
  readonly frequency = signal('DAILY');
  readonly startDate = signal(new Date().toISOString().split('T')[0]);
  readonly endDate = signal('');

  // Presets
  readonly presets: MedicinePreset[] = [
    { name: 'Organic Iron & Vitamin C', dosage: '1 Tablet', freq: 'DAILY', time: '08:00' },
    { name: 'Folic Acid (B9)', dosage: '400 mcg', freq: 'DAILY', time: '13:00' },
    { name: 'Magnesium & Zinc', dosage: '1 Capsule', freq: 'DAILY', time: '20:00' },
    { name: 'Evening Primrose Oil', dosage: '500 mg', freq: 'DAILY', time: '09:00' },
    { name: 'Vitamin D3 & K2', dosage: '2000 IU', freq: 'WEEKLY', time: '10:00' }
  ];

  // Water Tracking State from Firestore
  readonly waterCompletedMl = signal<number>(0);
  readonly waterGoalMl = signal<number>(2500);
  readonly customWaterInputMl = signal<number>(250);
  readonly inputWaterGoalLiters = signal<number>(2.5);
  readonly waterLogs = signal<WaterLogEntry[]>([]);

  readonly waterPercentage = computed(() => {
    const goal = this.waterGoalMl() || 2500;
    const completed = this.waterCompletedMl() || 0;
    return Math.min(Math.round((completed / goal) * 100), 100);
  });

  readonly isWaterGoalReached = computed(() => {
    return this.waterCompletedMl() >= this.waterGoalMl() && this.waterGoalMl() > 0;
  });

  ngOnInit(): void {
    // 1. Subscribe to Reminders from Firestore
    this.remindersSub = this.reminderService.getReminders().subscribe({
      next: (list) => {
        this.isLoading.set(false);
        this.reminders.set(list || []);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });

    // 2. Subscribe to Water Tracking from Firestore
    this.waterSub = this.reminderService.getWaterToday().subscribe({
      next: (progress) => {
        if (progress) {
          this.waterCompletedMl.set(progress.completed || 0);
          if (progress.goal) {
            this.waterGoalMl.set(progress.goal);
            this.inputWaterGoalLiters.set(Number((progress.goal / 1000).toFixed(1)));
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.remindersSub?.unsubscribe();
    this.waterSub?.unsubscribe();
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3500);
  }

  // --- Modal Operations ---
  openAddModal(): void {
    this.selectedReminder.set(null);
    this.medicineName.set('');
    this.dosage.set('');
    this.time.set('08:00');
    this.frequency.set('DAILY');
    this.startDate.set(new Date().toISOString().split('T')[0]);
    this.endDate.set('');
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(rem: MedicineReminder): void {
    this.selectedReminder.set(rem);
    this.medicineName.set(rem.medicineName);
    this.dosage.set(rem.dosage || '');
    this.time.set(rem.time || '08:00');
    this.frequency.set(rem.frequency || 'DAILY');
    this.startDate.set(rem.startDate || new Date().toISOString().split('T')[0]);
    this.endDate.set(rem.endDate || '');
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  applyPreset(preset: MedicinePreset): void {
    this.medicineName.set(preset.name);
    this.dosage.set(preset.dosage);
    this.frequency.set(preset.freq);
    this.time.set(preset.time);
  }

  saveReminder(): void {
    if (!this.medicineName().trim()) {
      this.errorMessage.set('Please enter a medicine or supplement name');
      return;
    }

    const payload: MedicineReminder = {
      medicineName: this.medicineName().trim(),
      dosage: this.dosage().trim() || undefined,
      time: this.time() || '08:00',
      frequency: this.frequency() || 'DAILY',
      startDate: this.startDate() || new Date().toISOString().split('T')[0],
      endDate: this.endDate() || undefined,
      completed: this.selectedReminder()?.completed || false
    };

    const selected = this.selectedReminder();
    const action$ = selected?.id
      ? this.reminderService.updateReminder(selected.id, payload)
      : this.reminderService.saveReminder(payload);

    action$.subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast(selected?.id ? 'Reminder updated in Firestore!' : 'Reminder saved to Firestore!');
          this.closeModal();
        } else {
          this.errorMessage.set(res.message || 'Failed to save reminder');
        }
      },
      error: () => {
        this.errorMessage.set('An error occurred while saving reminder');
      }
    });
  }

  toggleReminderCompleted(reminder: MedicineReminder): void {
    if (!reminder.id) return;
    const targetStatus = !reminder.completed;
    this.reminderService.completeReminder(reminder.id, targetStatus).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast(targetStatus ? 'Marked as taken today!' : 'Marked as pending');
        }
      }
    });
  }

  deleteReminder(id?: string): void {
    if (!id || !confirm('Are you sure you want to delete this reminder?')) return;
    this.reminderService.deleteReminder(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast('Reminder deleted from Firestore.');
        }
      }
    });
  }

  // --- Water Operations ---
  addWater(amount: number): void {
    const ml = Number(amount) || 250;
    if (ml <= 0) return;

    this.reminderService.addWater(ml).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.waterCompletedMl.set(res.data.completed);
          const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const newEntry: WaterLogEntry = {
            id: 'log-' + Date.now(),
            amount: ml,
            time: timeNow
          };
          this.waterLogs.update(logs => [newEntry, ...logs]);
          this.showToast(`Added +${ml} ml of water!`);
        }
      }
    });
  }

  resetWaterToday(): void {
    if (!confirm("Reset today's logged water intake to 0 ml?")) return;
    this.waterCompletedMl.set(0);
    this.waterLogs.set([]);
    this.reminderService.addWater(-6000).subscribe();
    this.showToast("Today's water intake reset.");
  }

  saveWaterGoal(): void {
    const liters = Number(this.inputWaterGoalLiters());
    if (liters >= 0.5 && liters <= 10) {
      const ml = Math.round(liters * 1000);
      this.waterGoalMl.set(ml);
      this.reminderService.updateWaterGoal(ml).subscribe({
        next: (res) => {
          if (res.success) {
            this.showToast(`Daily water goal updated to ${liters} L!`);
          }
        }
      });
    }
  }

  deleteWaterLog(id: string): void {
    const log = this.waterLogs().find(l => l.id === id);
    if (log) {
      this.waterLogs.update(logs => logs.filter(l => l.id !== id));
      this.reminderService.addWater(-log.amount).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.waterCompletedMl.set(res.data.completed);
          }
        }
      });
    }
  }
}
