import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SymptomService, SymptomLog } from '../../../services/symptom.service';

const DEFAULT_SYMPTOM_LOGS: SymptomLog[] = [
  {
    id: 1,
    date: new Date().toISOString().split('T')[0],
    mood: 'CALM',
    pain: 5,
    energy: 7,
    sleep: 7.5,
    waterIntake: 2.0,
    temperature: 36.6,
    weight: 58.5,
    cramps: true,
    headache: false,
    backPain: true,
    bloating: false,
    acne: false,
    fatigue: true,
    nausea: false,
    cravings: false,
    breastPain: false,
    notes: 'Feeling calm today, mild lower back tightness. Herbal tea helped.'
  },
  {
    id: 2,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    mood: 'TIRED',
    pain: 6,
    energy: 4,
    sleep: 6.0,
    waterIntake: 1.5,
    cramps: true,
    headache: true,
    backPain: false,
    bloating: true,
    acne: true,
    fatigue: true,
    nausea: false,
    cravings: true,
    breastPain: false,
    notes: 'Day 1 of cycle. Resting with heating patch.'
  }
];

@Component({
  selector: 'app-symptoms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './symptoms.html',
  styleUrl: './symptoms.scss'
})
export class SymptomsPage implements OnInit {
  private readonly symptomService = inject(SymptomService);

  readonly history = signal<SymptomLog[]>([]);
  readonly selectedDate = signal(new Date().toISOString().split('T')[0]);

  // Form Fields State
  readonly logId = signal<number | null>(null);
  readonly mood = signal('CALM');
  readonly pain = signal(5);
  readonly energy = signal(7);
  readonly sleep = signal(7.5);
  readonly waterIntake = signal(2.0);
  readonly temperature = signal<number | null>(36.6);
  readonly weight = signal<number | null>(58.5);
  readonly notes = signal('');

  // Checkboxes
  readonly cramps = signal(true);
  readonly headache = signal(false);
  readonly backPain = signal(true);
  readonly bloating = signal(false);
  readonly acne = signal(false);
  readonly fatigue = signal(true);
  readonly nausea = signal(false);
  readonly cravings = signal(false);
  readonly breastPain = signal(false);

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isSaving = signal(false);

  ngOnInit(): void {
    this.loadHistory();
    this.loadDateLog();
  }

  loadHistory(): void {
    const saved = localStorage.getItem('hc_symptom_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.history.set(parsed);
        } else {
          this.history.set(DEFAULT_SYMPTOM_LOGS);
          this.saveLocalHistory(DEFAULT_SYMPTOM_LOGS);
        }
      } catch (e) {
        this.history.set(DEFAULT_SYMPTOM_LOGS);
      }
    } else {
      this.history.set(DEFAULT_SYMPTOM_LOGS);
      this.saveLocalHistory(DEFAULT_SYMPTOM_LOGS);
    }

    // Try backend load
    this.symptomService.getSymptomHistory().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.history.set(res.data);
          this.saveLocalHistory(res.data);
        }
      }
    });
  }

  saveLocalHistory(list: SymptomLog[]): void {
    localStorage.setItem('hc_symptom_history', JSON.stringify(list));
  }

  loadDateLog(): void {
    const dateStr = this.selectedDate();
    const existing = this.history().find(h => h.date === dateStr);

    if (existing) {
      this.selectHistoryLog(existing);
      return;
    }

    // Try backend
    this.symptomService.getSymptomLog(dateStr).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.selectHistoryLog(res.data);
        } else {
          this.resetFormKeepDate();
        }
      },
      error: () => {
        this.resetFormKeepDate();
      }
    });
  }

  onDateChange(newDate: string): void {
    this.selectedDate.set(newDate);
    this.loadDateLog();
  }

  resetFormKeepDate(): void {
    this.logId.set(null);
    this.mood.set('HAPPY');
    this.pain.set(0);
    this.energy.set(7);
    this.sleep.set(7);
    this.waterIntake.set(0.0);
    this.temperature.set(null);
    this.weight.set(null);
    this.notes.set('');

    this.cramps.set(false);
    this.headache.set(false);
    this.backPain.set(false);
    this.bloating.set(false);
    this.acne.set(false);
    this.fatigue.set(false);
    this.nausea.set(false);
    this.cravings.set(false);
    this.breastPain.set(false);
  }

  saveLog(): void {
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const payload: SymptomLog = {
      id: this.logId() || Date.now(),
      date: this.selectedDate(),
      mood: this.mood(),
      pain: this.pain(),
      energy: this.energy(),
      sleep: this.sleep(),
      waterIntake: this.waterIntake(),
      temperature: this.temperature() || undefined,
      weight: this.weight() || undefined,
      notes: this.notes() || undefined,
      cramps: this.cramps(),
      headache: this.headache(),
      backPain: this.backPain(),
      bloating: this.bloating(),
      acne: this.acne(),
      fatigue: this.fatigue(),
      nausea: this.nausea(),
      cravings: this.cravings(),
      breastPain: this.breastPain()
    };

    const currentHistory = this.history();
    const existingIndex = currentHistory.findIndex(h => h.date === payload.date || (payload.id && h.id === payload.id));

    let updatedHistory: SymptomLog[];
    if (existingIndex >= 0) {
      updatedHistory = [...currentHistory];
      updatedHistory[existingIndex] = payload;
    } else {
      updatedHistory = [payload, ...currentHistory];
    }

    this.history.set(updatedHistory);
    this.saveLocalHistory(updatedHistory);
    this.logId.set(payload.id || null);
    this.isSaving.set(false);

    this.successMessage.set(`Symptom log for ${payload.date} saved successfully!`);
    setTimeout(() => this.successMessage.set(null), 3500);

    // Sync backend
    const id = this.logId();
    const req = id 
      ? this.symptomService.updateSymptoms(id, payload)
      : this.symptomService.saveSymptoms(payload);

    req.subscribe();
  }

  deleteLog(id?: number): void {
    if (!id || !confirm('Are you sure you want to delete this symptom log?')) return;

    const updated = this.history().filter(h => h.id !== id);
    this.history.set(updated);
    this.saveLocalHistory(updated);

    if (id === this.logId()) {
      this.resetFormKeepDate();
    }

    this.symptomService.deleteSymptoms(id).subscribe();
  }

  selectHistoryLog(log: SymptomLog): void {
    this.selectedDate.set(log.date);
    this.logId.set(log.id || null);
    this.mood.set(log.mood || 'HAPPY');
    this.pain.set(log.pain || 0);
    this.energy.set(log.energy || 7);
    this.sleep.set(log.sleep || 7);
    this.waterIntake.set(log.waterIntake || 0.0);
    this.temperature.set(log.temperature || null);
    this.weight.set(log.weight || null);
    this.notes.set(log.notes || '');

    this.cramps.set(log.cramps || false);
    this.headache.set(log.headache || false);
    this.backPain.set(log.backPain || false);
    this.bloating.set(log.bloating || false);
    this.acne.set(log.acne || false);
    this.fatigue.set(log.fatigue || false);
    this.nausea.set(log.nausea || false);
    this.cravings.set(log.cravings || false);
    this.breastPain.set(log.breastPain || false);
  }
}

