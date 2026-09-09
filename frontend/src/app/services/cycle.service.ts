import { Injectable, inject } from '@angular/core';
import { Auth, user, User } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Observable, from, of, merge } from 'rxjs';
import { map, switchMap, catchError, filter, startWith, distinctUntilChanged } from 'rxjs/operators';

export interface PeriodLog {
  id?: string;
  periodStartDate: string;
  periodEndDate?: string;
  flow?: string;
  notes?: string;
  cycleLength?: number;
  periodLength?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CycleDayStatus =
  | 'LOGGED_PERIOD'
  | 'PREDICTED_PERIOD'
  | 'OVULATION'
  | 'FERTILE'
  | 'LOWER_FERTILITY'
  | 'OUTSIDE_TRACKED_RANGE';

export type FertilityLevel = 'HIGH' | 'ELEVATED' | 'LOWER' | 'UNKNOWN';

export interface DateCycleInfo {
  dateStr: string;
  cycleDay: number | null;
  phase: string;
  status: CycleDayStatus;
  fertilityLevel: FertilityLevel;
  title: string;
  description: string;
  isPeriodDay?: boolean;
  periodDayNum?: number;
  logId?: string;
}

export interface CompletedCycle {
  logId?: string;
  startDate: string;
  nextStartDate: string;
  cycleLength: number;
}

export type RegularityStatus = 'BUILDING_HISTORY' | 'REGULAR' | 'SLIGHT_VARIATION' | 'IRREGULAR';

export interface CycleMetrics {
  hasData: boolean;
  hasCompletedCycles: boolean;
  completedCyclesCount: number;
  latestPeriodStartDate?: string;
  cycleLength: number;
  periodLength: number;
  cycleDay: number;
  cyclePhase: string;
  phaseProgress: number;
  nextPeriodDate: string | null;
  ovulationDate: string | null;
  fertileWindowStart: string | null;
  fertileWindowEnd: string | null;
  regularityScore: number | null;
  regularityStatus: RegularityStatus;
  isLate: boolean;
  isIrregular: boolean;
  actualCycleLengths: number[];
}

@Injectable({
  providedIn: 'root'
})
export class CycleService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  // Direct one-shot snapshot fetch from Firestore
  async getPeriodLogsSnapshot(uid?: string): Promise<PeriodLog[]> {
    try {
      const targetUid = uid || this.auth.currentUser?.uid;
      if (!targetUid) return [];
      const periodColRef = collection(this.firestore, `users/${targetUid}/period_logs`);
      const q = query(periodColRef, orderBy('periodStartDate', 'desc'));
      const snap = await getDocs(q);
      const logs: PeriodLog[] = [];
      snap.forEach((docSnap) => {
        logs.push({
          id: docSnap.id,
          ...docSnap.data()
        } as PeriodLog);
      });
      return logs;
    } catch (e) {
      console.error('getPeriodLogsSnapshot error:', e);
      return [];
    }
  }

  // Real-time listener combined with initial snapshot for zero-latency propagation
  private listenToPeriodLogs(uid: string): Observable<PeriodLog[]> {
    const periodColRef = collection(this.firestore, `users/${uid}/period_logs`);
    const q = query(periodColRef, orderBy('periodStartDate', 'desc'));

    return merge(
      from(this.getPeriodLogsSnapshot(uid)),
      collectionData(q, { idField: 'id' }) as Observable<PeriodLog[]>
    ).pipe(
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      catchError((err) => {
        console.error(`Error streaming period logs for ${uid}:`, err);
        return from(this.getPeriodLogsSnapshot(uid));
      })
    );
  }

  // Observable of all period logs for the current authenticated user from Firestore
  getPeriodLogs(): Observable<PeriodLog[]> {
    return from(this.auth.authStateReady()).pipe(
      switchMap(() => user(this.auth)),
      startWith(this.auth.currentUser),
      filter((firebaseUser): firebaseUser is User => !!firebaseUser && !!firebaseUser.uid),
      distinctUntilChanged((prev, curr) => prev?.uid === curr?.uid),
      switchMap((firebaseUser) => this.listenToPeriodLogs(firebaseUser.uid)),
      catchError((err) => {
        console.error('Error in getPeriodLogs stream:', err);
        return of([]);
      })
    );
  }

  // --- Add a new period log to Firestore ---
  logPeriod(log: PeriodLog): Observable<{ success: boolean; id?: string; message?: string }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) {
      return of({ success: false, message: 'User not authenticated' });
    }

    const payload = {
      periodStartDate: log.periodStartDate,
      periodEndDate: log.periodEndDate || null,
      flow: log.flow || 'MEDIUM',
      notes: log.notes?.trim() || null,
      cycleLength: Number(log.cycleLength) || 28,
      periodLength: Number(log.periodLength) || 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const periodColRef = collection(this.firestore, `users/${firebaseUser.uid}/period_logs`);
    return from(addDoc(periodColRef, payload)).pipe(
      map((docRef) => ({ success: true, id: docRef.id })),
      catchError((err) => of({ success: false, message: err.message || 'Failed to save period log' }))
    );
  }

  // --- Update an existing period log in Firestore ---
  updatePeriod(id: string, log: PeriodLog): Observable<{ success: boolean; message?: string }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) {
      return of({ success: false, message: 'User not authenticated' });
    }

    const docRef = doc(this.firestore, `users/${firebaseUser.uid}/period_logs/${id}`);
    const payload = {
      periodStartDate: log.periodStartDate,
      periodEndDate: log.periodEndDate || null,
      flow: log.flow || 'MEDIUM',
      notes: log.notes?.trim() || null,
      cycleLength: Number(log.cycleLength) || 28,
      periodLength: Number(log.periodLength) || 5,
      updatedAt: new Date().toISOString()
    };

    return from(updateDoc(docRef, payload)).pipe(
      map(() => ({ success: true })),
      catchError((err) => of({ success: false, message: err.message || 'Failed to update period log' }))
    );
  }

  // --- Delete a period log from Firestore ---
  deletePeriod(id: string): Observable<{ success: boolean; message?: string }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) {
      return of({ success: false, message: 'User not authenticated' });
    }

    const docRef = doc(this.firestore, `users/${firebaseUser.uid}/period_logs/${id}`);
    return from(deleteDoc(docRef)).pipe(
      map(() => ({ success: true })),
      catchError((err) => of({ success: false, message: err.message || 'Failed to delete period log' }))
    );
  }

  // Helper to safely parse YYYY-MM-DD to a local midnight Date
  parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
    }
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Helper to format a local Date to YYYY-MM-DD
  formatLocalDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // --- Core Calculation Logic based on Actual Firestore Data ---

  /**
   * Identifies the most recent period log by periodStartDate.
   */
  getLatestPeriod(logs: PeriodLog[] = []): PeriodLog | null {
    if (!logs || logs.length === 0) return null;
    const sorted = [...logs]
      .filter((l) => !!l.periodStartDate)
      .sort(
        (a, b) =>
          this.parseLocalDate(b.periodStartDate).getTime() -
          this.parseLocalDate(a.periodStartDate).getTime()
      );
    return sorted[0] || null;
  }

  /**
   * Calculates actual cycle lengths in days between consecutive chronological period start dates.
   * Cycle i = (start of period i+1) - (start of period i).
   */
  calculateActualCycleLengths(logs: PeriodLog[] = []): CompletedCycle[] {
    if (!logs || logs.length < 2) return [];

    const sortedAsc = [...logs]
      .filter((l) => !!l.periodStartDate)
      .sort(
        (a, b) =>
          this.parseLocalDate(a.periodStartDate).getTime() -
          this.parseLocalDate(b.periodStartDate).getTime()
      );

    const completed: CompletedCycle[] = [];
    for (let i = 0; i < sortedAsc.length - 1; i++) {
      const current = sortedAsc[i];
      const next = sortedAsc[i + 1];
      const dCurrent = this.parseLocalDate(current.periodStartDate).getTime();
      const dNext = this.parseLocalDate(next.periodStartDate).getTime();
      const diffDays = Math.round((dNext - dCurrent) / (1000 * 60 * 60 * 24));

      if (diffDays >= 15 && diffDays <= 60) {
        completed.push({
          logId: current.id,
          startDate: current.periodStartDate,
          nextStartDate: next.periodStartDate,
          cycleLength: diffDays
        });
      }
    }

    return completed;
  }

  /**
   * Calculates average cycle length from recent completed cycles (up to last 6 cycles).
   * If insufficient history, falls back to preferred cycle length or 28 days.
   */
  calculateAverageCycleLength(
    logs: PeriodLog[] = [],
    preferredCycleLength?: number
  ): { average: number; hasHistory: boolean; count: number } {
    const completed = this.calculateActualCycleLengths(logs);
    if (completed.length === 0) {
      const fallback =
        preferredCycleLength && preferredCycleLength >= 15 && preferredCycleLength <= 60
          ? preferredCycleLength
          : 28;
      return { average: fallback, hasHistory: false, count: 0 };
    }

    const recent = completed.slice(-6);
    const sum = recent.reduce((acc, c) => acc + c.cycleLength, 0);
    const avg = Math.round(sum / recent.length);
    return { average: avg, hasHistory: true, count: completed.length };
  }

  /**
   * Determines the cycle length to use for future predictions.
   * - If completed cycles exist: uses the average of actual completed cycles.
   * - If only 1 log exists: uses preferred cycle length (or log's cycleLength, default 28).
   */
  getPredictionCycleLength(logs: PeriodLog[] = [], preferredCycleLength?: number): number {
    const avgResult = this.calculateAverageCycleLength(logs, preferredCycleLength);
    if (avgResult.hasHistory) {
      return avgResult.average;
    }

    const latest = this.getLatestPeriod(logs);
    if (latest?.cycleLength && latest.cycleLength >= 15 && latest.cycleLength <= 60) {
      return latest.cycleLength;
    }
    if (preferredCycleLength && preferredCycleLength >= 15 && preferredCycleLength <= 60) {
      return preferredCycleLength;
    }
    return 28;
  }

  /**
   * Calculates the predicted next period date anchored at the latest period start.
   */
  calculatePredictedNextPeriod(
    latestStartDate: string,
    cycleLength: number,
    fromDate?: Date
  ): string {
    const start = this.parseLocalDate(latestStartDate);
    const reference = fromDate ? new Date(fromDate) : new Date();
    reference.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((reference.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const multiplier = Math.max(1, Math.ceil((diffDays + 1) / cycleLength));

    const nextDate = new Date(start);
    nextDate.setDate(nextDate.getDate() + multiplier * cycleLength);
    return this.formatLocalDate(nextDate);
  }

  /**
   * Estimates ovulation date (14 days before predicted next period date).
   */
  calculateOvulationDate(nextPeriodDate: string): string {
    const nextD = this.parseLocalDate(nextPeriodDate);
    nextD.setDate(nextD.getDate() - 14);
    return this.formatLocalDate(nextD);
  }

  /**
   * Calculates the estimated fertile window (5 days before ovulation to 1 day after).
   */
  calculateFertileWindow(ovulationDate: string): { start: string; end: string } {
    const ovD = this.parseLocalDate(ovulationDate);
    const startD = new Date(ovD);
    startD.setDate(startD.getDate() - 5);
    const endD = new Date(ovD);
    endD.setDate(endD.getDate() + 1);
    return {
      start: this.formatLocalDate(startD),
      end: this.formatLocalDate(endD)
    };
  }

  /**
   * Validates a period log prior to saving in Firestore:
   * - Required start date format
   * - No future start date
   * - Valid duration range
   * - No duplicate start date with another log
   * - No overlapping dates with other logged periods
   */
  validatePeriodLog(
    newLog: PeriodLog,
    existingLogs: PeriodLog[] = [],
    currentLogId?: string
  ): { valid: boolean; error?: string } {
    const startVal = newLog.periodStartDate?.trim();
    if (!startVal) {
      return { valid: false, error: 'Period start date is required.' };
    }

    const parts = startVal.split('-').map(Number);
    if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      return { valid: false, error: 'Please enter a valid period start date (YYYY-MM-DD).' };
    }

    const startD = this.parseLocalDate(startVal);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (startD.getTime() > today.getTime()) {
      return { valid: false, error: 'Period start date cannot be in the future.' };
    }

    const periodLen = Number(newLog.periodLength) || 5;
    if (periodLen < 1 || periodLen > 15) {
      return { valid: false, error: 'Period duration must be between 1 and 15 days.' };
    }

    if (newLog.cycleLength != null) {
      const cycleLen = Number(newLog.cycleLength);
      if (cycleLen < 15 || cycleLen > 60) {
        return { valid: false, error: 'Cycle length must be between 15 and 60 days.' };
      }
    }

    let endD: Date;
    if (newLog.periodEndDate?.trim()) {
      endD = this.parseLocalDate(newLog.periodEndDate.trim());
      if (endD.getTime() < startD.getTime()) {
        return { valid: false, error: 'Period end date cannot be earlier than start date.' };
      }
    } else {
      endD = new Date(startD);
      endD.setDate(endD.getDate() + periodLen - 1);
    }

    for (const existing of existingLogs) {
      if (currentLogId && existing.id === currentLogId) continue;
      if (!existing.periodStartDate) continue;

      if (existing.periodStartDate === startVal) {
        return { valid: false, error: 'A period log already exists starting on this date.' };
      }

      const exStart = this.parseLocalDate(existing.periodStartDate);
      let exEnd: Date;
      if (existing.periodEndDate) {
        exEnd = this.parseLocalDate(existing.periodEndDate);
      } else {
        const exLen = existing.periodLength || 5;
        exEnd = new Date(exStart);
        exEnd.setDate(exEnd.getDate() + exLen - 1);
      }

      if (startD.getTime() <= exEnd.getTime() && endD.getTime() >= exStart.getTime()) {
        return {
          valid: false,
          error: `Period dates overlap with an existing period (${existing.periodStartDate}).`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Comprehensive cycle metrics calculation based on actual Firestore period logs.
   * Anchors active cycle to latest actual period start and calculates variable predictions.
   */
  calculateCycleMetrics(logs: PeriodLog[] = [], userPreferredCycleLength?: number): CycleMetrics {
    const fallbackLen =
      userPreferredCycleLength && userPreferredCycleLength >= 15 && userPreferredCycleLength <= 60
        ? userPreferredCycleLength
        : 28;

    if (!logs || logs.length === 0) {
      return {
        hasData: false,
        hasCompletedCycles: false,
        completedCyclesCount: 0,
        cycleLength: fallbackLen,
        periodLength: 5,
        cycleDay: 0,
        cyclePhase: 'No Period Logged',
        phaseProgress: 0,
        nextPeriodDate: null,
        ovulationDate: null,
        fertileWindowStart: null,
        fertileWindowEnd: null,
        regularityScore: null,
        regularityStatus: 'BUILDING_HISTORY',
        isLate: false,
        isIrregular: false,
        actualCycleLengths: []
      };
    }

    const latest = this.getLatestPeriod(logs);
    if (!latest) {
      return this.calculateCycleMetrics([], userPreferredCycleLength);
    }
    const latestStart = this.parseLocalDate(latest.periodStartDate);

    // Compute actual cycle lengths from consecutive history
    const completedCycles = this.calculateActualCycleLengths(logs);
    const actualCycleLengths = completedCycles.map((c) => c.cycleLength);
    const cycleLength = this.getPredictionCycleLength(logs, userPreferredCycleLength);

    // Determine Period Duration:
    let periodLength = latest.periodLength || 5;
    if (latest.periodEndDate) {
      const endD = this.parseLocalDate(latest.periodEndDate);
      const days = Math.round((endD.getTime() - latestStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (days >= 1 && days <= 15) {
        periodLength = days;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - latestStart.getTime();
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let cycleDay: number;
    let isLate = false;

    if (daysElapsed < 0) {
      cycleDay = 1;
    } else {
      cycleDay = (daysElapsed % cycleLength) + 1;
      if (daysElapsed >= cycleLength) {
        isLate = true;
      }
    }

    const phaseProgress = Math.min(100, Math.max(1, Math.round((cycleDay / cycleLength) * 100)));

    // Next predicted period date
    const nextPeriodDate = this.calculatePredictedNextPeriod(latest.periodStartDate, cycleLength, today);

    // Ovulation estimate (14 days before next period)
    const ovulationDate = this.calculateOvulationDate(nextPeriodDate);

    // Fertile window (5 days before ovulation to 1 day after)
    const fertile = this.calculateFertileWindow(ovulationDate);

    // Cycle Phase Determination
    let cyclePhase = 'Follicular Phase';
    if (cycleDay <= periodLength) {
      cyclePhase = 'Menstrual Phase';
    } else if (cycleDay <= Math.round(cycleLength * 0.4)) {
      cyclePhase = 'Follicular Phase';
    } else if (cycleDay <= Math.round(cycleLength * 0.58)) {
      cyclePhase = 'Ovulatory Phase';
    } else {
      cyclePhase = 'Luteal Phase';
    }

    // Regularity Score Calculation from actual completed cycles
    let regularityScore: number | null = null;
    let isIrregular = false;
    let regularityStatus: RegularityStatus = 'BUILDING_HISTORY';

    if (completedCycles.length >= 2) {
      const variance = Math.max(...actualCycleLengths) - Math.min(...actualCycleLengths);
      if (variance <= 2) {
        regularityScore = 95;
        regularityStatus = 'REGULAR';
      } else if (variance <= 5) {
        regularityScore = 85;
        regularityStatus = 'SLIGHT_VARIATION';
      } else if (variance <= 8) {
        regularityScore = 70;
        regularityStatus = 'SLIGHT_VARIATION';
      } else {
        regularityScore = 55;
        isIrregular = true;
        regularityStatus = 'IRREGULAR';
      }
    } else if (completedCycles.length === 1) {
      regularityScore = 90;
      regularityStatus = 'BUILDING_HISTORY';
    }

    return {
      hasData: true,
      hasCompletedCycles: completedCycles.length > 0,
      completedCyclesCount: completedCycles.length,
      latestPeriodStartDate: latest.periodStartDate,
      cycleLength,
      periodLength,
      cycleDay,
      cyclePhase,
      phaseProgress,
      nextPeriodDate,
      ovulationDate,
      fertileWindowStart: fertile.start,
      fertileWindowEnd: fertile.end,
      regularityScore,
      regularityStatus,
      isLate,
      isIrregular,
      actualCycleLengths
    };
  }

  // --- Reusable Selected-Date Cycle & Fertility Classification ---
  getDateCycleStatus(
    targetDate: Date | string,
    logs: PeriodLog[] = [],
    preferredCycleLength?: number
  ): DateCycleInfo {
    let targetDateStr: string;
    let targetDateObj: Date;

    if (typeof targetDate === 'string') {
      targetDateStr = targetDate;
      targetDateObj = this.parseLocalDate(targetDate);
    } else {
      targetDateStr = this.formatLocalDate(targetDate);
      targetDateObj = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    }

    if (!logs || logs.length === 0) {
      return {
        dateStr: targetDateStr,
        cycleDay: null,
        phase: 'No Data',
        status: 'OUTSIDE_TRACKED_RANGE',
        fertilityLevel: 'UNKNOWN',
        title: 'Not enough cycle data',
        description: 'No menstrual period has been recorded yet. Log your period to unlock cycle and fertility predictions.'
      };
    }

    // Sort descending by periodStartDate
    const sorted = [...logs]
      .filter((l) => !!l.periodStartDate)
      .sort((a, b) => this.parseLocalDate(b.periodStartDate).getTime() - this.parseLocalDate(a.periodStartDate).getTime());

    if (sorted.length === 0) {
      return {
        dateStr: targetDateStr,
        cycleDay: null,
        phase: 'No Data',
        status: 'OUTSIDE_TRACKED_RANGE',
        fertilityLevel: 'UNKNOWN',
        title: 'Not enough cycle data',
        description: 'No menstrual period has been recorded yet. Log your period to unlock cycle and fertility predictions.'
      };
    }

    const latest = sorted[0];
    const latestStart = this.parseLocalDate(latest.periodStartDate);
    const earliest = sorted[sorted.length - 1];
    const earliestStart = this.parseLocalDate(earliest.periodStartDate);

    // PRIORITY 1: Check if date falls in ANY logged menstrual period
    for (const log of sorted) {
      if (log.periodStartDate) {
        const start = this.parseLocalDate(log.periodStartDate);
        let end: Date;
        if (log.periodEndDate) {
          end = this.parseLocalDate(log.periodEndDate);
        } else {
          const pLen = log.periodLength || 5;
          end = new Date(start);
          end.setDate(end.getDate() + pLen - 1);
        }

        if (targetDateObj.getTime() >= start.getTime() && targetDateObj.getTime() <= end.getTime()) {
          const pDay = Math.round((targetDateObj.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return {
            dateStr: targetDateStr,
            cycleDay: pDay,
            phase: 'Menstrual Phase',
            status: 'LOGGED_PERIOD',
            fertilityLevel: 'LOWER',
            title: `Period Day ${pDay}`,
            description: 'This date is part of your logged menstrual period.',
            isPeriodDay: true,
            periodDayNum: pDay,
            logId: log.id
          };
        }
      }
    }

    // Check if target date is prior to earliest available cycle history
    if (targetDateObj.getTime() < earliestStart.getTime()) {
      return {
        dateStr: targetDateStr,
        cycleDay: null,
        phase: 'Outside History',
        status: 'OUTSIDE_TRACKED_RANGE',
        fertilityLevel: 'UNKNOWN',
        title: 'Not enough cycle data',
        description: 'This date is earlier than your recorded cycle history. Past predictions cannot be reliably determined.'
      };
    }

    // Baseline metrics and prediction cycle length
    const metrics = this.calculateCycleMetrics(logs, preferredCycleLength);
    const predictionCycleLength = metrics.cycleLength;
    const periodLength = metrics.periodLength;

    // Determine cycle anchor for target date
    const diffDaysFromLatest = Math.round(
      (targetDateObj.getTime() - latestStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    let cycleAnchorStart = latestStart;
    let cycleLength = predictionCycleLength;
    let cycleDay: number | null = null;
    let isFuturePrediction = false;

    if (diffDaysFromLatest >= 0) {
      // Date is on or after latest logged period
      if (diffDaysFromLatest < predictionCycleLength) {
        // Within current active cycle
        cycleAnchorStart = latestStart;
        cycleDay = diffDaysFromLatest + 1;
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (targetDateObj.getTime() <= today.getTime()) {
          // Late cycle (past due but before today)
          cycleAnchorStart = latestStart;
          cycleDay = diffDaysFromLatest + 1;
        } else {
          // Future predicted cycle
          isFuturePrediction = true;
          const cycleMultiplier = Math.floor(diffDaysFromLatest / predictionCycleLength);
          cycleAnchorStart = new Date(latestStart);
          cycleAnchorStart.setDate(cycleAnchorStart.getDate() + cycleMultiplier * predictionCycleLength);
          const daysIntoCycle = Math.round(
            (targetDateObj.getTime() - cycleAnchorStart.getTime()) / (1000 * 60 * 60 * 24)
          );
          cycleDay = daysIntoCycle + 1;
        }
      }
    } else {
      // Historical date between past logs: find the log that anchors this date
      const prevLogIdx = sorted.findIndex(
        (l) => this.parseLocalDate(l.periodStartDate).getTime() <= targetDateObj.getTime()
      );

      if (prevLogIdx !== -1) {
        const prevLog = sorted[prevLogIdx];
        cycleAnchorStart = this.parseLocalDate(prevLog.periodStartDate);
        const daysElapsed = Math.round(
          (targetDateObj.getTime() - cycleAnchorStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        cycleDay = daysElapsed + 1;

        // If a subsequent log exists, use the actual completed cycle length!
        if (prevLogIdx > 0) {
          const nextChronologicalLog = sorted[prevLogIdx - 1];
          const nextD = this.parseLocalDate(nextChronologicalLog.periodStartDate).getTime();
          const currD = cycleAnchorStart.getTime();
          const actualDiff = Math.round((nextD - currD) / (1000 * 60 * 60 * 24));
          if (actualDiff >= 15 && actualDiff <= 60) {
            cycleLength = actualDiff;
          }
        }
      }
    }

    // PRIORITY 2: Predicted Period (only for future predicted cycles!)
    if (isFuturePrediction) {
      const predEnd = new Date(cycleAnchorStart);
      predEnd.setDate(predEnd.getDate() + periodLength - 1);

      if (
        targetDateObj.getTime() >= cycleAnchorStart.getTime() &&
        targetDateObj.getTime() <= predEnd.getTime()
      ) {
        return {
          dateStr: targetDateStr,
          cycleDay,
          phase: 'Menstrual Phase (Predicted)',
          status: 'PREDICTED_PERIOD',
          fertilityLevel: 'LOWER',
          title: 'Predicted Period',
          description: 'Forecasted start of your upcoming menstrual cycle based on your cycle history.'
        };
      }
    }

    // Determine Ovulation & Fertile Window for this cycle
    const nextPeriodStart = new Date(cycleAnchorStart);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + cycleLength);

    const ovulationDate = new Date(nextPeriodStart);
    ovulationDate.setDate(ovulationDate.getDate() - 14);

    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(fertileStart.getDate() - 5);

    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(fertileEnd.getDate() + 1);

    // PRIORITY 3: Ovulation Day
    if (targetDateObj.getTime() === ovulationDate.getTime()) {
      return {
        dateStr: targetDateStr,
        cycleDay,
        phase: 'Ovulatory Phase',
        status: 'OVULATION',
        fertilityLevel: 'HIGH',
        title: 'Estimated Ovulation',
        description: 'Highest estimated fertility. Ovulation timing is an estimate based on your cycle information. Actual ovulation can vary.'
      };
    }

    // PRIORITY 4: Fertile Window
    if (
      targetDateObj.getTime() >= fertileStart.getTime() &&
      targetDateObj.getTime() <= fertileEnd.getTime()
    ) {
      return {
        dateStr: targetDateStr,
        cycleDay,
        phase: 'Fertile Window',
        status: 'FERTILE',
        fertilityLevel: 'ELEVATED',
        title: 'Fertile Window',
        description: 'Higher fertility likelihood. This date falls within your estimated fertile window.'
      };
    }

    // PRIORITY 5: Lower Fertility Days
    let phase = 'Follicular Phase';
    if (cycleDay && cycleDay <= periodLength) {
      phase = 'Menstrual Phase';
    } else if (cycleDay && cycleDay <= Math.round(cycleLength * 0.4)) {
      phase = 'Follicular Phase';
    } else if (cycleDay && cycleDay <= Math.round(cycleLength * 0.58)) {
      phase = 'Ovulatory Phase';
    } else if (cycleDay && cycleDay <= cycleLength) {
      phase = 'Luteal Phase';
    } else if (cycleDay) {
      phase = 'Late Cycle';
    }

    return {
      dateStr: targetDateStr,
      cycleDay,
      phase,
      status: 'LOWER_FERTILITY',
      fertilityLevel: 'LOWER',
      title: 'Lower Fertility',
      description: 'Lower estimated fertility likelihood. Cycle predictions are estimates and should not be used as contraception.'
    };
  }
}
