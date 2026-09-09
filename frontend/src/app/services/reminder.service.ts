import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

export interface MedicineReminder {
  id?: string;
  medicineName: string;
  dosage?: string;
  time: string; // "HH:mm"
  frequency?: string; // "DAILY", "WEEKLY", etc.
  startDate: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD"
  completed?: boolean;
  createdAt?: string;
}

export interface WaterProgress {
  id?: string;
  goal: number;
  completed: number;
  date: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  // --- Medicine Reminders in Firestore ---
  getReminders(): Observable<MedicineReminder[]> {
    return user(this.auth).pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser) return of([]);
        const colRef = collection(this.firestore, `users/${firebaseUser.uid}/reminders`);
        return collectionData(colRef, { idField: 'id' }) as Observable<MedicineReminder[]>;
      }),
      catchError((err) => {
        console.error('Error fetching reminders from Firestore:', err);
        return of([]);
      })
    );
  }

  saveReminder(reminder: MedicineReminder): Observable<{ success: boolean; id?: string; message?: string }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return of({ success: false, message: 'User not authenticated' });

    const payload = {
      medicineName: reminder.medicineName.trim(),
      dosage: reminder.dosage?.trim() || null,
      time: reminder.time || '08:00',
      frequency: reminder.frequency || 'DAILY',
      startDate: reminder.startDate || new Date().toISOString().split('T')[0],
      endDate: reminder.endDate || null,
      completed: false,
      createdAt: new Date().toISOString()
    };

    const colRef = collection(this.firestore, `users/${firebaseUser.uid}/reminders`);
    return from(addDoc(colRef, payload)).pipe(
      map((ref) => ({ success: true, id: ref.id })),
      catchError((err) => of({ success: false, message: err.message }))
    );
  }

  updateReminder(id: string, reminder: Partial<MedicineReminder>): Observable<{ success: boolean; message?: string }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return of({ success: false, message: 'User not authenticated' });

    const docRef = doc(this.firestore, `users/${firebaseUser.uid}/reminders/${id}`);
    return from(updateDoc(docRef, reminder as any)).pipe(
      map(() => ({ success: true })),
      catchError((err) => of({ success: false, message: err.message }))
    );
  }

  deleteReminder(id: string): Observable<{ success: boolean; message?: string }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return of({ success: false, message: 'User not authenticated' });

    const docRef = doc(this.firestore, `users/${firebaseUser.uid}/reminders/${id}`);
    return from(deleteDoc(docRef)).pipe(
      map(() => ({ success: true })),
      catchError((err) => of({ success: false, message: err.message }))
    );
  }

  completeReminder(id: string, completed: boolean): Observable<{ success: boolean; message?: string }> {
    return this.updateReminder(id, { completed });
  }

  // --- Water Tracking in Firestore users/{uid}/water/{dateStr} ---
  getWaterToday(dateStr?: string): Observable<WaterProgress> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    return user(this.auth).pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser) {
          return of({ goal: 2500, completed: 0, date: targetDate });
        }
        const docRef = doc(this.firestore, `users/${firebaseUser.uid}/water/${targetDate}`);
        return (docData(docRef, { idField: 'id' }) as Observable<WaterProgress | undefined>).pipe(
          map((data) => data || { goal: 2500, completed: 0, date: targetDate })
        );
      }),
      catchError(() => of({ goal: 2500, completed: 0, date: targetDate }))
    );
  }

  addWater(amount: number, dateStr?: string): Observable<{ success: boolean; data?: WaterProgress; message?: string }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return of({ success: false, message: 'User not authenticated' });

    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const docRef = doc(this.firestore, `users/${firebaseUser.uid}/water/${targetDate}`);

    return from(getDoc(docRef)).pipe(
      switchMap((snap) => {
        const currentData = snap.exists() ? (snap.data() as WaterProgress) : { goal: 2500, completed: 0, date: targetDate };
        const newCompleted = Math.min((currentData.completed || 0) + amount, 6000);
        const updated: WaterProgress = {
          goal: currentData.goal || 2500,
          completed: newCompleted,
          date: targetDate,
          updatedAt: new Date().toISOString()
        };
        return from(setDoc(docRef, updated, { merge: true })).pipe(
          map(() => ({ success: true, data: updated }))
        );
      }),
      catchError((err) => of({ success: false, message: err.message }))
    );
  }

  updateWaterGoal(goal: number, dateStr?: string): Observable<{ success: boolean; message?: string }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return of({ success: false, message: 'User not authenticated' });

    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const docRef = doc(this.firestore, `users/${firebaseUser.uid}/water/${targetDate}`);

    return from(setDoc(docRef, { goal, updatedAt: new Date().toISOString() }, { merge: true })).pipe(
      map(() => ({ success: true })),
      catchError((err) => of({ success: false, message: err.message }))
    );
  }
}
