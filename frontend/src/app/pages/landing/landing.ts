import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class LandingPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly introLetters = ['H', 'E', 'R', 'C', 'Y', 'C', 'L', 'E'];

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';

    // Auto transition to login or dashboard after 3.6 seconds
    setTimeout(() => {
      this.proceed();
    }, 3600);
  }

  proceed(): void {
    document.body.style.overflow = 'auto';
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard/home']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
