import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SymptomService, SymptomLog } from '../../../services/symptom.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-symptoms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './symptoms.html',
  styleUrl: './symptoms.scss'
})
export class SymptomsPage implements OnInit, OnDestroy {
  private readonly symptomService = inject(SymptomService);
  private sub?: Subscription;

  readonly history = signal<SymptomLog[]>([]);
  readonly selectedDate = signal(new Date().toISOString().split('T')[0]);
  readonly isLoading = signal(true);

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isSaving = signal(false);

  // Form Fields State
  readonly logId = signal<string | null>(null);
  readonly mood = signal('CALM');
  readonly pain = signal(5);
  readonly energy = signal(7);
  readonly sleep = signal(7.5);
  readonly waterIntake = signal(2.0);
  readonly temperature = signal<number | null>(36.6);
  readonly weight = signal<number | null>(58.5);

  // Checkboxes
  readonly cramps = signal(false);
  readonly headache = signal(false);
  readonly backPain = signal(false);
  readonly bloating = signal(false);
  readonly acne = signal(false);
  readonly fatigue = signal(false);
  readonly nausea = signal(false);
  readonly cravings = signal(false);
  readonly breastPain = signal(false);

  readonly notes = signal('');

  ngOnInit(): void {
    this.sub = this.symptomService.getSymptomHistory().subscribe({
      next: (logs) => {
        this.isLoading.set(false);
        this.history.set(logs || []);
        this.loadLogForSelectedDate(this.selectedDate());
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onDateChange(newDate: string): void {
    this.selectedDate.set(newDate);
    this.loadLogForSelectedDate(newDate);
  }

  loadLogForSelectedDate(dateStr: string): void {
    const existing = this.history().find(l => l.date === dateStr);
    if (existing) {
      this.populateFormFromEntry(existing);
    } else {
      this.resetFormKeepDate();
    }
  }

  selectHistoryLog(item: SymptomLog): void {
    this.selectedDate.set(item.date);
    this.populateFormFromEntry(item);
  }

  private populateFormFromEntry(existing: SymptomLog): void {
    this.logId.set(existing.id || null);
    this.mood.set(existing.mood || 'CALM');
    this.pain.set(existing.pain ?? 5);
    this.energy.set(existing.energy ?? 7);
    this.sleep.set(existing.sleep ?? 7.5);
    this.waterIntake.set(existing.waterIntake ?? 2.0);
    this.temperature.set(existing.temperature ?? 36.6);
    this.weight.set(existing.weight ?? 58.5);
    this.cramps.set(!!existing.cramps);
    this.headache.set(!!existing.headache);
    this.backPain.set(!!existing.backPain);
    this.bloating.set(!!existing.bloating);
    this.acne.set(!!existing.acne);
    this.fatigue.set(!!existing.fatigue);
    this.nausea.set(!!existing.nausea);
    this.cravings.set(!!existing.cravings);
    this.breastPain.set(!!existing.breastPain);
    this.notes.set(existing.notes || '');
  }

  resetFormKeepDate(): void {
    this.logId.set(null);
    this.mood.set('CALM');
    this.pain.set(3);
    this.energy.set(7);
    this.sleep.set(7.5);
    this.waterIntake.set(2.0);
    this.temperature.set(36.6);
    this.weight.set(null);
    this.cramps.set(false);
    this.headache.set(false);
    this.backPain.set(false);
    this.bloating.set(false);
    this.acne.set(false);
    this.fatigue.set(false);
    this.nausea.set(false);
    this.cravings.set(false);
    this.breastPain.set(false);
    this.notes.set('');
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  saveLog(): void {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: SymptomLog = {
      date: this.selectedDate(),
      mood: this.mood(),
      pain: this.pain(),
      energy: this.energy(),
      sleep: this.sleep(),
      waterIntake: this.waterIntake(),
      temperature: this.temperature() || undefined,
      weight: this.weight() || undefined,
      cramps: this.cramps(),
      headache: this.headache(),
      backPain: this.backPain(),
      bloating: this.bloating(),
      acne: this.acne(),
      fatigue: this.fatigue(),
      nausea: this.nausea(),
      cravings: this.cravings(),
      breastPain: this.breastPain(),
      notes: this.notes().trim() || undefined
    };

    const currentId = this.logId();
    const action$ = currentId
      ? this.symptomService.updateSymptoms(currentId, payload)
      : this.symptomService.saveSymptoms(payload);

    action$.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.successMessage.set('Health metrics saved to Firestore successfully!');
          setTimeout(() => this.successMessage.set(null), 4000);
        } else {
          this.errorMessage.set(res.message || 'Failed to save health metrics.');
        }
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('An error occurred while saving health metrics.');
      }
    });
  }

  deleteLog(id?: string): void {
    if (!id || !confirm('Are you sure you want to delete this symptom log?')) return;

    this.symptomService.deleteSymptoms(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage.set('Symptom entry deleted from Firestore.');
          this.resetFormKeepDate();
          setTimeout(() => this.successMessage.set(null), 3000);
        } else {
          alert(res.message || 'Failed to delete symptom log.');
        }
      }
    });
  }
}
