import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="app-icon">shopping_cart</mat-icon>
            <h1>Family Purchase List</h1>
          </mat-card-title>
          <mat-card-subtitle>Controle de compras da família</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <p class="description">
            Organize as compras da sua família com listas compartilhadas, prioridades e controle de
            orçamento.
          </p>
        </mat-card-content>

        <mat-card-actions>
          @if (isLoading()) {
            <mat-spinner diameter="36"></mat-spinner>
          } @else {
            <button
              mat-raised-button
              color="primary"
              class="google-btn"
              (click)="loginWithGoogle()"
              [disabled]="isLoading()"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="google-icon" />
              Entrar com Google
            </button>
          }

          @if (errorMessage()) {
            <p class="error-message">{{ errorMessage() }}</p>
          }
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 16px;
      background: linear-gradient(135deg, var(--mat-sys-primary) 0%, var(--mat-sys-tertiary) 100%);
    }

    .login-card {
      max-width: 400px;
      width: 100%;
      text-align: center;
      padding: 32px 24px;
    }

    .app-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-primary);
      margin-bottom: 8px;
    }

    h1 {
      margin: 8px 0;
      font-size: 24px;
    }

    .description {
      color: var(--mat-sys-on-surface-variant);
      margin: 16px 0;
    }

    mat-card-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
    }

    .google-btn {
      width: 100%;
      max-width: 280px;
      height: 48px;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .google-icon {
      width: 20px;
      height: 20px;
    }

    .error-message {
      color: var(--mat-sys-error);
      font-size: 14px;
    }
  `,
})
export class LoginComponent {
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService) {}

  async loginWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.signInWithGoogle();
    } catch {
      this.errorMessage.set('Erro ao fazer login. Tente novamente.');
      this.isLoading.set(false);
    }
  }
}
