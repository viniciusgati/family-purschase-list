import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="callback-container">
      <mat-spinner diameter="48"></mat-spinner>
      <p>Autenticando...</p>
    </div>
  `,
  styles: `
    .callback-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      gap: 16px;
    }
  `,
})
export class CallbackComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Supabase handles the auth callback automatically
    // After processing, redirect to home
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 2000);
  }
}
