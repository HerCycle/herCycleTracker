import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CycleService, PeriodLog } from '../../../services/cycle.service';
import { SymptomService, SymptomLog } from '../../../services/symptom.service';
import { ReminderService, MedicineReminder } from '../../../services/reminder.service';

const DEFAULT_REMINDERS: MedicineReminder[] = [
  { id: 1, medicineName: 'Iron & Vitamin C', dosage: '1 Tablet', time: '08:00 AM', startDate: '2026-08-09', completed: true },
  { id: 2, medicineName: 'Folic Acid', dosage: '400 mcg', time: '01:00 PM', startDate: '2026-08-09', completed: false },
  { id: 3, medicineName: 'Multivitamin', dosage: '1 Capsule', time: '08:00 PM', startDate: '2026-08-09', completed: false }
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomePage implements OnInit {
  private readonly cycleService = inject(CycleService);
  private readonly symptomService = inject(SymptomService);
  private readonly reminderService = inject(ReminderService);

  // Cycle State
  readonly currentPeriod = signal<PeriodLog | null>(null);
  readonly nextPeriodDate = signal<string | null>('2026-08-29');
  readonly regularityScore = signal<number>(85);
  readonly isLate = signal<boolean>(false);
  readonly isIrregular = signal<boolean>(false);
  readonly cycleDay = signal<number>(9);
  readonly cycleLength = signal<number>(28);
  readonly cyclePhase = signal<string>('Follicular Phase');
  readonly phaseProgress = signal<number>(32);

  // Habits State (Guaranteed non-NaN water values)
  readonly waterCompleted = signal<number>(1250);
  readonly waterGoal = signal<number>(2500);
  readonly medicineReminders = signal<MedicineReminder[]>([]);

  // Computed Water helpers
  readonly waterPercentage = computed(() => {
    const goal = this.waterGoal() || 2500;
    const completed = this.waterCompleted() || 0;
    return Math.min(Math.round((completed / goal) * 100), 100);
  });

  readonly waterCompletedLiters = computed(() => {
    return ((this.waterCompleted() || 0) / 1000).toFixed(1);
  });

  readonly waterGoalLiters = computed(() => {
    return ((this.waterGoal() || 2500) / 1000).toFixed(1);
  });

  // Symptom Logging State
  readonly todaySymptoms = signal<SymptomLog>({
    date: new Date().toISOString().split('T')[0],
    mood: 'HAPPY',
    pain: 0,
    cramps: false,
    headache: false,
    bloating: false,
    fatigue: false
  });

  ngOnInit(): void {
    this.loadWaterDetails();
    this.loadCycleDetails();
    this.loadReminders();
    this.loadTodaySymptoms();
  }

  loadWaterDetails(): void {
    const savedCompleted = localStorage.getItem('hc_water_today');
    const savedGoal = localStorage.getItem('hc_water_goal');

    if (savedCompleted !== null) {
      this.waterCompleted.set(parseInt(savedCompleted, 10) || 1250);
    } else {
      this.waterCompleted.set(1250);
      localStorage.setItem('hc_water_today', '1250');
    }

    if (savedGoal !== null) {
      this.waterGoal.set(parseInt(savedGoal, 10) || 2500);
    } else {
      this.waterGoal.set(2500);
      localStorage.setItem('hc_water_goal', '2500');
    }

    // Server sync
    this.reminderService.getWaterToday().subscribe({
      next: (res) => {
        if (res.success && res.data && typeof res.data.completed === 'number') {
          this.waterCompleted.set(res.data.completed);
          if (res.data.goal) this.waterGoal.set(res.data.goal);
          localStorage.setItem('hc_water_today', String(res.data.completed));
        }
      }
    });
  }

  addWater(amount: number): void {
    const newAmount = Math.min((this.waterCompleted() || 0) + amount, 5000);
    this.waterCompleted.set(newAmount);
    localStorage.setItem('hc_water_today', String(newAmount));

    this.reminderService.addWater(amount).subscribe();
  }

  loadCycleDetails(): void {
    const savedLogs = localStorage.getItem('hc_period_logs');
    let latestStart: Date | null = null;
    let cycleLen = 28;

    if (savedLogs) {
      try {
        const parsed: PeriodLog[] = JSON.parse(savedLogs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sorted = [...parsed].sort((a, b) => new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime());
          latestStart = new Date(sorted[0].periodStartDate);
          if (sorted[0].cycleLength) cycleLen = sorted[0].cycleLength;
        }
      } catch (e) {}
    }

    if (!latestStart) {
      latestStart = new Date('2026-08-01');
    }

    this.cycleLength.set(cycleLen);

    const today = new Date();
    today.setHours(0,0,0,0);
    latestStart.setHours(0,0,0,0);

    const diffTime = today.getTime() - latestStart.getTime();
    const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const dayInCycle = ((diffDays - 1) % cycleLen) + 1;
    this.cycleDay.set(dayInCycle);

    const pct = Math.round((dayInCycle / cycleLen) * 100);
    this.phaseProgress.set(pct);

    // Next period calculation
    const nextP = new Date(latestStart);
    nextP.setDate(nextP.getDate() + Math.ceil(diffDays / cycleLen) * cycleLen);
    this.nextPeriodDate.set(nextP.toISOString().split('T')[0]);

    // Determine cycle phase
    if (dayInCycle <= 5) {
      this.cyclePhase.set('Menstrual Phase');
    } else if (dayInCycle <= 11) {
      this.cyclePhase.set('Follicular Phase');
    } else if (dayInCycle <= 16) {
      this.cyclePhase.set('Ovulatory Phase');
    } else {
      this.cyclePhase.set('Luteal Phase');
    }

    // Try backend sync
    this.cycleService.getCurrent().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentPeriod.set(res.data);
        }
      }
    });
  }

  loadReminders(): void {
    const savedReminders = localStorage.getItem('hc_medicine_reminders');
    if (savedReminders) {
      try {
        const parsed = JSON.parse(savedReminders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.medicineReminders.set(parsed);
        } else {
          this.medicineReminders.set(DEFAULT_REMINDERS);
          localStorage.setItem('hc_medicine_reminders', JSON.stringify(DEFAULT_REMINDERS));
        }
      } catch (e) {
        this.medicineReminders.set(DEFAULT_REMINDERS);
      }
    } else {
      this.medicineReminders.set(DEFAULT_REMINDERS);
      localStorage.setItem('hc_medicine_reminders', JSON.stringify(DEFAULT_REMINDERS));
    }

    this.reminderService.getReminders().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.medicineReminders.set(res.data);
          localStorage.setItem('hc_medicine_reminders', JSON.stringify(res.data));
        }
      }
    });
  }

  toggleReminder(reminder: MedicineReminder): void {
    const targetStatus = !reminder.completed;
    const updated = this.medicineReminders().map(r => r.id === reminder.id ? { ...r, completed: targetStatus } : r);
    this.medicineReminders.set(updated);
    localStorage.setItem('hc_medicine_reminders', JSON.stringify(updated));

    if (reminder.id) {
      this.reminderService.completeReminder(reminder.id, targetStatus).subscribe();
    }
  }

  loadTodaySymptoms(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    const savedHistory = localStorage.getItem('hc_symptom_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const todayEntry = parsed.find((item: any) => item.date === todayStr || item.dateStr === todayStr);
          if (todayEntry) {
            this.todaySymptoms.set(todayEntry);
          }
        }
      } catch (e) {}
    }
  }

  toggleQuickSymptom(type: 'cramps' | 'headache' | 'bloating' | 'fatigue'): void {
    const current = { ...this.todaySymptoms() };
    current[type] = !current[type];
    this.todaySymptoms.set(current);
    this.saveSymptomsLocally(current);

    if (current.id) {
      this.symptomService.updateSymptoms(current.id, current).subscribe();
    } else {
      this.symptomService.saveSymptoms(current).subscribe();
    }
  }

  changeMood(mood: string): void {
    const current = { ...this.todaySymptoms(), mood };
    this.todaySymptoms.set(current);
    this.saveSymptomsLocally(current);

    if (current.id) {
      this.symptomService.updateSymptoms(current.id, current).subscribe();
    } else {
      this.symptomService.saveSymptoms(current).subscribe();
    }
  }

  private saveSymptomsLocally(entry: SymptomLog): void {
    const savedHistory = localStorage.getItem('hc_symptom_history');
    let history: SymptomLog[] = [];
    if (savedHistory) {
      try { history = JSON.parse(savedHistory); } catch (e) {}
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const existingIndex = history.findIndex(h => h.date === todayStr);
    if (existingIndex >= 0) {
      history[existingIndex] = entry;
    } else {
      history.unshift(entry);
    }
    localStorage.setItem('hc_symptom_history', JSON.stringify(history));
  }
}
