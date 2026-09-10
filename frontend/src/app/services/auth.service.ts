import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  deleteUser,
  updateProfile,
  user,
  User
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  bloodGroup?: string;
  pregnancyStatus?: boolean;
  notificationsEnabled?: boolean;
  cycleLength?: number;
  periodLength?: number;
  profileComplete?: boolean;
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  // Current reactive user signal
  readonly currentUser = signal<UserProfile | null>(null);
  readonly isAuthReady = signal<boolean>(false);

  // Observable for Firebase Auth user state
  readonly user$ = user(this.auth);

  constructor() {
    // Reactively sync Firebase Auth state with Firestore User Profile
    this.user$.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profileDoc = await this.getProfileSnapshot(firebaseUser.uid);
          if (profileDoc) {
            this.currentUser.set(profileDoc);
          } else {
            // Profile document not yet populated or newly created
            const nameParts = (firebaseUser.displayName || '').split(' ');
            const partialProfile: UserProfile = {
              uid: firebaseUser.uid,
              firstName: nameParts[0] || 'User',
              lastName: nameParts.slice(1).join(' ') || '',
              email: firebaseUser.email || '',
              createdAt: new Date().toISOString()
            };
            this.currentUser.set(partialProfile);
          }
        } catch (e) {
          console.error('Error fetching Firestore user profile:', e);
        }
      } else {
        this.currentUser.set(null);
      }
      this.isAuthReady.set(true);
    });
  }

  isLoggedIn(): boolean {
    return this.auth.currentUser !== null || this.currentUser() !== null;
  }

  get currentFirebaseUser(): User | null {
    return this.auth.currentUser;
  }

  // --- Login with Firebase Authentication ---
  login(credentials: { email: string; password: string }): Observable<{ success: boolean; message: string; user?: UserProfile }> {
    return from(signInWithEmailAndPassword(this.auth, credentials.email, credentials.password)).pipe(
      switchMap(async (credential) => {
        const profile = await this.getProfileSnapshot(credential.user.uid);
        const resolvedUser = profile || {
          uid: credential.user.uid,
          firstName: credential.user.displayName?.split(' ')[0] || 'User',
          lastName: credential.user.displayName?.split(' ').slice(1).join(' ') || '',
          email: credential.user.email || credentials.email,
          createdAt: new Date().toISOString()
        };
        this.currentUser.set(resolvedUser);
        return { success: true, message: 'Login successful', user: resolvedUser };
      }),
      catchError((error) => {
        const friendlyMessage = this.mapAuthErrorMessage(error);
        return of({ success: false, message: friendlyMessage });
      })
    );
  }

  isProfileComplete(profile: UserProfile | null): boolean {
    if (!profile) return false;
    if (profile.profileComplete === true) return true;
    if (profile.profileComplete === false) return false;
    // For legacy profiles where profileComplete was not explicitly recorded:
    return !!(profile.firstName && profile.cycleLength);
  }

  // --- Google Sign-In with Firebase Auth & Firestore Profile ---
  loginWithGoogle(): Observable<{
    success: boolean;
    message: string;
    requiresOnboarding?: boolean;
    user?: UserProfile;
  }> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(async (credential) => {
        const uid = credential.user.uid;
        const existingProfile = await this.getProfileSnapshot(uid);

        // 1. FIRST-TIME GOOGLE USER:
        // users/{uid} does NOT exist in Firestore.
        if (!existingProfile) {
          const fullName = credential.user.displayName || '';
          const nameParts = fullName.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          const initialProfile: UserProfile = {
            uid,
            firstName,
            lastName,
            email: credential.user.email || '',
            photoURL: credential.user.photoURL || undefined,
            profileComplete: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const userDocRef = doc(this.firestore, `users/${uid}`);
          await setDoc(userDocRef, initialProfile);
          this.currentUser.set(initialProfile);

          return {
            success: true,
            message: 'Google authentication successful. Please complete your profile.',
            requiresOnboarding: true,
            user: initialProfile
          };
        }

        // 2. INCOMPLETE PROFILE:
        // Document exists, but onboarding was not finished.
        if (!this.isProfileComplete(existingProfile)) {
          this.currentUser.set(existingProfile);
          return {
            success: true,
            message: 'Please complete your onboarding profile.',
            requiresOnboarding: true,
            user: existingProfile
          };
        }

        // 3. EXISTING COMPLETE GOOGLE USER:
        // Document exists and profile is complete.
        // Do NOT show onboarding. Do NOT overwrite existing profile or period logs.
        this.currentUser.set(existingProfile);
        return {
          success: true,
          message: 'Welcome back!',
          requiresOnboarding: false,
          user: existingProfile
        };
      }),
      catchError((error) => {
        const friendlyMessage = this.mapAuthErrorMessage(error);
        return of({ success: false, message: friendlyMessage });
      })
    );
  }

  // --- Complete Onboarding for Authenticated Google User ---
  completeGoogleOnboarding(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    height?: number;
    weight?: number;
    bloodGroup?: string;
    pregnancyStatus?: boolean;
    notificationsEnabled?: boolean;
    periodStartDate: string;
    cycleLength: number;
    periodLength?: number;
    flow?: string;
    notes?: string;
  }): Observable<{ success: boolean; message: string; user?: UserProfile }> {
    const user = this.auth.currentUser;
    if (!user) {
      return of({ success: false, message: 'No active session found. Please sign in with Google again.' });
    }

    return from(this.executeGoogleOnboarding(user, userData)).pipe(
      catchError((error) => {
        const friendlyMessage = this.mapAuthErrorMessage(error);
        return of({ success: false, message: friendlyMessage });
      })
    );
  }

  private async executeGoogleOnboarding(
    user: User,
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      dateOfBirth?: string;
      height?: number;
      weight?: number;
      bloodGroup?: string;
      pregnancyStatus?: boolean;
      notificationsEnabled?: boolean;
      periodStartDate: string;
      cycleLength: number;
      periodLength?: number;
      flow?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    const uid = user.uid;
    const existingProfile = await this.getProfileSnapshot(uid);

    const cycleLen = Number(userData.cycleLength) || 28;
    const periodLen = Number(userData.periodLength) || 5;

    // 1. Calculate end date for initial period log
    let calculatedEndDate: string | null = null;
    if (userData.periodStartDate && periodLen > 0) {
      const parts = userData.periodStartDate.split('-').map(Number);
      if (parts.length === 3) {
        const startD = new Date(parts[0], parts[1] - 1, parts[2]);
        startD.setDate(startD.getDate() + periodLen - 1);
        const y = startD.getFullYear();
        const m = String(startD.getMonth() + 1).padStart(2, '0');
        const d = String(startD.getDate()).padStart(2, '0');
        calculatedEndDate = `${y}-${m}-${d}`;
      }
    }

    // 2. Safely check for existing period logs so existing data is NEVER overwritten
    const periodLogColRef = collection(this.firestore, `users/${uid}/period_logs`);
    let hasExistingPeriodLogs = false;
    try {
      const periodSnap = await getDocs(periodLogColRef);
      hasExistingPeriodLogs = !periodSnap.empty;
    } catch (e) {
      console.warn('Could not inspect existing period logs:', e);
    }

    if (!hasExistingPeriodLogs && userData.periodStartDate) {
      const initialPeriodPayload = {
        periodStartDate: userData.periodStartDate,
        periodEndDate: calculatedEndDate,
        flow: userData.flow || 'MEDIUM',
        notes: userData.notes?.trim() || null,
        cycleLength: cycleLen,
        periodLength: periodLen,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addDoc(periodLogColRef, initialPeriodPayload);
    }

    // 3. Persist complete profile document to Firestore users/{uid}
    const profile: UserProfile = {
      uid,
      firstName: userData.firstName.trim() || user.displayName?.split(' ')[0] || 'User',
      lastName: userData.lastName.trim() || user.displayName?.split(' ').slice(1).join(' ') || '',
      email: user.email || userData.email.trim(),
      pregnancyStatus: !!userData.pregnancyStatus,
      notificationsEnabled: userData.notificationsEnabled !== false,
      cycleLength: cycleLen,
      periodLength: periodLen,
      profileComplete: true,
      photoURL: user.photoURL || existingProfile?.photoURL || undefined,
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (userData.phone?.trim()) profile.phone = userData.phone.trim();
    else if (existingProfile?.phone) profile.phone = existingProfile.phone;

    if (userData.dateOfBirth) profile.dateOfBirth = userData.dateOfBirth;
    else if (existingProfile?.dateOfBirth) profile.dateOfBirth = existingProfile.dateOfBirth;

    if (userData.height != null) profile.height = userData.height;
    else if (existingProfile?.height != null) profile.height = existingProfile.height;

    if (userData.weight != null) profile.weight = userData.weight;
    else if (existingProfile?.weight != null) profile.weight = existingProfile.weight;

    if (userData.bloodGroup) profile.bloodGroup = userData.bloodGroup;
    else if (existingProfile?.bloodGroup) profile.bloodGroup = existingProfile.bloodGroup;

    const userDocRef = doc(this.firestore, `users/${uid}`);
    await setDoc(userDocRef, profile);

    this.currentUser.set(profile);
    return { success: true, message: 'Onboarding completed successfully', user: profile };
  }

  // --- Register with Firebase Auth & Firestore Profile ---
  register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    dateOfBirth?: string;
    height?: number;
    weight?: number;
    bloodGroup?: string;
    pregnancyStatus?: boolean;
    notificationsEnabled?: boolean;
    periodStartDate: string;
    cycleLength: number;
    periodLength?: number;
    flow?: string;
    notes?: string;
  }): Observable<{ success: boolean; message: string; user?: UserProfile }> {
    return from(createUserWithEmailAndPassword(this.auth, userData.email, userData.password)).pipe(
      switchMap(async (credential) => {
        const uid = credential.user.uid;
        const displayName = `${userData.firstName.trim()} ${userData.lastName.trim()}`.trim();

        // 1. Update Firebase Auth displayName
        try {
          await updateProfile(credential.user, { displayName });
        } catch (err) {
          console.warn('Could not update Firebase displayName:', err);
        }

        const cycleLen = Number(userData.cycleLength) || 28;
        const periodLen = Number(userData.periodLength) || 5;

        // 2. Persist comprehensive user profile to Firestore users/{uid}
        const profile: UserProfile = {
          uid,
          firstName: userData.firstName.trim(),
          lastName: userData.lastName.trim(),
          email: userData.email.trim(),
          pregnancyStatus: !!userData.pregnancyStatus,
          notificationsEnabled: userData.notificationsEnabled !== false,
          cycleLength: cycleLen,
          periodLength: periodLen,
          profileComplete: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (userData.phone?.trim()) profile.phone = userData.phone.trim();
        if (userData.dateOfBirth) profile.dateOfBirth = userData.dateOfBirth;
        if (userData.height != null) profile.height = userData.height;
        if (userData.weight != null) profile.weight = userData.weight;
        if (userData.bloodGroup) profile.bloodGroup = userData.bloodGroup;

        const userDocRef = doc(this.firestore, `users/${uid}`);
        await setDoc(userDocRef, profile);

        // 3. Persist initial genuine period log to users/{uid}/period_logs/{periodId}
        let calculatedEndDate: string | null = null;
        if (userData.periodStartDate && periodLen > 0) {
          const parts = userData.periodStartDate.split('-').map(Number);
          if (parts.length === 3) {
            const startD = new Date(parts[0], parts[1] - 1, parts[2]);
            startD.setDate(startD.getDate() + periodLen - 1);
            const y = startD.getFullYear();
            const m = String(startD.getMonth() + 1).padStart(2, '0');
            const d = String(startD.getDate()).padStart(2, '0');
            calculatedEndDate = `${y}-${m}-${d}`;
          }
        }

        const periodLogColRef = collection(this.firestore, `users/${uid}/period_logs`);
        const initialPeriodPayload = {
          periodStartDate: userData.periodStartDate,
          periodEndDate: calculatedEndDate,
          flow: userData.flow || 'MEDIUM',
          notes: userData.notes?.trim() || null,
          cycleLength: cycleLen,
          periodLength: periodLen,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        try {
          await addDoc(periodLogColRef, initialPeriodPayload);
        } catch (periodErr: any) {
          console.error('Failed to create initial period log in Firestore:', periodErr);
          throw new Error('Account was registered, but initializing period tracking data failed: ' + (periodErr?.message || 'Firestore write error'));
        }

        this.currentUser.set(profile);
        return { success: true, message: 'Registration successful', user: profile };
      }),
      catchError((error) => {
        const friendlyMessage = this.mapAuthErrorMessage(error);
        return of({ success: false, message: friendlyMessage });
      })
    );
  }

  // --- Sign Out ---
  logout(): Observable<{ success: boolean; message: string }> {
    return from(signOut(this.auth)).pipe(
      tap(() => {
        this.currentUser.set(null);
      }),
      map(() => ({ success: true, message: 'Logged out successfully' })),
      catchError((err) => of({ success: false, message: err.message || 'Logout failed' }))
    );
  }

  // --- Password Reset ---
  forgotPassword(email: string): Observable<{ success: boolean; message: string }> {
    return from(sendPasswordResetEmail(this.auth, email)).pipe(
      map(() => ({ success: true, message: 'Password reset link sent to your email.' })),
      catchError((error) => of({ success: false, message: this.mapAuthErrorMessage(error) }))
    );
  }

  resetPassword(data: { email?: string; token: string; newPassword: string }): Observable<{ success: boolean; message: string }> {
    return from(confirmPasswordReset(this.auth, data.token, data.newPassword)).pipe(
      map(() => ({ success: true, message: 'Password has been reset successfully.' })),
      catchError((error) => of({ success: false, message: this.mapAuthErrorMessage(error) }))
    );
  }

  // --- Change Password ---
  changePassword(newPassword: string): Observable<{ success: boolean; message: string }> {
    const user = this.auth.currentUser;
    if (!user) {
      return of({ success: false, message: 'No active user found. Please log in again.' });
    }

    return from(updatePassword(user, newPassword)).pipe(
      map(() => ({ success: true, message: 'Password updated successfully' })),
      catchError((error) => of({ success: false, message: this.mapAuthErrorMessage(error) }))
    );
  }

  // --- Profile Retrieval & Updating ---
  async getProfileSnapshot(uid: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (e) {
      console.error('getProfileSnapshot error:', e);
      return null;
    }
  }

  getProfile(): Observable<{ success: boolean; data: UserProfile | null; message?: string }> {
    const user = this.auth.currentUser;
    if (!user) {
      return of({ success: false, data: null, message: 'Not authenticated' });
    }

    return from(this.getProfileSnapshot(user.uid)).pipe(
      map((profile) => ({ success: true, data: profile })),
      catchError((err) => of({ success: false, data: null, message: err.message }))
    );
  }

  updateProfile(profileData: Partial<UserProfile>): Observable<{ success: boolean; data?: UserProfile; message?: string }> {
    const user = this.auth.currentUser;
    if (!user) {
      return of({ success: false, message: 'Not authenticated' });
    }

    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    const cleanFields: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };
    for (const [key, value] of Object.entries(profileData)) {
      if (value !== undefined) {
        cleanFields[key] = value;
      }
    }

    return from(updateDoc(userDocRef, cleanFields)).pipe(
      map(() => {
        const merged = { ...this.currentUser(), ...cleanFields } as UserProfile;
        this.currentUser.set(merged);
        return { success: true, data: merged, message: 'Profile updated successfully' };
      }),
      catchError((err) => of({ success: false, message: err.message || 'Failed to update profile' }))
    );
  }

  // --- Delete Account ---
  deleteAccount(): Observable<{ success: boolean; message: string }> {
    const user = this.auth.currentUser;
    if (!user) {
      return of({ success: false, message: 'No active session found.' });
    }

    const uid = user.uid;
    const userDocRef = doc(this.firestore, `users/${uid}`);

    // Delete Firestore profile first, then delete Auth account
    return from(deleteDoc(userDocRef)).pipe(
      switchMap(() => from(deleteUser(user))),
      tap(() => {
        this.currentUser.set(null);
      }),
      map(() => ({ success: true, message: 'Account deleted successfully' })),
      catchError((err) => of({ success: false, message: this.mapAuthErrorMessage(err) }))
    );
  }

  private mapAuthErrorMessage(error: any): string {
    const code = error?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please verify your credentials.';
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please sign in instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please provide a valid email address.';
      case 'auth/requires-recent-login':
        return 'This operation requires recent authentication. Please sign out and sign back in to continue.';
      case 'auth/too-many-requests':
        return 'Access temporarily blocked due to many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network connection issue. Please check your internet connection.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in window was closed before completion.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in popup request was cancelled.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
      default:
        return error?.message || 'An error occurred during authentication.';
    }
  }
}
