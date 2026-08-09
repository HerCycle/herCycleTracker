import { Routes } from '@angular/router';
import { LoginPage } from './pages/auth/login/login';
import { RegisterPage } from './pages/auth/register/register';
import { ForgotPasswordPage } from './pages/auth/forgot-password/forgot-password';
import { ResetPasswordPage } from './pages/auth/reset-password/reset-password';
import { DashboardLayout } from './pages/dashboard/dashboard-layout/dashboard-layout';
import { HomePage } from './pages/dashboard/home/home';
import { CalendarPage } from './pages/dashboard/calendar/calendar';
import { SymptomsPage } from './pages/dashboard/symptoms/symptoms';
import { RemindersPage } from './pages/dashboard/reminders/reminders';
import { ShopPage } from './pages/dashboard/shop/shop';
import { SelfCarePage } from './pages/dashboard/self-care/self-care';
import { PartnerPage } from './pages/dashboard/partner/partner';
import { FeedbackPage } from './pages/dashboard/feedback/feedback';
import { ProfilePage } from './pages/dashboard/profile/profile';
import { AdminPage } from './pages/dashboard/admin/admin';
import { LandingPage } from './pages/landing/landing';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'welcome', component: LandingPage },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  { path: 'reset-password', component: ResetPasswordPage },
  {
    path: 'dashboard',
    component: DashboardLayout,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomePage },
      { path: 'calendar', component: CalendarPage },
      { path: 'symptoms', component: SymptomsPage },
      { path: 'reminders', component: RemindersPage },
      { path: 'shop', component: ShopPage },
      { path: 'self-care', component: SelfCarePage },
      { path: 'partner', component: PartnerPage },
      { path: 'feedback', component: FeedbackPage },
      { path: 'profile', component: ProfilePage },
      { path: 'admin', component: AdminPage, canActivate: [adminGuard] },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
