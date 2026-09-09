import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface UserFeedback {
  id?: string;
  rating: number;
  message: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  submitFeedback(feedback: { rating: number; message: string }): Observable<{ success: boolean; message?: string }> {
    const user = this.auth.currentUser;
    const payload: UserFeedback = {
      rating: feedback.rating,
      message: feedback.message.trim(),
      userId: user?.uid || 'anonymous',
      userEmail: user?.email || 'anonymous',
      userName: user?.displayName || 'HerCycle Member',
      createdAt: new Date().toISOString()
    };

    const colRef = collection(this.firestore, 'feedback');
    return from(addDoc(colRef, payload)).pipe(
      map(() => ({ success: true })),
      catchError((err) => of({ success: false, message: err.message || 'Failed to submit feedback' }))
    );
  }
}
