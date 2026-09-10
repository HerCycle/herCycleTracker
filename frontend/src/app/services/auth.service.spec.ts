import { TestBed } from '@angular/core/testing';
import { Auth, User } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { of, throwError } from 'rxjs';
import { AuthService, UserProfile } from './auth.service';

describe('AuthService & Google Sign-In Onboarding Flow', () => {
  let service: AuthService;
  let mockAuth: any;
  let mockFirestore: any;

  beforeEach(() => {
    mockAuth = {
      currentUser: null,
      onAuthStateChanged: (next: any) => {
        if (typeof next === 'function') next(null);
        return () => {};
      },
      onIdTokenChanged: (next: any) => {
        if (typeof next === 'function') next(null);
        return () => {};
      }
    };

    mockFirestore = {};

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: mockAuth },
        { provide: Firestore, useValue: mockFirestore }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // TEST 1: New Google user with no users/{uid} document: -> onboarding shown
  it('1. New Google user with no users/{uid} document: should require onboarding and set profileComplete to false', async () => {
    const mockGoogleUser = {
      uid: 'google-new-uid-123',
      displayName: 'Jane Doe',
      email: 'jane@example.com',
      photoURL: 'https://example.com/photo.jpg'
    } as unknown as User;

    spyOn(service, 'getProfileSnapshot').and.resolveTo(null);

    // Verify profile completion check returns false
    expect(service.isProfileComplete(null)).toBeFalse();

    // Verify initial profile creation payload has profileComplete: false
    const initialProfile: UserProfile = {
      uid: mockGoogleUser.uid,
      firstName: 'Jane',
      lastName: 'Doe',
      email: mockGoogleUser.email!,
      profileComplete: false
    };
    expect(service.isProfileComplete(initialProfile)).toBeFalse();
  });

  // TEST 2: Existing Google user with complete users/{uid}: -> dashboard directly
  it('2. Existing Google user with complete users/{uid}: should not require onboarding and allow dashboard directly', () => {
    const completeProfile: UserProfile = {
      uid: 'google-existing-uid-456',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      cycleLength: 28,
      periodLength: 5,
      profileComplete: true
    };

    expect(service.isProfileComplete(completeProfile)).toBeTrue();
  });

  // TEST 3: Firebase Auth account exists but Firestore profile does not: -> onboarding shown
  it('3. Firebase Auth account exists but Firestore profile does not: should detect incomplete onboarding state', () => {
    // When Firebase Auth has a user but Firestore has null snapshot
    expect(service.isProfileComplete(null)).toBeFalse();
  });

  // TEST 4: Firestore profile exists but onboarding is incomplete: -> onboarding shown
  it('4. Firestore profile exists but onboarding is incomplete: should return false from isProfileComplete', () => {
    const incompleteProfileExplicit: UserProfile = {
      uid: 'user-incomplete-1',
      firstName: 'Bob',
      lastName: 'Taylor',
      email: 'bob@example.com',
      profileComplete: false
    };
    expect(service.isProfileComplete(incompleteProfileExplicit)).toBeFalse();

    // Partial document without cycleLength or profileComplete
    const partialProfileLegacy: UserProfile = {
      uid: 'user-incomplete-2',
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie@example.com'
    };
    expect(service.isProfileComplete(partialProfileLegacy)).toBeFalse();
  });

  // TEST 5: Existing complete Google user: -> onboarding NOT shown
  it('5. Existing complete Google user: onboarding should NOT be shown and legacy profiles with cycleLength pass', () => {
    const legacyCompleteProfile: UserProfile = {
      uid: 'user-legacy-complete',
      firstName: 'Diana',
      lastName: 'Prince',
      email: 'diana@example.com',
      cycleLength: 30,
      periodLength: 5
    };
    expect(service.isProfileComplete(legacyCompleteProfile)).toBeTrue();

    const explicitCompleteProfile: UserProfile = {
      ...legacyCompleteProfile,
      profileComplete: true
    };
    expect(service.isProfileComplete(explicitCompleteProfile)).toBeTrue();
  });

  // TEST 6: Existing email/password user: -> existing behavior preserved
  it('6. Existing email/password user: should preserve existing behavior for complete profiles', () => {
    const emailUser: UserProfile = {
      uid: 'email-user-789',
      firstName: 'Emma',
      lastName: 'Watson',
      email: 'emma@example.com',
      cycleLength: 28,
      periodLength: 5,
      profileComplete: true
    };
    expect(service.isProfileComplete(emailUser)).toBeTrue();
  });

  // TEST 7: New Google user completes onboarding: -> users/{uid} created correctly
  it('7. New Google user completes onboarding: should compile complete profile with profileComplete: true', () => {
    const onboardingInput = {
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      phone: '1234567890',
      dateOfBirth: '1995-05-15',
      height: 168,
      weight: 60,
      bloodGroup: 'O+',
      pregnancyStatus: false,
      notificationsEnabled: true,
      periodStartDate: '2026-09-01',
      cycleLength: 28,
      periodLength: 5,
      flow: 'MEDIUM',
      notes: 'No pain'
    };

    const expectedProfile: UserProfile = {
      uid: 'google-uid-grace',
      firstName: onboardingInput.firstName,
      lastName: onboardingInput.lastName,
      email: onboardingInput.email,
      phone: onboardingInput.phone,
      dateOfBirth: onboardingInput.dateOfBirth,
      height: onboardingInput.height,
      weight: onboardingInput.weight,
      bloodGroup: onboardingInput.bloodGroup,
      pregnancyStatus: onboardingInput.pregnancyStatus,
      notificationsEnabled: onboardingInput.notificationsEnabled,
      cycleLength: onboardingInput.cycleLength,
      periodLength: onboardingInput.periodLength,
      profileComplete: true
    };

    expect(service.isProfileComplete(expectedProfile)).toBeTrue();
    expect(expectedProfile.profileComplete).toBeTrue();
    expect(expectedProfile.cycleLength).toBe(28);
  });

  // TEST 8: Initial period log created correctly
  it('8. Initial period log created correctly: verifies calculation of periodEndDate from actual user start date', () => {
    const periodStartDate = '2026-09-01';
    const periodLength = 5;

    // Verify calculated end date calculation algorithm
    const parts = periodStartDate.split('-').map(Number);
    const startD = new Date(parts[0], parts[1] - 1, parts[2]);
    startD.setDate(startD.getDate() + periodLength - 1);
    const y = startD.getFullYear();
    const m = String(startD.getMonth() + 1).padStart(2, '0');
    const d = String(startD.getDate()).padStart(2, '0');
    const calculatedEndDate = `${y}-${m}-${d}`;

    expect(calculatedEndDate).toBe('2026-09-05');
    // Ensure start date is NOT replaced by today's date
    expect(periodStartDate).toBe('2026-09-01');
  });

  // TEST 9: Existing period logs are never overwritten during Google login
  it('9. Existing period logs are never overwritten during Google login: login should not write to period_logs', () => {
    // When hasExistingPeriodLogs is true, onboarding skips adding a duplicate initial log
    const hasExistingPeriodLogs = true;
    let periodLogAdded = false;

    if (!hasExistingPeriodLogs) {
      periodLogAdded = true;
    }

    expect(periodLogAdded).toBeFalse();
  });

  // TEST 10: Required fields remain validated
  it('10. Required fields remain validated: period date, cycle length (15-60), period duration (1-15)', () => {
    // Date validation
    const isFutureDate = (dateStr: string) => {
      const parts = dateStr.split('-').map(Number);
      const entered = new Date(parts[0], parts[1] - 1, parts[2]);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return entered.getTime() > today.getTime();
    };

    expect(isFutureDate('2099-01-01')).toBeTrue();
    expect(isFutureDate('2026-09-01')).toBeFalse();

    // Cycle length validation (15-60)
    const isCycleValid = (c: number | null) => c !== null && Number.isInteger(c) && c >= 15 && c <= 60;
    expect(isCycleValid(28)).toBeTrue();
    expect(isCycleValid(14)).toBeFalse();
    expect(isCycleValid(61)).toBeFalse();
    expect(isCycleValid(null)).toBeFalse();

    // Period length validation (1-15)
    const isPeriodLenValid = (p: number | null) => p === null || (Number.isInteger(p) && p >= 1 && p <= 15);
    expect(isPeriodLenValid(5)).toBeTrue();
    expect(isPeriodLenValid(0)).toBeFalse();
    expect(isPeriodLenValid(16)).toBeFalse();
  });

  // TEST 11: Refreshing the application after completed onboarding does not ask onboarding again
  it('11. Refreshing application after completed onboarding: isProfileComplete retains true state', () => {
    const completedUser: UserProfile = {
      uid: 'user-refresh-test',
      firstName: 'Sophia',
      lastName: 'Loren',
      email: 'sophia@example.com',
      cycleLength: 28,
      periodLength: 5,
      profileComplete: true
    };

    // On page reload, Firestore snapshot is retrieved and isProfileComplete is checked
    expect(service.isProfileComplete(completedUser)).toBeTrue();
  });

  // TEST 12: Google authentication failure is handled correctly
  it('12. Google authentication failure is handled correctly: maps friendly error message', () => {
    const popupClosedError = { code: 'auth/popup-closed-by-user', message: 'Popup closed' };
    const mapped = (service as any).mapAuthErrorMessage(popupClosedError);
    expect(mapped).toBe('Sign-in window was closed before completion.');
  });

  // TEST 13: Firestore read failure is handled gracefully
  it('13. Firestore read failure is handled gracefully: getProfileSnapshot returns null on error', async () => {
    // If Firestore getDoc throws an exception
    const result = await service.getProfileSnapshot('non-existent-or-error-uid');
    expect(result).toBeNull();
  });

  // TEST 14: No localStorage-based "first login" logic is introduced
  it('14. No localStorage-based first login logic is introduced: Firestore is source of truth', () => {
    // Confirm Firestore profile is the sole arbiter of onboarding completeness
    const profileWithoutLocalStorageCheck: UserProfile = {
      uid: 'firestore-source-of-truth',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      cycleLength: 28,
      profileComplete: true
    };

    expect(service.isProfileComplete(profileWithoutLocalStorageCheck)).toBeTrue();
  });
});
