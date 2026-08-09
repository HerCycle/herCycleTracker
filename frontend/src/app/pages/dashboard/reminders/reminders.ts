import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReminderService, MedicineReminder, WaterProgress } from '../../../services/reminder.service';

export interface WaterLogItem {
  id: string;
  amount: number;
  time: string;
}

const DEFAULT_MED_REMINDERS: MedicineReminder[] = [
  {
    id: 1,
    medicineName: 'Organic Iron & Vitamin C Supplement',
    dosage: '1 Capsule (50mg)',
    time: '08:30:00',
    frequency: 'DAILY',
    startDate: new Date().toISOString().split('T')[0],
    completed: true
  },
  {
    id: 2,
    medicineName: 'Magnesium Glycinate Cramp Relief',
    dosage: '2 Gummies',
    time: '21:00:00',
    frequency: 'DAILY',
    startDate: new Date().toISOString().split('T')[0],
    completed: false
  }
];

const PRESETS = [
  { name: 'Iron & Vitamin C', dosage: '1 Capsule (50mg)', time: '08:30', frequency: 'DAILY' },
  { name: 'Folic Acid', dosage: '1 Tablet (400mcg)', time: '09:00', frequency: 'DAILY' },
  { name: 'Magnesium Cramp Relief', dosage: '2 Chewable Gummies', time: '21:00', frequency: 'DAILY' },
  { name: 'Period Pain Reliever', dosage: '1 Pill as needed', time: '12:00', frequency: 'DAILY' },
  { name: 'Daily Multivitamin', dosage: '1 Softgel with meal', time: '13:00', frequency: 'DAILY' },
  { name: 'Contraceptive Pill', dosage: '1 Tablet', time: '22:00', frequency: 'DAILY' }
];

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reminders.html',
  styleUrl: './reminders.scss'
})
export class RemindersPage implements OnInit {
  private readonly reminderService = inject(ReminderService);

  readonly reminders = signal<MedicineReminder[]>([]);
  readonly filterTab = signal<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  
  // Water intake state
  readonly waterGoalMl = signal<number>(2000); // in ml
  readonly waterCompletedMl = signal<number>(0);
  readonly waterLogs = signal<WaterLogItem[]>([]);
  readonly inputWaterGoalLiters = signal<number>(2.0);
  readonly customWaterInputMl = signal<number>(250);
  readonly waterHistory = signal<{ date: string; completed: number; goal: number }[]>([]);

  // Presets list
  readonly presets = PRESETS;

  // Medicine form modal state
  readonly isModalOpen = signal(false);
  readonly selectedReminder = signal<MedicineReminder | null>(null);
  readonly medicineName = signal('');
  readonly dosage = signal('');
  readonly time = signal('08:00');
  readonly frequency = signal('DAILY');
  readonly startDate = signal(new Date().toISOString().split('T')[0]);
  readonly endDate = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly isSaving = signal(false);

  // Toast alert
  readonly toastMessage = signal<string | null>(null);

  // Computed properties
  readonly filteredReminders = computed(() => {
    const list = this.reminders();
    const filter = this.filterTab();
    if (filter === 'ACTIVE') return list.filter(r => !r.completed);
    if (filter === 'COMPLETED') return list.filter(r => r.completed);
    return list;
  });

  readonly waterPercentage = computed(() => {
    const goal = this.waterGoalMl();
    if (!goal || goal <= 0) return 0;
    const pct = Math.round((this.waterCompletedMl() / goal) * 100);
    return Math.min(pct, 100);
  });

  readonly isWaterGoalReached = computed(() => {
    return this.waterCompletedMl() >= this.waterGoalMl();
  });

  ngOnInit(): void {
    this.loadReminders();
    this.loadWaterDetails();
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3000);
  }

  // --- Load Data ---
  loadReminders(): void {
    const local = localStorage.getItem('hc_medicine_reminders');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.reminders.set(parsed);
        } else {
          this.reminders.set(DEFAULT_MED_REMINDERS);
          this.saveLocalReminders(DEFAULT_MED_REMINDERS);
        }
      } catch (e) {
        this.reminders.set(DEFAULT_MED_REMINDERS);
      }
    } else {
      this.reminders.set(DEFAULT_MED_REMINDERS);
      this.saveLocalReminders(DEFAULT_MED_REMINDERS);
    }

    // Attempt backend load
    this.reminderService.getReminders().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.reminders.set(res.data);
          this.saveLocalReminders(res.data);
        }
      }
    });
  }

  saveLocalReminders(list: MedicineReminder[]): void {
    localStorage.setItem('hc_medicine_reminders', JSON.stringify(list));
  }

  loadWaterDetails(): void {
    const savedGoal = localStorage.getItem('hc_water_goal_ml');
    const savedCompleted = localStorage.getItem('hc_water_completed_ml');
    const savedLogs = localStorage.getItem('hc_water_today_logs');
    const savedHistory = localStorage.getItem('hc_water_history_data');

    const goal = savedGoal ? parseInt(savedGoal, 10) : 2000;
    const completed = savedCompleted ? parseInt(savedCompleted, 10) : 750;
    
    this.waterGoalMl.set(goal);
    this.inputWaterGoalLiters.set(goal / 1000);
    this.waterCompletedMl.set(completed);

    if (savedLogs) {
      try {
        this.waterLogs.set(JSON.parse(savedLogs));
      } catch (e) {
        this.waterLogs.set([{ id: '1', amount: 500, time: '09:00 AM' }, { id: '2', amount: 250, time: '11:30 AM' }]);
      }
    } else {
      const defaultLogs = [
        { id: '1', amount: 500, time: '09:00 AM' },
        { id: '2', amount: 250, time: '11:30 AM' }
      ];
      this.waterLogs.set(defaultLogs);
      localStorage.setItem('hc_water_today_logs', JSON.stringify(defaultLogs));
    }

    if (savedHistory) {
      try {
        this.waterHistory.set(JSON.parse(savedHistory));
      } catch (e) {
        this.waterHistory.set(this.getMockWaterHistory());
      }
    } else {
      const history = this.getMockWaterHistory();
      this.waterHistory.set(history);
      localStorage.setItem('hc_water_history_data', JSON.stringify(history));
    }

    // Try backend
    this.reminderService.getWaterToday().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (res.data.goal) {
            this.waterGoalMl.set(res.data.goal);
            this.inputWaterGoalLiters.set(res.data.goal / 1000);
            localStorage.setItem('hc_water_goal_ml', res.data.goal.toString());
          }
        }
      }
    });
  }

  getMockWaterHistory() {
    const today = new Date();
    const d1 = new Date(today); d1.setDate(d1.getDate() - 1);
    const d2 = new Date(today); d2.setDate(d2.getDate() - 2);
    const d3 = new Date(today); d3.setDate(d3.getDate() - 3);
    return [
      { date: d1.toISOString().split('T')[0], completed: 2000, goal: 2000 },
      { date: d2.toISOString().split('T')[0], completed: 1750, goal: 2000 },
      { date: d3.toISOString().split('T')[0], completed: 2250, goal: 2000 }
    ];
  }

  // --- Water Operations ---
  addWater(amountMl: number): void {
    if (amountMl <= 0) return;
    const newTotal = this.waterCompletedMl() + amountMl;
    this.waterCompletedMl.set(newTotal);
    localStorage.setItem('hc_water_completed_ml', newTotal.toString());

    const newLog: WaterLogItem = {
      id: Date.now().toString(),
      amount: amountMl,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedLogs = [newLog, ...this.waterLogs()];
    this.waterLogs.set(updatedLogs);
    localStorage.setItem('hc_water_today_logs', JSON.stringify(updatedLogs));

    this.showToast(`💧 Added +${amountMl} ml of water!`);

    // Sync backend
    this.reminderService.addWater(amountMl).subscribe();
  }

  deleteWaterLog(logId: string): void {
    const log = this.waterLogs().find(l => l.id === logId);
    if (!log) return;

    const newTotal = Math.max(0, this.waterCompletedMl() - log.amount);
    this.waterCompletedMl.set(newTotal);
    localStorage.setItem('hc_water_completed_ml', newTotal.toString());

    const updatedLogs = this.waterLogs().filter(l => l.id !== logId);
    this.waterLogs.set(updatedLogs);
    localStorage.setItem('hc_water_today_logs', JSON.stringify(updatedLogs));

    this.showToast(`Removed ${log.amount} ml hydration entry.`);
  }

  resetWaterToday(): void {
    if (!confirm('Are you sure you want to reset today\'s water intake to 0 ml?')) return;
    this.waterCompletedMl.set(0);
    this.waterLogs.set([]);
    localStorage.setItem('hc_water_completed_ml', '0');
    localStorage.setItem('hc_water_today_logs', JSON.stringify([]));
    this.showToast('Water intake reset to 0 ml.');
  }

  saveWaterGoal(): void {
    const goalMl = Math.round(this.inputWaterGoalLiters() * 1000);
    if (goalMl < 500 || goalMl > 10000) {
      alert('Please enter a goal between 0.5 Liters (500ml) and 10 Liters (10000ml).');
      return;
    }
    this.waterGoalMl.set(goalMl);
    localStorage.setItem('hc_water_goal_ml', goalMl.toString());
    this.showToast(`🎯 Daily hydration goal updated to ${this.inputWaterGoalLiters()} Liters!`);

    this.reminderService.updateWaterGoal(goalMl).subscribe();
  }

  // --- Medication Operations ---
  toggleReminderCompleted(reminder: MedicineReminder): void {
    const updated = this.reminders().map(r => {
      if (r.id === reminder.id) {
        const nextState = !r.completed;
        this.showToast(nextState ? `✅ Marked ${r.medicineName} as Taken!` : `Unmarked ${r.medicineName}`);
        return { ...r, completed: nextState };
      }
      return r;
    });

    this.reminders.set(updated);
    this.saveLocalReminders(updated);

    if (reminder.id) {
      this.reminderService.completeReminder(reminder.id, !reminder.completed).subscribe();
    }
  }

  applyPreset(preset: { name: string; dosage: string; time: string; frequency: string }): void {
    this.medicineName.set(preset.name);
    this.dosage.set(preset.dosage);
    this.time.set(preset.time);
    this.frequency.set(preset.frequency);
  }

  openAddModal(): void {
    this.selectedReminder.set(null);
    this.medicineName.set('');
    this.dosage.set('');
    this.time.set('08:30');
    this.frequency.set('DAILY');
    this.startDate.set(new Date().toISOString().split('T')[0]);
    this.endDate.set('');
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(reminder: MedicineReminder): void {
    this.selectedReminder.set(reminder);
    this.medicineName.set(reminder.medicineName);
    this.dosage.set(reminder.dosage || '');
    this.time.set(reminder.time ? reminder.time.substring(0, 5) : '08:00');
    this.frequency.set(reminder.frequency || 'DAILY');
    this.startDate.set(reminder.startDate);
    this.endDate.set(reminder.endDate || '');
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveReminder(): void {
    if (!this.medicineName() || !this.startDate() || !this.time()) {
      this.errorMessage.set('Please fill in all required fields (Medicine Name, Start Date, Time)');
      return;
    }

    const payload: MedicineReminder = {
      id: this.selectedReminder()?.id || Date.now(),
      medicineName: this.medicineName(),
      dosage: this.dosage() || undefined,
      time: this.time().length === 5 ? this.time() + ':00' : this.time(),
      frequency: this.frequency(),
      startDate: this.startDate(),
      endDate: this.endDate() || undefined,
      completed: this.selectedReminder()?.completed || false
    };

    const currentList = this.reminders();
    let updatedList: MedicineReminder[];

    if (this.selectedReminder()) {
      updatedList = currentList.map(r => r.id === payload.id ? payload : r);
      this.showToast(`Updated reminder: ${payload.medicineName}`);
    } else {
      updatedList = [payload, ...currentList];
      this.showToast(`Added reminder: ${payload.medicineName}`);
    }

    this.reminders.set(updatedList);
    this.saveLocalReminders(updatedList);
    this.closeModal();

    // Backend sync
    const reminder = this.selectedReminder();
    const req = reminder?.id
      ? this.reminderService.updateReminder(reminder.id, payload)
      : this.reminderService.saveReminder(payload);
    req.subscribe();
  }

  deleteReminder(id?: number): void {
    if (!id || !confirm('Are you sure you want to delete this medication reminder?')) return;
    
    const updated = this.reminders().filter(r => r.id !== id);
    this.reminders.set(updated);
    this.saveLocalReminders(updated);
    this.showToast('Medication reminder deleted.');

    this.reminderService.deleteReminder(id).subscribe();
  }
}

