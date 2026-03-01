import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BudgetService } from '../services/budget.service';
import { FamilyService } from '../../family/services/family.service';
import { ConfigService } from '../../../core/services/config.service';

interface CategoryInput {
  name: string;
  amount: number;
}

@Component({
  selector: 'app-budget-form',
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
  ],
  template: `
    <div class="form-container">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>Criar Orçamento</h2>
      </div>

      <mat-card>
        <mat-card-content>
          <p class="month-label">{{ monthLabel }}</p>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Orçamento total (R$)</mat-label>
            <input matInput type="number" [(ngModel)]="totalBudget" step="100" min="0" />
            <mat-icon matPrefix>attach_money</mat-icon>
          </mat-form-field>

          <h3>Categorias</h3>
          @for (cat of categories; track cat.name; let i = $index) {
            <div class="category-row">
              <span class="category-name">{{ cat.name }}</span>
              <mat-form-field appearance="outline" class="amount-field">
                <mat-label>R$</mat-label>
                <input matInput type="number" [(ngModel)]="cat.amount" step="50" min="0" />
              </mat-form-field>
            </div>
          }

          <div class="form-actions">
            <button mat-button (click)="goBack()">Cancelar</button>
            <button
              mat-raised-button
              color="primary"
              (click)="saveBudget()"
              [disabled]="!totalBudget"
            >
              <mat-icon>save</mat-icon>
              Salvar Orçamento
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

    .header h2 { margin: 0; }

    mat-card { margin: 0 16px; }

    mat-card-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .month-label {
      text-transform: capitalize;
      font-size: 16px;
      color: var(--mat-sys-primary);
      font-weight: 500;
    }

    .full-width { width: 100%; }

    h3 { margin: 8px 0; }

    .category-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .category-name {
      flex: 1;
      font-size: 14px;
    }

    .amount-field {
      width: 120px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  `,
})
export class BudgetFormComponent implements OnInit {
  totalBudget: number = 0;
  categories: CategoryInput[] = [];
  monthLabel = '';

  constructor(
    private budgetService: BudgetService,
    private familyService: FamilyService,
    private configService: ConfigService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const now = new Date();
    this.monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    this.categories = this.configService.budgetCategories.map((name) => ({
      name,
      amount: 0,
    }));
  }

  async saveBudget(): Promise<void> {
    const familyId = this.familyService.family()?.id;
    if (!familyId || !this.totalBudget) return;

    const now = new Date();
    const budget = await this.budgetService.createBudget({
      family_id: familyId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      total_budget: this.totalBudget,
      categories: this.categories
        .filter((c) => c.amount > 0)
        .map((c) => ({
          category_name: c.name,
          allocated_amount: c.amount,
        })),
    });

    if (budget) {
      this.snackBar.open('Orçamento criado!', 'OK', { duration: 2000 });
      this.goBack();
    } else {
      this.snackBar.open('Erro ao criar orçamento', 'OK', { duration: 3000 });
    }
  }

  goBack(): void {
    this.router.navigate(['/budget']);
  }
}
