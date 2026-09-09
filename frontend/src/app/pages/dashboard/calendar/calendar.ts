import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CycleService, PeriodLog, DateCycleInfo, CycleDayStatus, FertilityLevel } from '../../../services/cycle.service';
import { PartnerService } from '../../../services/partner.service';
import { Subscription } from 'rxjs';

export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  status: CycleDayStatus;
  cycleDayNum: number | null;
  phase: string;
  fertilityLevel: FertilityLevel;
  titleTooltip: string;
  ariaLabel: string;
  logId?: string;
  isPeriod: boolean;
  isPredicted: boolean;
  isOvulation: boolean;
  isFertile: boolean;
  isLowerFertility: boolean;
}

export interface PeriodLogWithHistory extends PeriodLog {
  isCurrentCycle: boolean;
  actualCycleDays: number | null;
  cycleLengthDisplay: string;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss'
})
export class CalendarPage implements OnInit, OnDestroy {
  private readonly cycleService = inject(CycleService);
  private readonly partnerService = inject(PartnerService);
  private periodSub?: Subscription;

  readonly currentYear = signal(new Date().getFullYear());
  readonly currentMonth = signal(new Date().getMonth()); // 0-indexed
  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar cells & period logs from Firestore
  readonly calendarDays = signal<CalendarDay[]>([]);
  readonly periodLogs = signal<PeriodLog[]>([]);
  readonly isLoading = signal(true);

  // Selected date state for interactive inspection
  readonly selectedDate = signal<string>(this.formatDateString(new Date()));
  readonly selectedDateInfo = signal<DateCycleInfo | null>(null);

  // Predictions calculated from real Firestore logs
  readonly ovulationDates = signal<string[]>([]);
  readonly fertileDates = signal<string[]>([]);
  readonly lowerFertilityDates = signal<string[]>([]);
  readonly nextPeriodDate = signal<string | null>(null);

  // Cycle Statistics
  readonly avgCycleLength = signal<number>(28);
  readonly avgPeriodLength = signal<number>(5);
  readonly hasCompletedCycles = signal<boolean>(false);
  readonly regularityStatusText = signal<string>('Building history');

  // History list with actual cycle lengths derived from consecutive logs
  readonly periodLogsWithHistory = computed<PeriodLogWithHistory[]>(() => {
    const logs = this.periodLogs();
    if (!logs || logs.length === 0) return [];

    const sortedAsc = [...logs]
      .filter((l) => !!l.periodStartDate)
      .sort(
        (a, b) =>
          this.parseLocalDate(a.periodStartDate).getTime() -
          this.parseLocalDate(b.periodStartDate).getTime()
      );

    const resultAsc: PeriodLogWithHistory[] = sortedAsc.map((log, idx) => {
      const isLatest = idx === sortedAsc.length - 1;
      if (isLatest) {
        return {
          ...log,
          isCurrentCycle: true,
          actualCycleDays: null,
          cycleLengthDisplay: 'Current cycle'
        };
      }

      const nextLog = sortedAsc[idx + 1];
      const dCurrent = this.parseLocalDate(log.periodStartDate).getTime();
      const dNext = this.parseLocalDate(nextLog.periodStartDate).getTime();
      const diffDays = Math.round((dNext - dCurrent) / (1000 * 60 * 60 * 24));

      if (diffDays >= 15 && diffDays <= 60) {
        return {
          ...log,
          isCurrentCycle: false,
          actualCycleDays: diffDays,
          cycleLengthDisplay: `Cycle length: ${diffDays} days`
        };
      }

      return {
        ...log,
        isCurrentCycle: false,
        actualCycleDays: null,
        cycleLengthDisplay: 'Cycle length: Not available yet'
      };
    });

    return resultAsc.reverse();
  });

  // Today Date String
  readonly todayDateStr = this.formatDateString(new Date());

  // Modal State
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
    today.setHours(0, 0, 0, 0);
    const target = this.parseLocalDate(nextStr);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  });

  parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
    }
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  ngOnInit(): void {
    this.periodSub = this.cycleService.getPeriodLogs().subscribe({
      next: (logs) => {
        this.isLoading.set(false);
        this.periodLogs.set(logs || []);
        this.calculateCyclePredictions();
        this.generateCalendar();
        this.updateSelectedDateInfo();
      },
      error: () => {
        this.isLoading.set(false);
        this.generateCalendar();
        this.updateSelectedDateInfo();
      }
    });
  }

  ngOnDestroy(): void {
    this.periodSub?.unsubscribe();
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3500);
  }

  updateSelectedDateInfo(): void {
    const selStr = this.selectedDate() || this.todayDateStr;
    const info = this.cycleService.getDateCycleStatus(
      selStr,
      this.periodLogs(),
      this.avgCycleLength()
    );
    this.selectedDateInfo.set(info);
  }

  calculateCyclePredictions(): void {
    const logs = this.periodLogs();
    if (logs.length === 0) {
      this.nextPeriodDate.set(null);
      this.ovulationDates.set([]);
      this.fertileDates.set([]);
      this.lowerFertilityDates.set([]);
      this.hasCompletedCycles.set(false);
      this.regularityStatusText.set('Building history');
      return;
    }

    const metrics = this.cycleService.calculateCycleMetrics(logs);
    if (!metrics.hasData) return;

    this.avgCycleLength.set(metrics.cycleLength);
    this.avgPeriodLength.set(metrics.periodLength);
    this.nextPeriodDate.set(metrics.nextPeriodDate);
    this.hasCompletedCycles.set(metrics.hasCompletedCycles);

    if (metrics.hasCompletedCycles) {
      if (metrics.regularityStatus === 'REGULAR') {
        this.regularityStatusText.set('Regular Rhythm');
      } else if (metrics.regularityStatus === 'SLIGHT_VARIATION') {
        this.regularityStatusText.set('Slight Variation');
      } else if (metrics.regularityStatus === 'IRREGULAR') {
        this.regularityStatusText.set('Variable Rhythm');
      } else {
        this.regularityStatusText.set('Building history');
      }
    } else {
      this.regularityStatusText.set('Building history');
    }

    if (metrics.ovulationDate) {
      this.ovulationDates.set([metrics.ovulationDate]);
    }

    // Compute fertile window days
    if (metrics.ovulationDate) {
      const fertile: string[] = [];
      const ovDate = this.parseLocalDate(metrics.ovulationDate);
      for (let i = -5; i <= 1; i++) {
        const d = new Date(ovDate);
        d.setDate(d.getDate() + i);
        fertile.push(this.formatDateString(d));
      }
      this.fertileDates.set(fertile);
    }
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

    // Next month filler days to complete 42 cells
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
    const dayInfo = this.cycleService.getDateCycleStatus(
      date,
      this.periodLogs(),
      this.avgCycleLength()
    );

    const monthName = this.monthNames[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();

    let ariaStatusText = dayInfo.title;
    if (dayInfo.status === 'LOGGED_PERIOD') {
      ariaStatusText = `logged period, cycle day ${dayInfo.cycleDay || 1}`;
    } else if (dayInfo.status === 'PREDICTED_PERIOD') {
      ariaStatusText = 'predicted period';
    } else if (dayInfo.status === 'OVULATION') {
      ariaStatusText = `estimated ovulation${dayInfo.cycleDay ? ', cycle day ' + dayInfo.cycleDay : ''}`;
    } else if (dayInfo.status === 'FERTILE') {
      ariaStatusText = 'fertile window';
    } else if (dayInfo.status === 'LOWER_FERTILITY') {
      ariaStatusText = 'lower fertility';
    }

    const ariaLabel = `${monthName} ${dayNum}, ${year}, ${ariaStatusText}`;
    const titleTooltip = `${monthName} ${dayNum}: ${dayInfo.title} (${dayInfo.phase})`;

    return {
      date,
      dateStr,
      dayNum,
      isCurrentMonth,
      status: dayInfo.status,
      cycleDayNum: dayInfo.cycleDay,
      phase: dayInfo.phase,
      fertilityLevel: dayInfo.fertilityLevel,
      titleTooltip,
      ariaLabel,
      logId: dayInfo.logId,
      isPeriod: dayInfo.status === 'LOGGED_PERIOD',
      isPredicted: dayInfo.status === 'PREDICTED_PERIOD',
      isOvulation: dayInfo.status === 'OVULATION',
      isFertile: dayInfo.status === 'FERTILE',
      isLowerFertility: dayInfo.status === 'LOWER_FERTILITY'
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
    this.selectedDate.set(day.dateStr);
    const info = this.cycleService.getDateCycleStatus(
      day.dateStr,
      this.periodLogs(),
      this.avgCycleLength()
    );
    this.selectedDateInfo.set(info);
  }

  openAddLogModal(): void {
    this.openLogModalForDate(this.selectedDate() || this.formatDateString(new Date()));
  }

  openLogModalForDate(dateStr?: string): void {
    this.selectedLog.set(null);
    this.startDate.set(dateStr || this.selectedDate() || this.formatDateString(new Date()));
    this.endDate.set('');
    this.flow.set('MEDIUM');
    this.cycleLength.set(this.avgCycleLength() || 28);
    this.periodLength.set(this.avgPeriodLength() || 5);
    this.notes.set('');
    this.errorMessage.set(null);
    this.isLogModalOpen.set(true);
  }

  openEditLogModalById(logId: string): void {
    const existingLog = this.periodLogs().find(l => l.id === logId);
    if (existingLog) {
      this.openEditLogModal(existingLog);
    }
  }

  getFertilityLabel(level?: FertilityLevel): string {
    switch (level) {
      case 'HIGH':
        return 'Highest estimated fertility';
      case 'ELEVATED':
        return 'Higher fertility likelihood';
      case 'LOWER':
        return 'Lower estimated fertility likelihood';
      default:
        return 'Not enough cycle data';
    }
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

  saveLog(): void {
    const startVal = this.startDate()?.trim();
    if (!startVal) {
      this.errorMessage.set('Start date is required.');
      return;
    }

    const periodLen = Number(this.periodLength()) || 5;
    const cycleLen = Number(this.cycleLength()) || this.avgCycleLength() || 28;

    let endStr = this.endDate()?.trim();
    if (!endStr) {
      const parts = startVal.split('-').map(Number);
      if (parts.length === 3) {
        const calcEnd = new Date(parts[0], parts[1] - 1, parts[2]);
        calcEnd.setDate(calcEnd.getDate() + periodLen - 1);
        endStr = this.formatDateString(calcEnd);
      }
    }

    const payload: PeriodLog = {
      periodStartDate: startVal,
      periodEndDate: endStr || undefined,
      flow: this.flow(),
      cycleLength: cycleLen,
      periodLength: periodLen,
      notes: this.notes()?.trim() || undefined
    };

    const selected = this.selectedLog();
    const isNew = !selected?.id;

    // Validate using CycleService validation rules
    const validation = this.cycleService.validatePeriodLog(
      payload,
      this.periodLogs(),
      selected?.id
    );

    if (!validation.valid) {
      this.errorMessage.set(validation.error || 'Please correct the period log information.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const action$ = isNew
      ? this.cycleService.logPeriod(payload)
      : this.cycleService.updatePeriod(selected.id!, payload);

    action$.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          // Immediately sync shared partner data
          this.partnerService.syncSharedData().catch((err) => console.warn('Partner sync error:', err));

          if (isNew) {
            this.showToast(
              'Your actual period has been recorded. Future predictions will be updated using your cycle history.'
            );
          } else {
            this.showToast('Period log updated in Firestore!');
          }
          this.closeLogModal();
          this.updateSelectedDateInfo();
        } else {
          this.errorMessage.set(res.message || 'Failed to save period log.');
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.message || 'An error occurred while saving.');
      }
    });
  }

  deleteLog(id?: string): void {
    if (!id || !confirm('Are you sure you want to delete this period log?')) return;

    this.cycleService.deletePeriod(id).subscribe({
      next: (res) => {
        if (res.success) {
          // Immediately sync shared partner data
          this.partnerService.syncSharedData().catch((err) => console.warn('Partner sync error:', err));

          this.showToast('Period log deleted from Firestore.');
          this.updateSelectedDateInfo();
        } else {
          alert(res.message || 'Failed to delete period log.');
        }
      }
    });
  }
}
