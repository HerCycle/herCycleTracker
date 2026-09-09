import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { CycleService, PeriodLog } from './cycle.service';

describe('CycleService', () => {
  let service: CycleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CycleService,
        { provide: Auth, useValue: { currentUser: { uid: 'test-uid-123' } } },
        { provide: Firestore, useValue: {} }
      ]
    });
    service = TestBed.inject(CycleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // 1. One period log + preferred cycle length 28
  it('1. should use preferred cycle length 28 and predict next period when only one log exists', () => {
    const logs: PeriodLog[] = [
      {
        id: 'log-1',
        periodStartDate: '2026-09-05',
        periodLength: 5
      }
    ];

    const metrics = service.calculateCycleMetrics(logs, 28);
    expect(metrics.hasData).toBeTrue();
    expect(metrics.hasCompletedCycles).toBeFalse();
    expect(metrics.completedCyclesCount).toBe(0);
    expect(metrics.cycleLength).toBe(28);
    expect(metrics.latestPeriodStartDate).toBe('2026-09-05');
    // Next period = 2026-09-05 + 28 days = 2026-10-03
    expect(metrics.nextPeriodDate).toBe('2026-10-03');
    expect(metrics.regularityStatus).toBe('BUILDING_HISTORY');
  });

  // 2. Two periods 27 days apart
  it('2. should calculate actual cycle length of 27 days between two consecutive periods', () => {
    const logs: PeriodLog[] = [
      { id: 'log-1', periodStartDate: '2026-09-05', periodLength: 5 },
      { id: 'log-2', periodStartDate: '2026-10-02', periodLength: 5 }
    ];

    const completed = service.calculateActualCycleLengths(logs);
    expect(completed.length).toBe(1);
    expect(completed[0].startDate).toBe('2026-09-05');
    expect(completed[0].nextStartDate).toBe('2026-10-02');
    expect(completed[0].cycleLength).toBe(27);

    const predictionLength = service.getPredictionCycleLength(logs, 28);
    expect(predictionLength).toBe(27);
  });

  // 3. Two periods 30 days apart
  it('3. should calculate actual cycle length of 30 days between two consecutive periods', () => {
    const logs: PeriodLog[] = [
      { id: 'log-2', periodStartDate: '2026-10-02', periodLength: 5 },
      { id: 'log-3', periodStartDate: '2026-11-01', periodLength: 5 }
    ];

    const completed = service.calculateActualCycleLengths(logs);
    expect(completed.length).toBe(1);
    expect(completed[0].startDate).toBe('2026-10-02');
    expect(completed[0].nextStartDate).toBe('2026-11-01');
    expect(completed[0].cycleLength).toBe(30);

    const predictionLength = service.getPredictionCycleLength(logs, 28);
    expect(predictionLength).toBe(30);
  });

  // 4. Three periods with 27, 30, 28 day cycles
  it('4. should calculate average cycle length from 27, 30, and 28 day completed cycles', () => {
    // 2026-08-09 -> 2026-09-05 = 27 days
    // 2026-09-05 -> 2026-10-05 = 30 days
    // 2026-10-05 -> 2026-11-02 = 28 days
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-08-09', periodLength: 5 },
      { periodStartDate: '2026-09-05', periodLength: 5 },
      { periodStartDate: '2026-10-05', periodLength: 5 },
      { periodStartDate: '2026-11-02', periodLength: 5 }
    ];

    const completed = service.calculateActualCycleLengths(logs);
    expect(completed.length).toBe(3);
    expect(completed.map(c => c.cycleLength)).toEqual([27, 30, 28]);

    // Average: (27 + 30 + 28) / 3 = 85 / 3 = 28.33 => 28
    const avgInfo = service.calculateAverageCycleLength(logs, 28);
    expect(avgInfo.hasHistory).toBeTrue();
    expect(avgInfo.count).toBe(3);
    expect(avgInfo.average).toBe(28);

    const metrics = service.calculateCycleMetrics(logs);
    expect(metrics.cycleLength).toBe(28);
    expect(metrics.hasCompletedCycles).toBeTrue();
    expect(metrics.completedCyclesCount).toBe(3);
    // Variance = 30 - 27 = 3 <= 5 => 85 regularity score
    expect(metrics.regularityScore).toBe(85);
    expect(metrics.regularityStatus).toBe('SLIGHT_VARIATION');
  });

  // 5. Latest actual period becomes the current cycle anchor
  it('5. should use the latest actual period as the current cycle anchor', () => {
    const logs: PeriodLog[] = [
      { id: 'log-1', periodStartDate: '2026-09-05', periodLength: 5 },
      { id: 'log-2', periodStartDate: '2026-10-02', periodLength: 5 }
    ];

    const latest = service.getLatestPeriod(logs);
    expect(latest?.periodStartDate).toBe('2026-10-02');

    const metrics = service.calculateCycleMetrics(logs);
    expect(metrics.latestPeriodStartDate).toBe('2026-10-02');
    // Future predictions project from latestStart 2026-10-02 with cycleLength 27
    // 2026-10-02 + 27 days = 2026-10-29
    expect(metrics.nextPeriodDate).toBe('2026-10-29');
  });

  // 6. New actual period overrides an old prediction
  it('6. should override an old prediction with an actual logged period', () => {
    // Before logging 2026-10-02, 2026-10-03 was predicted with cycleLength 28
    const initialLogs: PeriodLog[] = [
      { id: 'log-1', periodStartDate: '2026-09-05', periodLength: 5 }
    ];
    const statusBefore = service.getDateCycleStatus('2026-10-03', initialLogs, 28);
    expect(statusBefore.status).toBe('PREDICTED_PERIOD');

    // User logs actual period on 2026-10-02 (period ends 2026-10-06)
    const updatedLogs: PeriodLog[] = [
      { id: 'log-1', periodStartDate: '2026-09-05', periodLength: 5 },
      { id: 'log-2', periodStartDate: '2026-10-02', periodEndDate: '2026-10-06', periodLength: 5 }
    ];

    const statusAfter = service.getDateCycleStatus('2026-10-03', updatedLogs, 28);
    // 2026-10-03 is now Period Day 2 of the actual logged period!
    expect(statusAfter.status).toBe('LOGGED_PERIOD');
    expect(statusAfter.cycleDay).toBe(2);
    expect(statusAfter.periodDayNum).toBe(2);
    expect(statusAfter.title).toBe('Period Day 2');
  });

  // 7. Editing an existing period updates the same document
  it('7. should call updatePeriod on an existing document id without creating a new one', (done) => {
    spyOn(service, 'updatePeriod').and.returnValue(of({ success: true }));

    const updatedLog: PeriodLog = {
      periodStartDate: '2026-09-06',
      periodLength: 5
    };

    service.updatePeriod('doc-123', updatedLog).subscribe((res) => {
      expect(res.success).toBeTrue();
      expect(service.updatePeriod).toHaveBeenCalledWith('doc-123', updatedLog);
      done();
    });
  });

  // 8. Logging a new period creates a new document
  it('8. should call logPeriod to add a new document without overwriting previous history', (done) => {
    spyOn(service, 'logPeriod').and.returnValue(of({ success: true, id: 'new-doc-456' }));

    const newLog: PeriodLog = {
      periodStartDate: '2026-10-02',
      periodLength: 5
    };

    service.logPeriod(newLog).subscribe((res) => {
      expect(res.success).toBeTrue();
      expect(res.id).toBe('new-doc-456');
      expect(service.logPeriod).toHaveBeenCalledWith(newLog);
      done();
    });
  });

  // 9. Average cycle calculation
  it('9. should accurately calculate average cycle length across multiple variable intervals', () => {
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-06-01' },
      { periodStartDate: '2026-06-29' }, // 28 days
      { periodStartDate: '2026-07-31' }, // 32 days
      { periodStartDate: '2026-08-27' }  // 27 days
    ];
    // Intervals: 28, 32, 27. Sum = 87. Avg = 87 / 3 = 29 days
    const avgResult = service.calculateAverageCycleLength(logs);
    expect(avgResult.hasHistory).toBeTrue();
    expect(avgResult.count).toBe(3);
    expect(avgResult.average).toBe(29);
  });

  // 10. Insufficient history
  it('10. should report insufficient history when fewer than 2 logs exist', () => {
    const noLogsResult = service.calculateAverageCycleLength([], 30);
    expect(noLogsResult.hasHistory).toBeFalse();
    expect(noLogsResult.count).toBe(0);
    expect(noLogsResult.average).toBe(30);

    const oneLogResult = service.calculateAverageCycleLength(
      [{ periodStartDate: '2026-09-05' }],
      28
    );
    expect(oneLogResult.hasHistory).toBeFalse();
    expect(oneLogResult.count).toBe(0);
    expect(oneLogResult.average).toBe(28);

    const metrics = service.calculateCycleMetrics([{ periodStartDate: '2026-09-05' }], 28);
    expect(metrics.hasCompletedCycles).toBeFalse();
    expect(metrics.regularityStatus).toBe('BUILDING_HISTORY');
    expect(metrics.regularityScore).toBeNull();
  });

  // 11. Late period
  it('11. should flag isLate when elapsed days exceed cycle length', () => {
    const d = new Date();
    d.setDate(d.getDate() - 35);
    const startStr = service.formatLocalDate(d);

    const logs: PeriodLog[] = [{ periodStartDate: startStr, cycleLength: 28, periodLength: 5 }];
    const metrics = service.calculateCycleMetrics(logs, 28);
    expect(metrics.hasData).toBeTrue();
    expect(metrics.isLate).toBeTrue();
  });

  // 12. Future date rejection
  it('12. should reject a period start date that is in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const futureStr = service.formatLocalDate(futureDate);

    const validation = service.validatePeriodLog({
      periodStartDate: futureStr,
      periodLength: 5
    });

    expect(validation.valid).toBeFalse();
    expect(validation.error).toContain('future');
  });

  // 13. Chronological period validation and overlap rejection
  it('13. should reject duplicate start dates and overlapping period date ranges', () => {
    const existingLogs: PeriodLog[] = [
      { id: 'log-1', periodStartDate: '2026-08-05', periodEndDate: '2026-08-09', periodLength: 5 }
    ];

    // Duplicate start date
    const dupCheck = service.validatePeriodLog(
      { periodStartDate: '2026-08-05', periodLength: 5 },
      existingLogs
    );
    expect(dupCheck.valid).toBeFalse();
    expect(dupCheck.error).toContain('already exists');

    // Overlapping date
    const overlapCheck = service.validatePeriodLog(
      { periodStartDate: '2026-08-07', periodLength: 5 },
      existingLogs
    );
    expect(overlapCheck.valid).toBeFalse();
    expect(overlapCheck.error).toContain('overlap');

    // Non-overlapping valid past period
    const validCheck = service.validatePeriodLog(
      { periodStartDate: '2026-09-01', periodLength: 5 },
      existingLogs
    );
    expect(validCheck.valid).toBeTrue();
  });

  // 14. Timezone-safe calculations
  it('14. should parse and format local dates safely without timezone shifts', () => {
    const parsed = service.parseLocalDate('2026-09-05');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(8); // September
    expect(parsed.getDate()).toBe(5);
    expect(parsed.getHours()).toBe(0);

    const formatted = service.formatLocalDate(parsed);
    expect(formatted).toBe('2026-09-05');
  });

  // 15. Real User Scenario
  describe('15. Real User Scenario (2026-09-05 -> 2026-10-02 -> 2026-11-01)', () => {
    it('should dynamically adapt cycle lengths, predictions, and history across consecutive logs', () => {
      // Step A: User registers with initial period on 2026-09-05, cycle length 28, period length 5
      const logsStepA: PeriodLog[] = [
        { id: 'log-1', periodStartDate: '2026-09-05', periodLength: 5 }
      ];

      const metricsA = service.calculateCycleMetrics(logsStepA, 28);
      expect(metricsA.hasData).toBeTrue();
      expect(metricsA.latestPeriodStartDate).toBe('2026-09-05');
      expect(metricsA.cycleLength).toBe(28);
      // Next period = 2026-09-05 + 28 = 2026-10-03
      expect(metricsA.nextPeriodDate).toBe('2026-10-03');
      // Ovulation = 2026-10-03 - 14 days = 2026-09-19
      expect(metricsA.ovulationDate).toBe('2026-09-19');
      // Fertile window = 2026-09-14 to 2026-09-20
      expect(metricsA.fertileWindowStart).toBe('2026-09-14');
      expect(metricsA.fertileWindowEnd).toBe('2026-09-20');
      expect(metricsA.hasCompletedCycles).toBeFalse();

      // Step B: User logs actual period on 2026-10-02 (27 days later)
      const logsStepB: PeriodLog[] = [
        { id: 'log-1', periodStartDate: '2026-09-05', periodLength: 5 },
        { id: 'log-2', periodStartDate: '2026-10-02', periodLength: 5 }
      ];

      const completedB = service.calculateActualCycleLengths(logsStepB);
      expect(completedB.length).toBe(1);
      expect(completedB[0].cycleLength).toBe(27);

      const metricsB = service.calculateCycleMetrics(logsStepB, 28);
      expect(metricsB.latestPeriodStartDate).toBe('2026-10-02');
      // Actual cycle history of 27 days is now used for prediction!
      expect(metricsB.cycleLength).toBe(27);
      // Next period = 2026-10-02 + 27 = 2026-10-29
      expect(metricsB.nextPeriodDate).toBe('2026-10-29');
      // Ovulation = 2026-10-29 - 14 days = 2026-10-15
      expect(metricsB.ovulationDate).toBe('2026-10-15');
      // Fertile window = 2026-10-10 to 2026-10-16
      expect(metricsB.fertileWindowStart).toBe('2026-10-10');
      expect(metricsB.fertileWindowEnd).toBe('2026-10-16');
      expect(metricsB.hasCompletedCycles).toBeTrue();

      // Step C: User logs second actual period on 2026-11-01 (30 days later)
      const logsStepC: PeriodLog[] = [
        { id: 'log-1', periodStartDate: '2026-09-05', periodLength: 5 },
        { id: 'log-2', periodStartDate: '2026-10-02', periodLength: 5 },
        { id: 'log-3', periodStartDate: '2026-11-01', periodLength: 5 }
      ];

      const completedC = service.calculateActualCycleLengths(logsStepC);
      expect(completedC.length).toBe(2);
      expect(completedC[0].cycleLength).toBe(27);
      expect(completedC[1].cycleLength).toBe(30);

      // Average: (27 + 30) / 2 = 28.5 => 29 days
      const avgC = service.calculateAverageCycleLength(logsStepC);
      expect(avgC.hasHistory).toBeTrue();
      expect(avgC.average).toBe(29);

      const metricsC = service.calculateCycleMetrics(logsStepC, 28);
      expect(metricsC.latestPeriodStartDate).toBe('2026-11-01');
      // Cycle length prediction is now 29 days (average of 27 & 30)
      expect(metricsC.cycleLength).toBe(29);
      // Next period = 2026-11-01 + 29 = 2026-11-30
      expect(metricsC.nextPeriodDate).toBe('2026-11-30');
      // Ovulation = 2026-11-30 - 14 days = 2026-11-16
      expect(metricsC.ovulationDate).toBe('2026-11-16');
      // Fertile window = 2026-11-11 to 2026-11-17
      expect(metricsC.fertileWindowStart).toBe('2026-11-11');
      expect(metricsC.fertileWindowEnd).toBe('2026-11-17');
      expect(metricsC.hasCompletedCycles).toBeTrue();
      expect(metricsC.completedCyclesCount).toBe(2);
      expect(metricsC.actualCycleLengths).toEqual([27, 30]);

      // Check selected date inspection on calendar:
      // Real logged period 2026-10-02 is LOGGED_PERIOD
      const oct2Status = service.getDateCycleStatus('2026-10-02', logsStepC, 28);
      expect(oct2Status.status).toBe('LOGGED_PERIOD');
      expect(oct2Status.periodDayNum).toBe(1);

      // Historical date 2026-10-18 between 2026-10-02 and 2026-11-01 (30 day cycle):
      // Ovulation was 2026-11-01 - 14 = 2026-10-18!
      const oct18Status = service.getDateCycleStatus('2026-10-18', logsStepC, 28);
      expect(oct18Status.status).toBe('OVULATION');
      expect(oct18Status.fertilityLevel).toBe('HIGH');
    });
  });
});

