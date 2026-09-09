import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CycleService, PeriodLog, CycleMetrics } from '../../../services/cycle.service';
import { SymptomService, SymptomLog } from '../../../services/symptom.service';
import { ReminderService, MedicineReminder, WaterProgress } from '../../../services/reminder.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomePage implements OnInit, OnDestroy {
  private readonly cycleService = inject(CycleService);
  private readonly symptomService = inject(SymptomService);
  private readonly reminderService = inject(ReminderService);
  private readonly auth = inject(AuthService);

  private periodSub?: Subscription;
  private symptomSub?: Subscription;
  private reminderSub?: Subscription;
  private waterSub?: Subscription;

  // Real Cycle Metrics from Firestore
  readonly isLoadingCycle = signal<boolean>(true);
  readonly hasCycleData = signal<boolean>(false);
  readonly hasCompletedCycles = signal<boolean>(false);
  readonly cycleDay = signal<number>(0);
  readonly cycleLength = signal<number>(28);
  readonly cyclePhase = signal<string>('No Period Logged');
  readonly phaseProgress = signal<number>(0);
  readonly nextPeriodDate = signal<string | null>(null);
  readonly ovulationDate = signal<string | null>(null);
  readonly fertileWindowStart = signal<string | null>(null);
  readonly fertileWindowEnd = signal<string | null>(null);
  readonly latestPeriodStartDate = signal<string | null>(null);
  readonly regularityScore = signal<number>(0);
  readonly regularityStatus = signal<string>('BUILDING_HISTORY');
  readonly isLate = signal<boolean>(false);
  readonly isIrregular = signal<boolean>(false);
  readonly fertilityPhase = signal<string>('Log period to calculate');

  // Hydration State from Firestore
  readonly waterCompleted = signal<number>(0);
  readonly waterGoal = signal<number>(2500);

  // Medicine Reminders from Firestore
  readonly medicineReminders = signal<MedicineReminder[]>([]);

  // Today's Symptom State from Firestore
  readonly todaySymptomLog = signal<SymptomLog>({
    date: new Date().toISOString().split('T')[0],
    mood: 'CALM',
    pain: 0,
    cramps: false,
    headache: false,
    bloating: false,
    fatigue: false
  });

  // Computed Water Helpers
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

  ngOnInit(): void {
    this.initCycleData();
    this.initWaterDetails();
    this.initReminders();
    this.initSymptoms();
  }

  ngOnDestroy(): void {
    this.periodSub?.unsubscribe();
    this.symptomSub?.unsubscribe();
    this.reminderSub?.unsubscribe();
    this.waterSub?.unsubscribe();
  }

  // --- Real Cycle Data Sync ---
  private initCycleData(): void {
    this.periodSub = this.cycleService.getPeriodLogs().subscribe({
      next: (logs) => {
        this.isLoadingCycle.set(false);
        const userProfile = this.auth.currentUser();
        const preferredCycle = userProfile?.cycleLength || 28;
        const metrics = this.cycleService.calculateCycleMetrics(logs, preferredCycle);

        if (metrics.hasData) {
          this.hasCycleData.set(true);
          this.hasCompletedCycles.set(metrics.hasCompletedCycles);
          this.latestPeriodStartDate.set(metrics.latestPeriodStartDate || null);
          this.cycleDay.set(metrics.cycleDay);
          this.cycleLength.set(metrics.cycleLength);
          this.cyclePhase.set(metrics.cyclePhase);
          this.phaseProgress.set(metrics.phaseProgress);
          this.nextPeriodDate.set(metrics.nextPeriodDate);
          this.ovulationDate.set(metrics.ovulationDate);
          this.fertileWindowStart.set(metrics.fertileWindowStart);
          this.fertileWindowEnd.set(metrics.fertileWindowEnd);
          this.regularityScore.set(metrics.regularityScore || 0);
          this.regularityStatus.set(metrics.regularityStatus);
          this.isLate.set(metrics.isLate);
          this.isIrregular.set(metrics.isIrregular);
          this.fertilityPhase.set(
            metrics.cyclePhase === 'Ovulatory Phase' ? 'Fertile Window (High Chance)' : 'Lower Fertility (Lower Likelihood)'
          );
        } else {
          this.hasCycleData.set(false);
          this.hasCompletedCycles.set(false);
          this.latestPeriodStartDate.set(null);
          this.cycleDay.set(0);
          this.cycleLength.set(preferredCycle);
          this.cyclePhase.set('No Period Logged Yet');
          this.phaseProgress.set(0);
          this.nextPeriodDate.set(null);
          this.ovulationDate.set(null);
          this.fertileWindowStart.set(null);
          this.fertileWindowEnd.set(null);
          this.regularityScore.set(0);
          this.regularityStatus.set('BUILDING_HISTORY');
          this.isLate.set(false);
          this.isIrregular.set(false);
          this.fertilityPhase.set('Awaiting first period log');
        }
      },
      error: () => {
        this.isLoadingCycle.set(false);
      }
    });
  }

  // --- Real Water Data Sync ---
  private initWaterDetails(): void {
    this.waterSub = this.reminderService.getWaterToday().subscribe({
      next: (data) => {
        if (data) {
          this.waterCompleted.set(data.completed || 0);
          if (data.goal) this.waterGoal.set(data.goal);
        }
      }
    });
  }

  addWater(amount: number): void {
    this.reminderService.addWater(amount).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.waterCompleted.set(res.data.completed);
        }
      }
    });
  }

  // --- Real Reminders Sync ---
  private initReminders(): void {
    this.reminderSub = this.reminderService.getReminders().subscribe({
      next: (rems) => {
        this.medicineReminders.set(rems || []);
      }
    });
  }

  toggleReminder(reminder: MedicineReminder): void {
    if (!reminder.id) return;
    const targetStatus = !reminder.completed;
    this.reminderService.completeReminder(reminder.id, targetStatus).subscribe();
  }

  // --- Real Symptoms Sync ---
  private initSymptoms(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    this.symptomSub = this.symptomService.getSymptomHistory().subscribe({
      next: (history) => {
        const todayEntry = history.find(h => h.date === todayStr);
        if (todayEntry) {
          this.todaySymptomLog.set(todayEntry);
        }
      }
    });
  }

  toggleQuickSymptom(type: 'cramps' | 'headache' | 'bloating' | 'fatigue'): void {
    const current = { ...this.todaySymptomLog() };
    current[type] = !current[type];
    this.todaySymptomLog.set(current);

    if (current.id) {
      this.symptomService.updateSymptoms(current.id, current).subscribe();
    } else {
      this.symptomService.saveSymptoms(current).subscribe((res) => {
        if (res.success && res.id) {
          this.todaySymptomLog.update(s => ({ ...s, id: res.id }));
        }
      });
    }
  }

  changeMood(mood: string): void {
    const current = { ...this.todaySymptomLog(), mood };
    this.todaySymptomLog.set(current);

    if (current.id) {
      this.symptomService.updateSymptoms(current.id, current).subscribe();
    } else {
      this.symptomService.saveSymptoms(current).subscribe((res) => {
        if (res.success && res.id) {
          this.todaySymptomLog.update(s => ({ ...s, id: res.id }));
        }
      });
    }
  }
}
