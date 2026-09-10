import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { from, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const authService = inject(AuthService);
  const router = inject(Router);

  return user(auth).pipe(
    take(1),
    switchMap((firebaseUser) => {
      if (!firebaseUser) {
        router.navigate(['/login']);
        return of(false);
      }
      return from(authService.getProfileSnapshot(firebaseUser.uid)).pipe(
        map((profile) => {
          if (authService.isProfileComplete(profile)) {
            return true;
          }
          // Profile document does not exist or onboarding is incomplete
          router.navigate(['/register']);
          return false;
        })
      );
    })
  );
};

