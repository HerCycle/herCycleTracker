import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CycleService, PeriodLog, CompletedCycle, CycleMetrics } from './cycle.service';
import { SymptomService, SymptomLog } from './symptom.service';

export type CycleRangeFilter = '3' | '6' | '12' | 'all';

export interface CycleChartItem {
  cycleIndex: number;
  label: string;
  startDate: string;
  nextStartDate: string;
  cycleLength: number;
}

export interface PeriodDurationChartItem {
  periodIndex: number;
  label: string;
  startDate: string;
  duration: number;
}

export interface RecentCycleRow {
  id?: string;
  periodStarted: string;
  cycleLengthText: string;
  cycleLengthDays: number | null;
  periodDurationText: string;
  periodDurationDays: number | null;
  flowText: string;
}

export interface SymptomFrequency {
  key: string;
  label: string;
  icon: string;
  count: number;
}

export interface FlowDistribution {
  flow: string;
  count: number;
  percentage: number;
}

export interface AnalysisData {
  hasLogs: boolean;
  totalLogsCount: number;
  completedCyclesCount: number;
  averageCycleLength: number | null;
  averagePeriodDuration: number | null;
  shortestCycle: number | null;
  longestCycle: number | null;
  cycleVariabilityText: string;
  cycleVariabilityDays: number | null;
  cycleConsistencyText: string;
  cycleConsistencyExplanation: string;
  cycleHistoryChart: CycleChartItem[];
  periodDurationTrend: PeriodDurationChartItem[];
  recentCycles: RecentCycleRow[];
  commonSymptoms: SymptomFrequency[];
  hasSymptomData: boolean;
  flowDistribution: FlowDistribution[];
  hasFlowData: boolean;
  insights: string[];
  fertilityOvulationEstimate: {
    ovulationDate: string | null;
    fertileWindowStart: string | null;
    fertileWindowEnd: string | null;
    disclaimer: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {
  private readonly cycleService = inject(CycleService);
  private readonly symptomService = inject(SymptomService);

  // Stream of combined analysis based on real-time Firestore updates
  getAnalysisStream(rangeFilter: CycleRangeFilter = 'all'): Observable<AnalysisData> {
    return combineLatest([
      this.cycleService.getPeriodLogs(),
      this.symptomService.getSymptomHistory()
    ]).pipe(
      map(([logs, symptoms]) => this.calculateAnalysis(logs, symptoms, rangeFilter)),
      catchError((err) => {
        console.error('getAnalysisStream error:', err);
        throw err;
      })
    );
  }

  calculateAnalysis(
    rawLogs: PeriodLog[] = [],
    rawSymptoms: SymptomLog[] = [],
    rangeFilter: CycleRangeFilter = 'all'
  ): AnalysisData {
    // 1. Clean and chronologically sort logs
    const validLogs = (rawLogs || [])
      .filter((l) => !!l.periodStartDate)
      .sort((a, b) => a.periodStartDate.localeCompare(b.periodStartDate));

    if (validLogs.length === 0) {
      return this.getEmptyAnalysisState();
    }

    // 2. Calculate actual completed cycles from consecutive logs
    const allCompletedCycles = this.cycleService.calculateActualCycleLengths(validLogs);

    // Apply Range Filter to completed cycles
    let filteredCompletedCycles = [...allCompletedCycles];
    let filteredLogs = [...validLogs];

    if (rangeFilter !== 'all') {
      const limit = Number(rangeFilter);
      if (!isNaN(limit) && limit > 0) {
        filteredCompletedCycles = allCompletedCycles.slice(-limit);
        // Take corresponding logs (limit + 1 logs form limit cycles)
        filteredLogs = validLogs.slice(-(limit + 1));
      }
    }

    // 3. Average Cycle Length (from completed cycles)
    let averageCycleLength: number | null = null;
    let shortestCycle: number | null = null;
    let longestCycle: number | null = null;
    let cycleVariabilityText = 'Building history';
    let cycleVariabilityDays: number | null = null;
    let cycleConsistencyText = 'Building history';

    if (filteredCompletedCycles.length > 0) {
      const cycleLengths = filteredCompletedCycles.map((c) => c.cycleLength);
      const sum = cycleLengths.reduce((acc, len) => acc + len, 0);
      averageCycleLength = Math.round(sum / cycleLengths.length);
      shortestCycle = Math.min(...cycleLengths);
      longestCycle = Math.max(...cycleLengths);

      if (filteredCompletedCycles.length >= 2) {
        cycleVariabilityDays = longestCycle - shortestCycle;
        if (cycleVariabilityDays <= 2) {
          cycleVariabilityText = 'Low variability';
          cycleConsistencyText = 'Consistent';
        } else if (cycleVariabilityDays <= 5) {
          cycleVariabilityText = 'Moderate variability';
          cycleConsistencyText = 'Mostly consistent';
        } else {
          cycleVariabilityText = 'High variability';
          cycleConsistencyText = 'Variable';
        }
      } else {
        cycleVariabilityText = 'Requires 2+ cycles';
        cycleConsistencyText = 'Building history';
      }
    }

    // 4. Average Period Length (from filtered logs)
    let averagePeriodDuration: number | null = null;
    const durations: number[] = [];

    for (const log of filteredLogs) {
      let dur = log.periodLength;
      if (log.periodEndDate && log.periodStartDate) {
        const start = this.cycleService.parseLocalDate(log.periodStartDate).getTime();
        const end = this.cycleService.parseLocalDate(log.periodEndDate).getTime();
        const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (diff >= 1 && diff <= 15) {
          dur = diff;
        }
      }
      if (dur && dur >= 1 && dur <= 15) {
        durations.push(dur);
      }
    }

    if (durations.length > 0) {
      const sumDur = durations.reduce((acc, d) => acc + d, 0);
      averagePeriodDuration = Math.round(sumDur / durations.length);
    }

    // 5. Historical Cycle Chart Data
    const cycleHistoryChart: CycleChartItem[] = filteredCompletedCycles.map((c, idx) => {
      const startD = this.cycleService.parseLocalDate(c.startDate);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dateLabel = `${monthNames[startD.getMonth()]} ${startD.getDate()}`;
      return {
        cycleIndex: idx + 1,
        label: `Cycle ${idx + 1} (${dateLabel})`,
        startDate: c.startDate,
        nextStartDate: c.nextStartDate,
        cycleLength: c.cycleLength
      };
    });

    // 6. Period Duration Trend Data
    const periodDurationTrend: PeriodDurationChartItem[] = filteredLogs.map((log, idx) => {
      let dur = log.periodLength || 5;
      if (log.periodEndDate && log.periodStartDate) {
        const start = this.cycleService.parseLocalDate(log.periodStartDate).getTime();
        const end = this.cycleService.parseLocalDate(log.periodEndDate).getTime();
        const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (diff >= 1 && diff <= 15) {
          dur = diff;
        }
      }
      const startD = this.cycleService.parseLocalDate(log.periodStartDate);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dateLabel = `${monthNames[startD.getMonth()]} ${startD.getDate()}`;
      return {
        periodIndex: idx + 1,
        label: `Period ${idx + 1} (${dateLabel})`,
        startDate: log.periodStartDate,
        duration: dur
      };
    });

    // 7. Recent Cycles Table (Reverse Chronological: Latest first)
    const recentCycles: RecentCycleRow[] = [];
    const reversedLogs = [...filteredLogs].reverse();

    for (let i = 0; i < reversedLogs.length; i++) {
      const current = reversedLogs[i];
      // Check if this log has a completed cycle in allCompletedCycles
      const completedMatch = allCompletedCycles.find((c) => c.startDate === current.periodStartDate);
      let cycleLenText = 'Not recorded';
      let cycleLenDays: number | null = null;

      if (i === 0 && !completedMatch) {
        cycleLenText = 'Current cycle';
      } else if (completedMatch) {
        cycleLenText = `${completedMatch.cycleLength} days`;
        cycleLenDays = completedMatch.cycleLength;
      }

      // Period duration
      let durText = 'Not recorded';
      let durDays: number | null = null;
      if (current.periodLength) {
        durDays = current.periodLength;
        durText = `${durDays} days`;
      } else if (current.periodEndDate && current.periodStartDate) {
        const s = this.cycleService.parseLocalDate(current.periodStartDate).getTime();
        const e = this.cycleService.parseLocalDate(current.periodEndDate).getTime();
        const d = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
        if (d >= 1 && d <= 15) {
          durDays = d;
          durText = `${d} days`;
        }
      }

      // Flow
      let flowText = 'Not recorded';
      if (current.flow) {
        const f = current.flow.toUpperCase();
        flowText = f.charAt(0) + f.slice(1).toLowerCase();
      }

      recentCycles.push({
        id: current.id,
        periodStarted: current.periodStartDate,
        cycleLengthText: cycleLenText,
        cycleLengthDays: cycleLenDays,
        periodDurationText: durText,
        periodDurationDays: durDays,
        flowText: flowText
      });
    }

    // 8. Symptom Frequency Analysis
    const symptomCounts: Record<string, { label: string; icon: string; count: number }> = {
      cramps: { label: 'Cramps', icon: 'healing', count: 0 },
      headache: { label: 'Headache', icon: 'sentiment_very_dissatisfied', count: 0 },
      bloating: { label: 'Bloating', icon: 'water_drop', count: 0 },
      fatigue: { label: 'Fatigue', icon: 'battery_alert', count: 0 },
      backPain: { label: 'Back Pain', icon: 'accessibility', count: 0 },
      acne: { label: 'Acne', icon: 'face', count: 0 },
      nausea: { label: 'Nausea', icon: 'sick', count: 0 },
      cravings: { label: 'Cravings', icon: 'restaurant', count: 0 },
      breastPain: { label: 'Breast Pain', icon: 'favorite_border', count: 0 }
    };

    let totalSymptomInstances = 0;
    for (const sym of rawSymptoms || []) {
      if (sym.cramps) { symptomCounts['cramps'].count++; totalSymptomInstances++; }
      if (sym.headache) { symptomCounts['headache'].count++; totalSymptomInstances++; }
      if (sym.bloating) { symptomCounts['bloating'].count++; totalSymptomInstances++; }
      if (sym.fatigue) { symptomCounts['fatigue'].count++; totalSymptomInstances++; }
      if (sym.backPain) { symptomCounts['backPain'].count++; totalSymptomInstances++; }
      if (sym.acne) { symptomCounts['acne'].count++; totalSymptomInstances++; }
      if (sym.nausea) { symptomCounts['nausea'].count++; totalSymptomInstances++; }
      if (sym.cravings) { symptomCounts['cravings'].count++; totalSymptomInstances++; }
      if (sym.breastPain) { symptomCounts['breastPain'].count++; totalSymptomInstances++; }
    }

    const commonSymptoms: SymptomFrequency[] = Object.entries(symptomCounts)
      .map(([key, item]) => ({
        key,
        label: item.label,
        icon: item.icon,
        count: item.count
      }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);

    // 9. Flow Distribution Analysis
    const flowCounts: Record<string, number> = { Light: 0, Medium: 0, Heavy: 0 };
    let totalFlowRecorded = 0;

    for (const log of filteredLogs) {
      if (log.flow) {
        const upper = log.flow.toUpperCase();
        if (upper.includes('LIGHT')) { flowCounts['Light']++; totalFlowRecorded++; }
        else if (upper.includes('HEAVY')) { flowCounts['Heavy']++; totalFlowRecorded++; }
        else { flowCounts['Medium']++; totalFlowRecorded++; }
      }
    }

    const flowDistribution: FlowDistribution[] = totalFlowRecorded > 0
      ? [
          { flow: 'Light', count: flowCounts['Light'], percentage: Math.round((flowCounts['Light'] / totalFlowRecorded) * 100) },
          { flow: 'Medium', count: flowCounts['Medium'], percentage: Math.round((flowCounts['Medium'] / totalFlowRecorded) * 100) },
          { flow: 'Heavy', count: flowCounts['Heavy'], percentage: Math.round((flowCounts['Heavy'] / totalFlowRecorded) * 100) }
        ].filter((f) => f.count > 0)
      : [];

    // 10. Generate Real Insights
    const insights = this.generateInsights({
      completedCycles: filteredCompletedCycles,
      averageCycleLength,
      averagePeriodDuration,
      shortestCycle,
      longestCycle,
      cycleVariabilityDays,
      commonSymptoms,
      flowDistribution
    });

    // 11. Fertility & Ovulation Estimation
    const metrics: CycleMetrics = this.cycleService.calculateCycleMetrics(validLogs);

    return {
      hasLogs: validLogs.length > 0,
      totalLogsCount: validLogs.length,
      completedCyclesCount: filteredCompletedCycles.length,
      averageCycleLength,
      averagePeriodDuration,
      shortestCycle,
      longestCycle,
      cycleVariabilityText,
      cycleVariabilityDays,
      cycleConsistencyText,
      cycleConsistencyExplanation: 'Based on the variation between your recorded cycle lengths.',
      cycleHistoryChart,
      periodDurationTrend,
      recentCycles,
      commonSymptoms,
      hasSymptomData: totalSymptomInstances > 0,
      flowDistribution,
      hasFlowData: totalFlowRecorded > 0,
      insights,
      fertilityOvulationEstimate: {
        ovulationDate: metrics.ovulationDate,
        fertileWindowStart: metrics.fertileWindowStart,
        fertileWindowEnd: metrics.fertileWindowEnd,
        disclaimer:
          'These are cycle-based estimates and should not be used as contraception or as a medical diagnosis.'
      }
    };
  }

  private generateInsights(data: {
    completedCycles: CompletedCycle[];
    averageCycleLength: number | null;
    averagePeriodDuration: number | null;
    shortestCycle: number | null;
    longestCycle: number | null;
    cycleVariabilityDays: number | null;
    commonSymptoms: SymptomFrequency[];
    flowDistribution: FlowDistribution[];
  }): string[] {
    const list: string[] = [];

    if (data.averageCycleLength != null && data.completedCycles.length > 0) {
      list.push(`Based on your recorded data, your average cycle length is ${data.averageCycleLength} days.`);
    }

    if (data.shortestCycle != null && data.longestCycle != null && data.completedCycles.length >= 2) {
      if (data.shortestCycle === data.longestCycle) {
        list.push(`Your recorded cycle length has been steady at ${data.shortestCycle} days.`);
      } else {
        list.push(`Your recent cycles have ranged from ${data.shortestCycle}–${data.longestCycle} days.`);
      }
    }

    if (data.cycleVariabilityDays != null && data.completedCycles.length >= 2) {
      list.push(`Your cycles have varied by approximately ${data.cycleVariabilityDays} days across completed cycles.`);
    }

    if (data.averagePeriodDuration != null) {
      list.push(`Your period duration has averaged ${data.averagePeriodDuration} days across your recorded periods.`);
    }

    if (data.commonSymptoms.length > 0) {
      const topSymptom = data.commonSymptoms[0];
      list.push(`${topSymptom.label} is your most frequently logged symptom (${topSymptom.count} records).`);
    }

    if (data.flowDistribution.length > 0) {
      const dominantFlow = [...data.flowDistribution].sort((a, b) => b.count - a.count)[0];
      list.push(`Most of your recorded periods feature ${dominantFlow.flow.toLowerCase()} flow (${dominantFlow.percentage}% of entries).`);
    }

    return list;
  }

  private getEmptyAnalysisState(): AnalysisData {
    return {
      hasLogs: false,
      totalLogsCount: 0,
      completedCyclesCount: 0,
      averageCycleLength: null,
      averagePeriodDuration: null,
      shortestCycle: null,
      longestCycle: null,
      cycleVariabilityText: 'Building history',
      cycleVariabilityDays: null,
      cycleConsistencyText: 'Building history',
      cycleConsistencyExplanation: 'Based on the variation between your recorded cycle lengths.',
      cycleHistoryChart: [],
      periodDurationTrend: [],
      recentCycles: [],
      commonSymptoms: [],
      hasSymptomData: false,
      flowDistribution: [],
      hasFlowData: false,
      insights: [],
      fertilityOvulationEstimate: {
        ovulationDate: null,
        fertileWindowStart: null,
        fertileWindowEnd: null,
        disclaimer:
          'These are cycle-based estimates and should not be used as contraception or as a medical diagnosis.'
      }
    };
  }
}
