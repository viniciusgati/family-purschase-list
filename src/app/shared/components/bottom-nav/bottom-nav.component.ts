import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/lists" routerLinkActive="active" class="nav-item">
        <mat-icon>list_alt</mat-icon>
        <span>Listas</span>
      </a>
      <a routerLink="/family" routerLinkActive="active" class="nav-item">
        <mat-icon>group</mat-icon>
        <span>Família</span>
      </a>
      <a routerLink="/budget" routerLinkActive="active" class="nav-item">
        <mat-icon>account_balance_wallet</mat-icon>
        <span>Orçamento</span>
      </a>
      <a routerLink="/profile" routerLinkActive="active" class="nav-item">
        <mat-icon>person</mat-icon>
        <span>Perfil</span>
      </a>
    </nav>
  `,
  styles: `
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 64px;
      background: var(--mat-sys-surface-container);
      border-top: 1px solid var(--mat-sys-outline-variant);
      z-index: 100;
      padding-bottom: env(safe-area-inset-bottom);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: var(--mat-sys-on-surface-variant);
      font-size: 12px;
      gap: 4px;
      padding: 8px 16px;
      border-radius: 16px;
      transition: all 0.2s ease;
    }

    .nav-item.active {
      color: var(--mat-sys-primary);
      background: var(--mat-sys-secondary-container);
    }

    .nav-item mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
  `,
})
export class BottomNavComponent {}
