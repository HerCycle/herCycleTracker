import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

export interface SelfCareVideo {
  id: string;
  videoId: string;
  title: string;
  channel?: string;
  description?: string;
  category: 'Exercise' | 'Nutrition' | 'Hygiene';
  youtubeUrl: string;
  thumbnailUrl: string;
  active: boolean;
  displayOrder: number;
}

// Backward compatibility aliases
export type Video = SelfCareVideo;

@Injectable({
  providedIn: 'root'
})
export class SelfCareService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  /**
   * Retrieves all active self-care videos directly from Firestore 'selfCareVideos' collection.
   * Performs active filtering and displayOrder sorting in TypeScript to avoid composite index requirements.
   */
  getVideos(): Observable<SelfCareVideo[]> {
    try {
      const colRef = collection(this.firestore, 'selfCareVideos');
      return (collectionData(colRef, { idField: 'id' }) as Observable<SelfCareVideo[]>).pipe(
        map((videos) => {
          const active = (videos || []).filter(
            (v) =>
              (v.active === true || (v.active as any) === 'true') &&
              v.title &&
              v.title.trim() !== '' &&
              v.title.trim().toLowerCase() !== 'self care video' &&
              v.thumbnailUrl &&
              !v.thumbnailUrl.includes('placeholder')
          );
          return active.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
        }),
        catchError((err) => {
          console.error('SelfCareService error fetching videos from Firestore:', err);
          return of([]);
        })
      );
    } catch (err) {
      console.error('SelfCareService initialization error:', err);
      return of([]);
    }
  }

  /**
   * Retrieves active self-care videos filtered by category.
   * If category is empty or 'ALL', all active videos are returned.
   */
  getVideosByCategory(category: string): Observable<SelfCareVideo[]> {
    return this.getVideos().pipe(
      map((videos) => {
        if (!category || category === 'ALL') return videos;
        return videos.filter((v) => (v.category || '').toLowerCase() === category.toLowerCase());
      })
    );
  }

  /**
   * Searches active videos by matching text in title, channel, description, or category.
   */
  searchVideos(query: string): Observable<SelfCareVideo[]> {
    const q = (query || '').toLowerCase().trim();
    return this.getVideos().pipe(
      map((videos) => {
        if (!q) return videos;
        return videos.filter(
          (v) =>
            (v.title || '').toLowerCase().includes(q) ||
            (v.channel || '').toLowerCase().includes(q) ||
            (v.description || '').toLowerCase().includes(q) ||
            (v.category || '').toLowerCase().includes(q)
        );
      })
    );
  }

  // --- User Bookmarks stored in Firestore: users/{uid}/bookmarks/{videoId} ---
  getBookmarkedIds(): Observable<string[]> {
    return user(this.auth).pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser) return of([]);
        const colRef = collection(this.firestore, `users/${firebaseUser.uid}/bookmarks`);
        return (collectionData(colRef, { idField: 'id' }) as Observable<{ id: string; videoId?: string | number }[]>).pipe(
          map((docs) => docs.map((d) => String(d.videoId || d.id)))
        );
      }),
      catchError(() => of([]))
    );
  }

  bookmarkVideo(videoId: string | number): Observable<{ success: boolean }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return of({ success: false });

    const key = String(videoId);
    const docRef = doc(this.firestore, `users/${firebaseUser.uid}/bookmarks/${key}`);
    return from(setDoc(docRef, { videoId: key, bookmarkedAt: new Date().toISOString() })).pipe(
      map(() => ({ success: true })),
      catchError(() => of({ success: false }))
    );
  }

  unbookmarkVideo(videoId: string | number): Observable<{ success: boolean }> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return of({ success: false });

    const key = String(videoId);
    const docRef = doc(this.firestore, `users/${firebaseUser.uid}/bookmarks/${key}`);
    return from(deleteDoc(docRef)).pipe(
      map(() => ({ success: true })),
      catchError(() => of({ success: false }))
    );
  }
}
