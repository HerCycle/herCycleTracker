import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

export interface SymptomLog {
  id?: string;
  date: string;
  mood?: string;
  pain?: number;
  cramps?: boolean;
  headache?: boolean;
  backPain?: boolean;
  bloating?: boolean;
  acne?: boolean;
  fatigue?: boolean;
  nausea?: boolean;
  cravings?: boolean;
  breastPain?: boolean;
  sleep?: number;
  energy?: number;
  waterIntake?: number;
  temperature?: number;
  weight?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SymptomService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  // Observable of all symptom logs for the authenticated user from Firestore
  getSymptomHistory(): Observable<SymptomLog[]> {
    return user(this.auth).pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser) return of([]);
        const colRef = collection(this.firestore, `users/${firebaseUser.uid}/symptoms`);
        const q = query(colRef, orderBy('date', 'desc'));
        return collectionData(q, { idField: 'id' }) as Observable<SymptomLog[]>;
      }),
      catchError((err) => {
        console.error('Error fetching symptoms from Firestore:', err);
        return of([]);
      })
    );
  }

  saveSymptoms(request: SymptomLog): Observable<{ success: boolean; id?: string; message?: string }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return of({ success: false, message: 'User not authenticated' });

    const payload = {
      date: request.date || new Date().toISOString().split('T')[0],
      mood: request.mood || 'CALM',
      pain: Number(request.pain) || 0,
      cramps: !!request.cramps,
      headache: !!request.headache,
      backPain: !!request.backPain,
      bloating: !!request.bloating,
      acne: !!request.acne,
      fatigue: !!request.fatigue,
      nausea: !!request.nausea,
      cravings: !!request.cravings,
      breastPain: !!request.breastPain,
      sleep: request.sleep ?? null,
      energy: request.energy ?? null,
      waterIntake: request.waterIntake ?? null,
      temperature: request.temperature ?? null,
      weight: request.weight ?? null,
      notes: request.notes?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const colRef = collection(this.firestore, `users/${firebaseUser.uid}/symptoms`);
    return from(addDoc(colRef, payload)).pipe(
      map((ref) => ({ success: true, id: ref.id })),
      catchError((err) => of({ success: false, message: err.message }))
    );
  }

  updateSymptoms(id: string, request: Partial<SymptomLog>): Observable<{ success: boolean; message?: string }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return of({ success: false, message: 'User not authenticated' });

    const docRef = doc(this.firestore, `users/${firebaseUser.uid}/symptoms/${id}`);
    const payload = {
      ...request,
      updatedAt: new Date().toISOString()
    };

    return from(updateDoc(docRef, payload as any)).pipe(
      map(() => ({ success: true })),
      catchError((err) => of({ success: false, message: err.message }))
    );
  }

  deleteSymptoms(id: string): Observable<{ success: boolean; message?: string }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return of({ success: false, message: 'User not authenticated' });

    const docRef = doc(this.firestore, `users/${firebaseUser.uid}/symptoms/${id}`);
    return from(deleteDoc(docRef)).pipe(
      map(() => ({ success: true })),
      catchError((err) => of({ success: false, message: err.message }))
    );
  }
}
