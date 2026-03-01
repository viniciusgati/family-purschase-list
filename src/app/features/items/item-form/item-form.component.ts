import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ItemService } from '../services/item.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="form-container">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>Adicionar Item</h2>
      </div>

      <mat-card>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nome do item *</mat-label>
            <input matInput [(ngModel)]="itemName" placeholder="Ex: Arroz 5kg" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descrição</mat-label>
            <textarea matInput [(ngModel)]="itemDescription" rows="2"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Preço estimado (R$)</mat-label>
            <input matInput type="number" [(ngModel)]="itemPrice" step="0.01" min="0" />
            <mat-icon matPrefix>attach_money</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Link de onde comprar</mat-label>
            <input matInput [(ngModel)]="itemUrl" placeholder="https://..." type="url" />
            <mat-icon matPrefix>link</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nome da loja</mat-label>
            <input matInput [(ngModel)]="itemStore" placeholder="Ex: Amazon, Mercado Livre" />
            <mat-icon matPrefix>store</mat-icon>
          </mat-form-field>

          <div class="photo-section">
            <h3>Foto do item</h3>
            @if (photoPreview()) {
              <div class="photo-preview">
                <img [src]="photoPreview()" alt="Preview" />
                <button mat-icon-button class="remove-photo" (click)="removePhoto()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            } @else {
              <div class="photo-upload" (click)="fileInput.click()">
                <mat-icon>add_a_photo</mat-icon>
                <span>Adicionar foto</span>
              </div>
            }
            <input
              #fileInput
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              (change)="onFileSelected($event)"
            />
            @if (uploading()) {
              <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            }
          </div>

          <div class="form-actions">
            <button mat-button (click)="goBack()">Cancelar</button>
            <button
              mat-raised-button
              color="primary"
              (click)="saveItem()"
              [disabled]="!itemName || uploading()"
            >
              <mat-icon>save</mat-icon>
              Salvar
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .form-container {
      padding-bottom: 80px;
    }

    .header {
      display: flex;
      align-items: center;
      padding: 8px 8px 8px 4px;
      gap: 8px;
    }

    .header h2 {
      margin: 0;
    }

    mat-card {
      margin: 0 16px;
    }

    mat-card-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .full-width {
      width: 100%;
    }

    .photo-section {
      margin: 8px 0;
    }

    .photo-section h3 {
      margin: 0 0 8px;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .photo-upload {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 120px;
      border: 2px dashed var(--mat-sys-outline-variant);
      border-radius: 12px;
      cursor: pointer;
      color: var(--mat-sys-on-surface-variant);
      gap: 8px;
      transition: all 0.2s ease;
    }

    .photo-upload:active {
      border-color: var(--mat-sys-primary);
      color: var(--mat-sys-primary);
    }

    .photo-preview {
      position: relative;
      display: inline-block;
    }

    .photo-preview img {
      width: 100%;
      max-height: 200px;
      object-fit: cover;
      border-radius: 12px;
    }

    .remove-photo {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(0, 0, 0, 0.5) !important;
      color: white !important;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  `,
})
export class ItemFormComponent implements OnInit {
  itemName = '';
  itemDescription = '';
  itemPrice: number | null = null;
  itemUrl = '';
  itemStore = '';
  photoPreview = signal<string | null>(null);
  uploading = signal(false);
  private photoFile: File | null = null;
  private listId = '';

  constructor(
    private itemService: ItemService,
    private supabase: SupabaseService,
    private configService: ConfigService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.listId = this.route.snapshot.paramMap.get('id') || '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const maxSize = this.configService.maxPhotoSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      this.snackBar.open(
        `Foto muito grande. Máximo: ${this.configService.maxPhotoSizeMB}MB`,
        'OK',
        { duration: 3000 },
      );
      return;
    }

    this.photoFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.photoFile = null;
    this.photoPreview.set(null);
  }

  async saveItem(): Promise<void> {
    if (!this.itemName.trim() || !this.listId) return;

    let photoUrl: string | undefined;

    if (this.photoFile) {
      this.uploading.set(true);
      photoUrl = await this.uploadPhoto(this.photoFile);
      this.uploading.set(false);
    }

    const item = await this.itemService.createItem({
      list_id: this.listId,
      name: this.itemName.trim(),
      description: this.itemDescription.trim() || undefined,
      estimated_price: this.itemPrice || undefined,
      purchase_url: this.itemUrl.trim() || undefined,
      store_name: this.itemStore.trim() || undefined,
      photo_url: photoUrl,
    });

    if (item) {
      this.snackBar.open('Item adicionado!', 'OK', { duration: 2000 });
      this.goBack();
    } else {
      this.snackBar.open('Erro ao adicionar item', 'OK', { duration: 3000 });
    }
  }

  private async uploadPhoto(file: File): Promise<string | undefined> {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `items/${this.listId}/${fileName}`;

    const { error } = await this.supabase.storage.from('item-photos').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      console.error('Erro ao fazer upload:', error.message);
      this.snackBar.open('Erro ao fazer upload da foto', 'OK', { duration: 3000 });
      return undefined;
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from('item-photos').getPublicUrl(filePath);

    return publicUrl;
  }

  goBack(): void {
    this.router.navigate(['/lists', this.listId]);
  }
}
