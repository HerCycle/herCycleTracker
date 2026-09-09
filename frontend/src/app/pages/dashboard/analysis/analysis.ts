import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  AnalysisService,
  AnalysisData,
  CycleRangeFilter
} from '../../../services/analysis.service';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analysis.html',
  styleUrl: './analysis.scss'
})
export class AnalysisPage implements OnInit, OnDestroy {
  private readonly analysisService = inject(AnalysisService);
  private analysisSub?: Subscription;

  readonly analysis = signal<AnalysisData | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedRange = signal<CycleRangeFilter>('all');

  // Chart Tooltips
  readonly hoveredCycle = signal<{ label: string; days: number; x: number; y: number } | null>(null);
  readonly hoveredPeriod = signal<{ label: string; days: number; x: number; y: number } | null>(null);

  ngOnInit(): void {
    this.loadAnalysis();
  }

  ngOnDestroy(): void {
    this.analysisSub?.unsubscribe();
  }

  setRangeFilter(range: CycleRangeFilter): void {
    if (this.selectedRange() === range) return;
    this.selectedRange.set(range);
    this.loadAnalysis();
  }

  loadAnalysis(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.analysisSub?.unsubscribe();

    this.analysisSub = this.analysisService
      .getAnalysisStream(this.selectedRange())
      .subscribe({
        next: (data) => {
          this.analysis.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load analysis:', err);
          this.errorMessage.set('Unable to load your analysis right now.');
          this.isLoading.set(false);
        }
      });
  }

  retry(): void {
    this.loadAnalysis();
  }

  // Chart coordinate helper for SVG Cycle History
  getCycleBarHeight(cycleLength: number, maxVal = 45): number {
    const minHeight = 10;
    const maxHeight = 160;
    const clamped = Math.max(15, Math.min(60, cycleLength));
    return Math.round(minHeight + ((clamped - 15) / (maxVal - 15)) * (maxHeight - minHeight));
  }

  getPeriodBarHeight(duration: number, maxVal = 10): number {
    const minHeight = 10;
    const maxHeight = 140;
    const clamped = Math.max(1, Math.min(15, duration));
    return Math.round(minHeight + (clamped / maxVal) * (maxHeight - minHeight));
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return 'Not recorded';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = Number(parts[1]) - 1;
      return `${monthNames[m] || parts[1]} ${Number(parts[2])}, ${parts[0]}`;
    }
    return dateStr;
  }
}
