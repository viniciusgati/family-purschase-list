import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
  ],
  template: `
    <div class="profile-container">
      <mat-card class="profile-card">
        <mat-card-content>
          <div class="avatar-section">
            @if (authService.profile()?.avatar_url) {
              <img
                [src]="authService.profile()!.avatar_url"
                alt="Avatar"
                class="avatar"
              />
            } @else {
              <mat-icon class="avatar-icon">account_circle</mat-icon>
            }
            <h2>{{ authService.profile()?.display_name }}</h2>
            <p class="email">{{ authService.profile()?.email }}</p>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-nav-list>
          <a mat-list-item>
            <mat-icon matListItemIcon>info</mat-icon>
            <span matListItemTitle>Sobre o App</span>
            <span matListItemLine>Family Purchase List v1.0.0</span>
          </a>
          <mat-divider></mat-divider>
          <a mat-list-item (click)="logout()" class="logout-item">
            <mat-icon matListItemIcon color="warn">logout</mat-icon>
            <span matListItemTitle class="logout-text">Sair</span>
          </a>
        </mat-nav-list>
      </mat-card>
    </div>
  `,
  styles: `
    .profile-container {
      padding: 16px;
      padding-bottom: 80px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 0;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 12px;
    }

    .avatar-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 12px;
    }

    h2 {
      margin: 0;
    }

    .email {
      color: var(--mat-sys-on-surface-variant);
      margin: 4px 0 0;
    }

    .logout-text {
      color: var(--mat-sys-error);
    }
  `,
})
export class ProfileComponent {
  constructor(public authService: AuthService) {}

  async logout(): Promise<void> {
    await this.authService.signOut();
  }
}
