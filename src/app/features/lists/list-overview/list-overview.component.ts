import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFabButton } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ListService } from '../services/list.service';
import { FamilyService } from '../../family/services/family.service';
import { AuthService } from '../../../core/services/auth.service';
import { PurchaseList } from '../../../core/models';

@Component({
  selector: 'app-list-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="lists-container">
      <div class="header">
        <h2>Minhas Listas</h2>
        <div class="filter-chips">
          <mat-chip-set>
            <mat-chip
              [highlighted]="filter() === 'all'"
              (click)="filter.set('all')"
            >
              Todas
            </mat-chip>
            <mat-chip
              [highlighted]="filter() === 'mine'"
              (click)="filter.set('mine')"
            >
              Minhas
            </mat-chip>
            <mat-chip
              [highlighted]="filter() === 'shared'"
              (click)="filter.set('shared')"
            >
              Compartilhadas
            </mat-chip>
          </mat-chip-set>
        </div>
      </div>

      @if (showCreateForm()) {
        <mat-card class="create-form">
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nome da lista</mat-label>
              <input matInput [(ngModel)]="newListName" placeholder="Ex: Compras do mês" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descrição (opcional)</mat-label>
              <input matInput [(ngModel)]="newListDescription" />
            </mat-form-field>
            <mat-slide-toggle [(ngModel)]="newListShared">
              Compartilhar com a família
            </mat-slide-toggle>
            <div class="form-actions">
              <button mat-button (click)="showCreateForm.set(false)">Cancelar</button>
              <button
                mat-raised-button
                color="primary"
                (click)="createList()"
                [disabled]="!newListName"
              >
                Criar Lista
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <div class="lists-grid">
        @for (list of filteredLists(); track list.id) {
          <mat-card class="list-card" (click)="openList(list)">
            <mat-card-header>
              <mat-icon mat-card-avatar class="list-icon">
                {{ list.is_shared ? 'group' : 'person' }}
              </mat-icon>
              <mat-card-title>{{ list.name }}</mat-card-title>
              <mat-card-subtitle>
                {{ list.owner?.display_name || 'Você' }}
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (list.description) {
                <p class="list-description">{{ list.description }}</p>
              }
              <div class="list-meta">
                <mat-chip>
                  <mat-icon matChipAvatar>shopping_cart</mat-icon>
                  {{ list.item_count || 0 }} itens
                </mat-chip>
                @if (list.is_shared) {
                  <mat-chip>
                    <mat-icon matChipAvatar>share</mat-icon>
                    Compartilhada
                  </mat-chip>
                }
              </div>
            </mat-card-content>
          </mat-card>
        } @empty {
          <div class="empty-state">
            <mat-icon>playlist_add</mat-icon>
            <p>Nenhuma lista encontrada</p>
            <p class="hint">Toque no + para criar sua primeira lista</p>
          </div>
        }
      </div>

      <button
        mat-fab
        color="primary"
        class="fab-add"
        (click)="showCreateForm.set(true)"
      >
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: `
    .lists-container {
      padding: 16px;
      padding-bottom: 80px;
    }

    .header {
      margin-bottom: 16px;
    }

    .header h2 {
      margin: 0 0 12px;
    }

    .filter-chips {
      margin-bottom: 8px;
    }

    .create-form {
      margin-bottom: 16px;
    }

    .create-form mat-card-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .full-width {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .lists-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .list-card {
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .list-card:active {
      transform: scale(0.98);
    }

    .list-icon {
      color: var(--mat-sys-primary);
    }

    .list-description {
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
      margin: 8px 0;
    }

    .list-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      color: var(--mat-sys-on-surface-variant);
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .empty-state .hint {
      font-size: 14px;
    }

    .fab-add {
      position: fixed;
      bottom: 80px;
      right: 16px;
      z-index: 50;
    }
  `,
})
export class ListOverviewComponent implements OnInit {
  filter = signal<'all' | 'mine' | 'shared'>('all');
  showCreateForm = signal(false);
  newListName = '';
  newListDescription = '';
  newListShared = false;

  constructor(
    public listService: ListService,
    private familyService: FamilyService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  async ngOnInit(): Promise<void> {
    const familyId = this.familyService.family()?.id;
    if (familyId) {
      await this.listService.loadLists(familyId);
    }
  }

  filteredLists(): PurchaseList[] {
    const lists = this.listService.allLists();
    const userId = this.authService.user()?.id;

    switch (this.filter()) {
      case 'mine':
        return lists.filter((l) => l.owner_id === userId);
      case 'shared':
        return lists.filter((l) => l.is_shared);
      default:
        return lists;
    }
  }

  async createList(): Promise<void> {
    const familyId = this.familyService.family()?.id;
    if (!familyId || !this.newListName.trim()) return;

    const list = await this.listService.createList({
      family_id: familyId,
      name: this.newListName.trim(),
      description: this.newListDescription.trim() || undefined,
      is_shared: this.newListShared,
    });

    if (list) {
      this.snackBar.open('Lista criada!', 'OK', { duration: 2000 });
      this.showCreateForm.set(false);
      this.newListName = '';
      this.newListDescription = '';
      this.newListShared = false;
    }
  }

  openList(list: PurchaseList): void {
    this.router.navigate(['/lists', list.id]);
  }
}
