import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { AnalysisService } from './analysis.service';
import { CycleService, PeriodLog } from './cycle.service';
import { SymptomService, SymptomLog } from './symptom.service';

describe('AnalysisService', () => {
  let service: AnalysisService;
  let cycleService: CycleService;
  let mockSymptomService: jasmine.SpyObj<SymptomService>;

  beforeEach(() => {
    mockSymptomService = jasmine.createSpyObj('SymptomService', ['getSymptomHistory']);
    mockSymptomService.getSymptomHistory.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        AnalysisService,
        CycleService,
        {
          provide: Auth,
          useValue: {
            currentUser: { uid: 'test-user-123' },
            authStateReady: () => Promise.resolve()
          }
        },
        { provide: Firestore, useValue: {} },
        { provide: SymptomService, useValue: mockSymptomService }
      ]
    });

    service = TestBed.inject(AnalysisService);
    cycleService = TestBed.inject(CycleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // 1. No period data
  it('1. should return empty analysis state when no period data exists', () => {
    const res = service.calculateAnalysis([], []);
    expect(res.hasLogs).toBeFalse();
    expect(res.totalLogsCount).toBe(0);
    expect(res.completedCyclesCount).toBe(0);
    expect(res.averageCycleLength).toBeNull();
    expect(res.averagePeriodDuration).toBeNull();
    expect(res.shortestCycle).toBeNull();
    expect(res.longestCycle).toBeNull();
    expect(res.cycleVariabilityText).toBe('Building history');
    expect(res.cycleHistoryChart.length).toBe(0);
    expect(res.periodDurationTrend.length).toBe(0);
    expect(res.recentCycles.length).toBe(0);
    expect(res.insights.length).toBe(0);
  });

  // 2. One period record
  it('2. should indicate insufficient cycles when only one period record exists', () => {
    const logs: PeriodLog[] = [{ periodStartDate: '2026-09-05', periodLength: 5 }];
    const res = service.calculateAnalysis(logs, []);

    expect(res.hasLogs).toBeTrue();
    expect(res.totalLogsCount).toBe(1);
    expect(res.completedCyclesCount).toBe(0);
    expect(res.averageCycleLength).toBeNull();
    expect(res.shortestCycle).toBeNull();
    expect(res.longestCycle).toBeNull();
    expect(res.cycleVariabilityText).toBe('Building history');
    expect(res.cycleConsistencyText).toBe('Building history');
    expect(res.averagePeriodDuration).toBe(5);
    expect(res.cycleHistoryChart.length).toBe(0);
    expect(res.periodDurationTrend.length).toBe(1);
    expect(res.recentCycles.length).toBe(1);
    expect(res.recentCycles[0].cycleLengthText).toBe('Current cycle');
  });

  // 3. Two completed cycles
  it('3. should calculate metrics accurately for two completed cycles', () => {
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-07-01', periodLength: 5 },
      { periodStartDate: '2026-07-29', periodLength: 5 }, // 28 days
      { periodStartDate: '2026-08-26', periodLength: 5 }  // 28 days
    ];
    const res = service.calculateAnalysis(logs, []);

    expect(res.completedCyclesCount).toBe(2);
    expect(res.averageCycleLength).toBe(28);
    expect(res.shortestCycle).toBe(28);
    expect(res.longestCycle).toBe(28);
    expect(res.cycleVariabilityDays).toBe(0);
    expect(res.cycleVariabilityText).toBe('Low variability');
    expect(res.cycleConsistencyText).toBe('Consistent');
  });

  // 4. 27-day cycle
  it('4. should identify a 27-day cycle between consecutive periods', () => {
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-09-05', periodLength: 5 },
      { periodStartDate: '2026-10-02', periodLength: 5 }
    ];
    const res = service.calculateAnalysis(logs, []);

    expect(res.completedCyclesCount).toBe(1);
    expect(res.averageCycleLength).toBe(27);
    expect(res.shortestCycle).toBe(27);
    expect(res.longestCycle).toBe(27);
  });

  // 5. 30-day cycle
  it('5. should identify a 30-day cycle between consecutive periods', () => {
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-10-02', periodLength: 5 },
      { periodStartDate: '2026-11-01', periodLength: 5 }
    ];
    const res = service.calculateAnalysis(logs, []);

    expect(res.completedCyclesCount).toBe(1);
    expect(res.averageCycleLength).toBe(30);
    expect(res.shortestCycle).toBe(30);
    expect(res.longestCycle).toBe(30);
  });

  // 6. Variable cycles
  it('6. should detect high variability when cycle lengths vary significantly', () => {
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-05-01', periodLength: 5 },
      { periodStartDate: '2026-05-28', periodLength: 5 }, // 27 days
      { periodStartDate: '2026-07-02', periodLength: 5 }, // 35 days (variance = 8)
      { periodStartDate: '2026-07-30', periodLength: 5 }  // 28 days
    ];
    const res = service.calculateAnalysis(logs, []);

    expect(res.completedCyclesCount).toBe(3);
    expect(res.shortestCycle).toBe(27);
    expect(res.longestCycle).toBe(35);
    expect(res.cycleVariabilityDays).toBe(8);
    expect(res.cycleVariabilityText).toBe('High variability');
    expect(res.cycleConsistencyText).toBe('Variable');
  });

  // 7. Average cycle calculation
  it('7. should calculate correct arithmetic mean across variable intervals (27, 30, 28)', () => {
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-08-09', periodLength: 5 },
      { periodStartDate: '2026-09-05', periodLength: 5 }, // 27
      { periodStartDate: '2026-10-05', periodLength: 5 }, // 30
      { periodStartDate: '2026-11-02', periodLength: 5 }  // 28
    ];
    const res = service.calculateAnalysis(logs, []);

    // (27 + 30 + 28) / 3 = 28.33 => 28
    expect(res.averageCycleLength).toBe(28);
  });

  // 8. Shortest cycle
  it('8. should accurately compute the shortest cycle', () => {
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-01-01' },
      { periodStartDate: '2026-01-27' }, // 26 days
      { periodStartDate: '2026-02-27' }, // 31 days
      { periodStartDate: '2026-03-27' }  // 28 days
    ];
    const res = service.calculateAnalysis(logs, []);
    expect(res.shortestCycle).toBe(26);
  });

  // 9. Longest cycle
  it('9. should accurately compute the longest cycle', () => {
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-01-01' },
      { periodStartDate: '2026-01-27' }, // 26 days
      { periodStartDate: '2026-02-28' }, // 32 days
      { periodStartDate: '2026-03-28' }  // 28 days
    ];
    const res = service.calculateAnalysis(logs, []);
    expect(res.longestCycle).toBe(32);
  });

  // 10. Average period duration
  it('10. should accurately compute average period bleeding duration', () => {
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-08-01', periodLength: 4 },
      { periodStartDate: '2026-08-29', periodLength: 6 },
      { periodStartDate: '2026-09-27', periodLength: 5 }
    ];
    const res = service.calculateAnalysis(logs, []);
    // (4 + 6 + 5) / 3 = 5
    expect(res.averagePeriodDuration).toBe(5);
  });

  // 11. Variability calculation
  it('11. should correctly classify Low, Moderate, and High variability', () => {
    // A. Low (difference <= 2)
    const lowLogs: PeriodLog[] = [
      { periodStartDate: '2026-01-01' },
      { periodStartDate: '2026-01-29' }, // 28
      { periodStartDate: '2026-02-27' }  // 29 -> diff = 1
    ];
    const lowRes = service.calculateAnalysis(lowLogs, []);
    expect(lowRes.cycleVariabilityText).toBe('Low variability');
    expect(lowRes.cycleConsistencyText).toBe('Consistent');

    // B. Moderate (difference <= 5)
    const modLogs: PeriodLog[] = [
      { periodStartDate: '2026-01-01' },
      { periodStartDate: '2026-01-28' }, // 27
      { periodStartDate: '2026-03-01' }  // 31 -> diff = 4
    ];
    const modRes = service.calculateAnalysis(modLogs, []);
    expect(modRes.cycleVariabilityText).toBe('Moderate variability');
    expect(modRes.cycleConsistencyText).toBe('Mostly consistent');
  });

  // 12. Recent-cycle ordering
  it('12. should order recent cycles reverse-chronologically with latest first', () => {
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-07-01', periodLength: 5 },
      { periodStartDate: '2026-08-01', periodLength: 5 },
      { periodStartDate: '2026-09-01', periodLength: 5 }
    ];
    const res = service.calculateAnalysis(logs, []);
    expect(res.recentCycles.length).toBe(3);
    expect(res.recentCycles[0].periodStarted).toBe('2026-09-01');
    expect(res.recentCycles[1].periodStarted).toBe('2026-08-01');
    expect(res.recentCycles[2].periodStarted).toBe('2026-07-01');
  });

  // 13. Date-range filtering
  it('13. should filter analysis metrics according to selected cycle count', () => {
    // 5 completed cycles
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-01-01' },
      { periodStartDate: '2026-01-28' }, // 27
      { periodStartDate: '2026-02-26' }, // 29
      { periodStartDate: '2026-03-27' }, // 29
      { periodStartDate: '2026-04-26' }, // 30
      { periodStartDate: '2026-05-27' }  // 31
    ];

    // Filter last 3 cycles: (29, 30, 31) -> avg = 30
    const filtered3 = service.calculateAnalysis(logs, [], '3');
    expect(filtered3.completedCyclesCount).toBe(3);
    expect(filtered3.averageCycleLength).toBe(30);
    expect(filtered3.shortestCycle).toBe(29);
    expect(filtered3.longestCycle).toBe(31);

    // All cycles: (27, 29, 29, 30, 31) -> avg = 146 / 5 = 29.2 => 29
    const allRes = service.calculateAnalysis(logs, [], 'all');
    expect(allRes.completedCyclesCount).toBe(5);
    expect(allRes.averageCycleLength).toBe(29);
    expect(allRes.shortestCycle).toBe(27);
  });

  // 14. Missing optional flow data
  it('14. should handle missing flow gracefully with Not recorded label', () => {
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-09-05', periodLength: 5 } // no flow specified
    ];
    const res = service.calculateAnalysis(logs, []);
    expect(res.hasFlowData).toBeFalse();
    expect(res.flowDistribution.length).toBe(0);
    expect(res.recentCycles[0].flowText).toBe('Not recorded');
  });

  // 15. Missing symptom data
  it('15. should handle empty symptom history gracefully', () => {
    const logs: PeriodLog[] = [
      { periodStartDate: '2026-09-05', periodLength: 5 }
    ];
    const res = service.calculateAnalysis(logs, []);
    expect(res.hasSymptomData).toBeFalse();
    expect(res.commonSymptoms.length).toBe(0);
  });

  // 16. Firestore error state
  it('16. should propagate error when Firestore observable throws', (done) => {
    spyOn(cycleService, 'getPeriodLogs').and.returnValue(
      throwError(() => new Error('Firestore connection failed'))
    );
    mockSymptomService.getSymptomHistory.and.returnValue(of([]));

    service.getAnalysisStream('all').subscribe({
      next: () => fail('Should have thrown an error'),
      error: (err) => {
        expect(err.message).toContain('Firestore');
        done();
      }
    });
  });

  // 17. Loading state
  it('17. should emit combined data successfully when streams emit', (done) => {
    const logs: PeriodLog[] = [{ periodStartDate: '2026-09-05', periodLength: 5 }];
    const symptoms: SymptomLog[] = [{ date: '2026-09-05', cramps: true }];

    spyOn(cycleService, 'getPeriodLogs').and.returnValue(of(logs));
    mockSymptomService.getSymptomHistory.and.returnValue(of(symptoms));

    service.getAnalysisStream('all').subscribe({
      next: (data) => {
        expect(data.hasLogs).toBeTrue();
        expect(data.hasSymptomData).toBeTrue();
        expect(data.commonSymptoms[0].label).toBe('Cramps');
        expect(data.commonSymptoms[0].count).toBe(1);
        done();
      }
    });
  });
});
