import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ItemService } from '../../items/services/item.service';
import { ListService } from '../services/list.service';
import { Item, PurchaseList } from '../../../core/models';

@Component({
  selector: 'app-list-detail',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="list-detail-container">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-info">
          <h2>{{ list()?.name }}</h2>
          <span class="subtitle">{{ itemService.allItems().length }} itens</span>
        </div>
        <button mat-icon-button [matMenuTriggerFor]="listMenu">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #listMenu="matMenu">
          <button mat-menu-item (click)="deleteList()">
            <mat-icon>delete</mat-icon>
            <span>Excluir lista</span>
          </button>
        </mat-menu>
      </div>

      <div
        class="items-list"
        cdkDropList
        (cdkDropListDropped)="onDrop($event)"
      >
        @for (item of itemService.allItems(); track item.id) {
          <mat-card
            class="item-card"
            cdkDrag
            [class.purchased]="item.is_purchased"
          >
            <div class="drag-handle" cdkDragHandle>
              <mat-icon>drag_indicator</mat-icon>
            </div>
            <div class="item-content" (click)="openItemDetail(item)">
              <div class="item-main">
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  @if (item.store_name) {
                    <span class="item-store">{{ item.store_name }}</span>
                  }
                </div>
                @if (item.estimated_price) {
                  <span class="item-price">
                    {{ item.estimated_price | currency: 'BRL' }}
                  </span>
                }
              </div>
              @if (item.photo_url) {
                <img [src]="item.photo_url" alt="{{ item.name }}" class="item-thumb" />
              }
              <div class="item-actions-row">
                <mat-chip-set>
                  <mat-chip [class]="'status-' + item.status">
                    {{ getStatusLabel(item.status) }}
                  </mat-chip>
                  @if (item.purchase_url) {
                    <mat-chip (click)="openLink(item.purchase_url, $event)">
                      <mat-icon matChipAvatar>link</mat-icon>
                      Comprar
                    </mat-chip>
                  }
                </mat-chip-set>
                <div class="item-actions">
                  @if (!item.is_purchased) {
                    <button
                      mat-icon-button
                      color="primary"
                      (click)="markPurchased(item, $event)"
                    >
                      <mat-icon>check_circle_outline</mat-icon>
                    </button>
                  }
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="deleteItem(item, $event)"
                  >
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </mat-card>
        } @empty {
          <div class="empty-state">
            <mat-icon>add_shopping_cart</mat-icon>
            <p>Nenhum item na lista</p>
            <p class="hint">Toque no + para adicionar itens</p>
          </div>
        }
      </div>

      <button
        mat-fab
        color="primary"
        class="fab-add"
        (click)="addItem()"
      >
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: `
    .list-detail-container {
      padding-bottom: 80px;
    }

    .header {
      display: flex;
      align-items: center;
      padding: 8px 8px 8px 4px;
      gap: 8px;
      position: sticky;
      top: 0;
      background: var(--mat-sys-surface);
      z-index: 10;
    }

    .header-info {
      flex: 1;
    }

    .header-info h2 {
      margin: 0;
      font-size: 20px;
    }

    .subtitle {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .items-list {
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .item-card {
      display: flex;
      align-items: flex-start;
      padding: 12px;
      transition: all 0.2s ease;
    }

    .item-card.purchased {
      opacity: 0.6;
    }

    .item-card.purchased .item-name {
      text-decoration: line-through;
    }

    .drag-handle {
      cursor: grab;
      color: var(--mat-sys-on-surface-variant);
      margin-right: 8px;
      padding-top: 4px;
    }

    .item-content {
      flex: 1;
      cursor: pointer;
    }

    .item-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .item-info {
      display: flex;
      flex-direction: column;
    }

    .item-name {
      font-weight: 500;
      font-size: 16px;
    }

    .item-store {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }

    .item-price {
      font-weight: 600;
      color: var(--mat-sys-primary);
      white-space: nowrap;
    }

    .item-thumb {
      width: 100%;
      max-height: 120px;
      object-fit: cover;
      border-radius: 8px;
      margin: 8px 0;
    }

    .item-actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }

    .item-actions {
      display: flex;
    }

    .status-pending { --mat-chip-label-text-color: var(--mat-sys-on-surface); }
    .status-in_cart { --mat-chip-label-text-color: #f57c00; }
    .status-purchased { --mat-chip-label-text-color: #388e3c; }
    .status-cancelled { --mat-chip-label-text-color: var(--mat-sys-error); }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 16px;
      color: var(--mat-sys-on-surface-variant);
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .fab-add {
      position: fixed;
      bottom: 80px;
      right: 16px;
      z-index: 50;
    }

    .cdk-drag-preview {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
    }

    .cdk-drag-placeholder {
      opacity: 0.3;
    }
  `,
})
export class ListDetailComponent implements OnInit {
  list = signal<PurchaseList | null>(null);
  private listId = '';

  constructor(
    public itemService: ItemService,
    private listService: ListService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  async ngOnInit(): Promise<void> {
    this.listId = this.route.snapshot.paramMap.get('id') || '';
    if (this.listId) {
      const list = await this.listService.getListById(this.listId);
      this.list.set(list);
      await this.itemService.loadItems(this.listId);
    }
  }

  async onDrop(event: CdkDragDrop<Item[]>): Promise<void> {
    const items = [...this.itemService.allItems()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    await this.itemService.reorderItems(items);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      in_cart: 'No carrinho',
      purchased: 'Comprado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  openLink(url: string, event: Event): void {
    event.stopPropagation();
    window.open(url, '_blank');
  }

  async markPurchased(item: Item, event: Event): Promise<void> {
    event.stopPropagation();
    await this.itemService.markAsPurchased(item.id, item.estimated_price || 0);
    this.snackBar.open('Item marcado como comprado!', 'OK', { duration: 2000 });
  }

  async deleteItem(item: Item, event: Event): Promise<void> {
    event.stopPropagation();
    await this.itemService.deleteItem(item.id);
    this.snackBar.open('Item removido', 'OK', { duration: 2000 });
  }

  async deleteList(): Promise<void> {
    if (this.listId) {
      await this.listService.deleteList(this.listId);
      this.snackBar.open('Lista excluída', 'OK', { duration: 2000 });
      this.router.navigate(['/lists']);
    }
  }

  addItem(): void {
    this.router.navigate(['/lists', this.listId, 'add-item']);
  }

  openItemDetail(item: Item): void {
    this.router.navigate(['/lists', this.listId, 'items', item.id]);
  }

  goBack(): void {
    this.router.navigate(['/lists']);
  }
}
