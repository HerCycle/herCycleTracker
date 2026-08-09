import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CycleService, PeriodLog } from '../../../services/cycle.service';

export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isPeriod: boolean;
  isPredicted: boolean;
  isOvulation: boolean;
  isFertile: boolean;
  isSafe: boolean;
  logId?: number;
}

const DEFAULT_PERIOD_LOGS: PeriodLog[] = [
  {
    id: 1,
    periodStartDate: '2026-08-01',
    periodEndDate: '2026-08-05',
    flow: 'HEAVY',
    notes: 'Normal flow with light cramps on day 1 & 2.'
  },
  {
    id: 2,
    periodStartDate: '2026-07-04',
    periodEndDate: '2026-07-08',
    flow: 'MEDIUM',
    notes: 'Regular 28-day cycle rhythm.'
  }
];

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss'
})
export class CalendarPage implements OnInit {
  private readonly cycleService = inject(CycleService);

  readonly currentYear = signal(new Date().getFullYear());
  readonly currentMonth = signal(new Date().getMonth()); // 0-indexed
  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar cells & period logs
  readonly calendarDays = signal<CalendarDay[]>([]);
  readonly periodLogs = signal<PeriodLog[]>([]);

  // Computed Predictions
  readonly ovulationDates = signal<string[]>([]);
  readonly fertileDates = signal<string[]>([]);
  readonly safeDates = signal<string[]>([]);
  readonly nextPeriodDate = signal<string | null>(null);

  // Cycle Statistics
  readonly avgCycleLength = signal<number>(28);
  readonly avgPeriodLength = signal<number>(5);

  // Logging period form state
  readonly isLogModalOpen = signal(false);
  readonly selectedLog = signal<PeriodLog | null>(null);
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly flow = signal('MEDIUM');
  readonly cycleLength = signal<number>(28);
  readonly periodLength = signal<number>(5);
  readonly notes = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);
  readonly isSaving = signal(false);

  readonly daysUntilNextPeriod = computed(() => {
    const nextStr = this.nextPeriodDate();
    if (!nextStr) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(nextStr);
    target.setHours(0,0,0,0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3500);
  }

  loadAllData(): void {
    const savedLogs = localStorage.getItem('hc_period_logs');
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.periodLogs.set(parsed);
        } else {
          this.periodLogs.set(DEFAULT_PERIOD_LOGS);
          this.saveLocalLogs(DEFAULT_PERIOD_LOGS);
        }
      } catch (e) {
        this.periodLogs.set(DEFAULT_PERIOD_LOGS);
      }
    } else {
      this.periodLogs.set(DEFAULT_PERIOD_LOGS);
      this.saveLocalLogs(DEFAULT_PERIOD_LOGS);
    }

    this.calculateCyclePredictions();
    this.generateCalendar();

    // Try backend sync
    this.cycleService.getHistory().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.periodLogs.set(res.data);
          this.saveLocalLogs(res.data);
          this.calculateCyclePredictions();
          this.generateCalendar();
        }
      }
    });
  }

  saveLocalLogs(logs: PeriodLog[]): void {
    localStorage.setItem('hc_period_logs', JSON.stringify(logs));
  }

  calculateCyclePredictions(): void {
    const logs = [...this.periodLogs()].sort((a, b) => 
      new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
    );

    if (logs.length === 0) return;

    // Calculate average cycle length if multiple logs
    if (logs.length >= 2) {
      let totalDiff = 0;
      for (let i = 0; i < logs.length - 1; i++) {
        const d1 = new Date(logs[i].periodStartDate).getTime();
        const d2 = new Date(logs[i+1].periodStartDate).getTime();
        totalDiff += Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
      }
      const avg = Math.round(totalDiff / (logs.length - 1));
      if (avg >= 21 && avg <= 45) {
        this.avgCycleLength.set(avg);
      }
    }

    const latest = logs[0];
    const latestStart = new Date(latest.periodStartDate);
    const cycleLen = this.avgCycleLength();

    // Next period prediction
    const nextStart = new Date(latestStart);
    nextStart.setDate(nextStart.getDate() + cycleLen);
    const nextStartStr = this.formatDateString(nextStart);
    this.nextPeriodDate.set(nextStartStr);

    // Predicted period days (e.g. 5 days)
    const predictedDays: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(nextStart);
      d.setDate(d.getDate() + i);
      predictedDays.push(this.formatDateString(d));
    }

    // Ovulation Day (14 days before next period)
    const ovulation = new Date(nextStart);
    ovulation.setDate(ovulation.getDate() - 14);
    const ovulationStr = this.formatDateString(ovulation);
    this.ovulationDates.set([ovulationStr]);

    // Fertile Window (5 days before ovulation + 1 day after)
    const fertile: string[] = [];
    for (let i = -5; i <= 1; i++) {
      const fd = new Date(ovulation);
      fd.setDate(fd.getDate() + i);
      fertile.push(this.formatDateString(fd));
    }
    this.fertileDates.set(fertile);

    // Safe Days (non-period, non-fertile days)
    const safe: string[] = [];
    for (let i = 0; i < 60; i++) {
      const sd = new Date(latestStart);
      sd.setDate(sd.getDate() + i);
      const sdStr = this.formatDateString(sd);
      if (!fertile.includes(sdStr) && !predictedDays.includes(sdStr)) {
        safe.push(sdStr);
      }
    }
    this.safeDates.set(safe);
  }

  generateCalendar(): void {
    const year = this.currentYear();
    const month = this.currentMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonthLastDate - i);
      days.push(this.createCalendarDay(dayDate, false));
    }

    // Current month days
    for (let i = 1; i <= lastDate; i++) {
      const dayDate = new Date(year, month, i);
      days.push(this.createCalendarDay(dayDate, true));
    }

    // Next month filler days to complete 42 cells (6 rows of 7)
    const totalCells = 42;
    const nextDaysCount = totalCells - days.length;
    for (let i = 1; i <= nextDaysCount; i++) {
      const dayDate = new Date(year, month + 1, i);
      days.push(this.createCalendarDay(dayDate, false));
    }

    this.calendarDays.set(days);
  }

  createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const dateStr = this.formatDateString(date);
    
    let isPeriod = false;
    let logId: number | undefined;

    for (const log of this.periodLogs()) {
      if (log.periodStartDate) {
        const start = new Date(log.periodStartDate);
        const end = log.periodEndDate ? new Date(log.periodEndDate) : new Date(log.periodStartDate);
        
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);
        const checkDate = new Date(date);
        checkDate.setHours(0,0,0,0);

        if (checkDate >= start && checkDate <= end) {
          isPeriod = true;
          logId = log.id;
          break;
        }
      }
    }

    const isOvulation = this.ovulationDates().includes(dateStr);
    const isFertile = this.fertileDates().includes(dateStr);
    const isSafe = this.safeDates().includes(dateStr);
    const isPredicted = this.nextPeriodDate() === dateStr;

    return {
      date,
      dateStr,
      dayNum: date.getDate(),
      isCurrentMonth,
      isPeriod,
      isPredicted,
      isOvulation,
      isFertile,
      isSafe,
      logId
    };
  }

  formatDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.generateCalendar();
  }

  onDayCellClick(day: CalendarDay): void {
    const existingLog = this.periodLogs().find(l => l.id === day.logId);
    if (existingLog) {
      this.openEditLogModal(existingLog);
    } else {
      this.selectedLog.set(null);
      this.startDate.set(day.dateStr);
      this.endDate.set('');
      this.flow.set('MEDIUM');
      this.notes.set('');
      this.errorMessage.set(null);
      this.isLogModalOpen.set(true);
    }
  }

  // --- Modal Operations ---
  openAddLogModal(): void {
    this.selectedLog.set(null);
    this.startDate.set(this.formatDateString(new Date()));
    this.endDate.set('');
    this.flow.set('MEDIUM');
    this.cycleLength.set(this.avgCycleLength() || 28);
    this.periodLength.set(this.avgPeriodLength() || 5);
    this.notes.set('');
    this.errorMessage.set(null);
    this.isLogModalOpen.set(true);
  }

  openEditLogModal(log: PeriodLog): void {
    this.selectedLog.set(log);
    this.startDate.set(log.periodStartDate);
    this.endDate.set(log.periodEndDate || '');
    this.flow.set(log.flow || 'MEDIUM');
    this.cycleLength.set(log.cycleLength || this.avgCycleLength() || 28);
    this.periodLength.set(log.periodLength || this.avgPeriodLength() || 5);
    this.notes.set(log.notes || '');
    this.errorMessage.set(null);
    this.isLogModalOpen.set(true);
  }

  closeLogModal(): void {
    this.isLogModalOpen.set(false);
  }

  setPresetCycleLength(days: number): void {
    this.cycleLength.set(days);
  }

  saveLog(): void {
    if (!this.startDate()) {
      this.errorMessage.set('Start date is required');
      return;
    }

    const cycleLen = this.cycleLength() || 28;
    const periodLen = this.periodLength() || 5;

    // Calculate auto end date if end date is not explicitly selected
    let endStr = this.endDate();
    if (!endStr && this.startDate()) {
      const startD = new Date(this.startDate());
      startD.setDate(startD.getDate() + periodLen - 1);
      endStr = this.formatDateString(startD);
    }

    const payload: PeriodLog = {
      id: this.selectedLog()?.id || Date.now(),
      periodStartDate: this.startDate(),
      periodEndDate: endStr || undefined,
      flow: this.flow(),
      cycleLength: cycleLen,
      periodLength: periodLen,
      notes: this.notes() || undefined
    };

    const currentLogs = this.periodLogs();
    let updatedLogs: PeriodLog[];

    if (this.selectedLog()) {
      updatedLogs = currentLogs.map(l => l.id === payload.id ? payload : l);
      this.showToast(`Updated period log (${cycleLen}-day cycle)`);
    } else {
      updatedLogs = [payload, ...currentLogs];
      this.showToast(`Logged period (${cycleLen}-day cycle)`);
    }

    this.avgCycleLength.set(cycleLen);
    this.avgPeriodLength.set(periodLen);
    this.periodLogs.set(updatedLogs);
    this.saveLocalLogs(updatedLogs);
    this.calculateCyclePredictions();
    this.generateCalendar();
    this.closeLogModal();

    // Backend sync
    const log = this.selectedLog();
    const req = log?.id 
      ? this.cycleService.updatePeriod(log.id, payload)
      : this.cycleService.logPeriod(payload);

    req.subscribe();
  }

  deleteLog(id?: number): void {
    if (!id || !confirm('Are you sure you want to delete this period log?')) return;
    
    const updated = this.periodLogs().filter(l => l.id !== id);
    this.periodLogs.set(updated);
    this.saveLocalLogs(updated);
    this.calculateCyclePredictions();
    this.generateCalendar();
    this.showToast('Period log deleted.');

    this.cycleService.deletePeriod(id).subscribe();
  }
}

