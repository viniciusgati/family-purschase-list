import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { FamilyService } from '../services/family.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-family-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  template: `
    <div class="dashboard-container">
      @if (!familyService.family()) {
        <div class="no-family">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Bem-vindo!</mat-card-title>
              <mat-card-subtitle>Você ainda não faz parte de uma família</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="family-actions">
                <div class="action-section">
                  <h3>Criar nova família</h3>
                  <mat-form-field appearance="outline">
                    <mat-label>Nome da família</mat-label>
                    <input matInput [(ngModel)]="newFamilyName" placeholder="Ex: Família Silva" />
                  </mat-form-field>
                  <button
                    mat-raised-button
                    color="primary"
                    (click)="createFamily()"
                    [disabled]="!newFamilyName"
                  >
                    <mat-icon>add</mat-icon>
                    Criar Família
                  </button>
                </div>

                <div class="divider">
                  <span>ou</span>
                </div>

                <div class="action-section">
                  <h3>Entrar em uma família</h3>
                  <mat-form-field appearance="outline">
                    <mat-label>Código de convite</mat-label>
                    <input
                      matInput
                      [(ngModel)]="inviteCode"
                      placeholder="Ex: ABC12345"
                      maxlength="8"
                    />
                  </mat-form-field>
                  <button
                    mat-raised-button
                    color="accent"
                    (click)="joinFamily()"
                    [disabled]="!inviteCode"
                  >
                    <mat-icon>group_add</mat-icon>
                    Entrar na Família
                  </button>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      } @else {
        <div class="family-info">
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar class="family-avatar">family_restroom</mat-icon>
              <mat-card-title>{{ familyService.family()!.name }}</mat-card-title>
              <mat-card-subtitle>
                {{ familyService.family()!.members.length }} membro(s)
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <div class="invite-section">
                <span class="invite-label">Código de convite:</span>
                <mat-chip-set>
                  <mat-chip (click)="copyInviteCode()">
                    <mat-icon matChipAvatar>content_copy</mat-icon>
                    {{ familyService.family()!.invite_code }}
                  </mat-chip>
                </mat-chip-set>
              </div>

              <h3>Membros</h3>
              <mat-list>
                @for (member of familyService.family()!.members; track member.id) {
                  <mat-list-item>
                    @if (member.profile?.avatar_url) {
                      <img matListItemAvatar [src]="member.profile!.avatar_url!" alt="Avatar" />
                    } @else {
                      <mat-icon matListItemAvatar>person</mat-icon>
                    }
                    <span matListItemTitle>{{ member.profile?.display_name || 'Membro' }}</span>
                    <span matListItemLine>{{ member.profile?.email }}</span>
                    <mat-chip matListItemMeta>{{ member.role === 'admin' ? 'Admin' : 'Membro' }}</mat-chip>
                  </mat-list-item>
                }
              </mat-list>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: `
    .dashboard-container {
      padding: 16px;
      padding-bottom: 80px;
    }

    .no-family {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }

    .family-actions {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 16px 0;
    }

    .action-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-section h3 {
      margin: 0;
      color: var(--mat-sys-on-surface);
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--mat-sys-outline-variant);
    }

    .divider span {
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
    }

    .family-avatar {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--mat-sys-primary);
    }

    .invite-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 16px 0;
      padding: 12px;
      background: var(--mat-sys-surface-container);
      border-radius: 12px;
    }

    .invite-label {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    h3 {
      margin: 16px 0 8px;
    }
  `,
})
export class FamilyDashboardComponent implements OnInit {
  newFamilyName = '';
  inviteCode = '';

  constructor(
    public familyService: FamilyService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.familyService.loadUserFamily();
  }

  async createFamily(): Promise<void> {
    if (!this.newFamilyName.trim()) return;

    const family = await this.familyService.createFamily(this.newFamilyName.trim());
    if (family) {
      this.snackBar.open('Família criada com sucesso!', 'OK', { duration: 3000 });
      this.newFamilyName = '';
    } else {
      this.snackBar.open('Erro ao criar família', 'OK', { duration: 3000 });
    }
  }

  async joinFamily(): Promise<void> {
    if (!this.inviteCode.trim()) return;

    const success = await this.familyService.joinFamily(this.inviteCode.trim().toUpperCase());
    if (success) {
      this.snackBar.open('Você entrou na família!', 'OK', { duration: 3000 });
      this.inviteCode = '';
    } else {
      this.snackBar.open('Código de convite inválido', 'OK', { duration: 3000 });
    }
  }

  copyInviteCode(): void {
    const code = this.familyService.family()?.invite_code;
    if (code) {
      navigator.clipboard.writeText(code);
      this.snackBar.open('Código copiado!', 'OK', { duration: 2000 });
    }
  }
}
