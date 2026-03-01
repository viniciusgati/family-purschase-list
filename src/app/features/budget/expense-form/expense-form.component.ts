import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExpenseService } from '../services/expense.service';
import { FamilyService } from '../../family/services/family.service';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="form-container">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>Registrar Gasto</h2>
      </div>

      <mat-card>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descrição *</mat-label>
            <input matInput [(ngModel)]="description" placeholder="Ex: Compras no mercado" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Valor (R$) *</mat-label>
            <input matInput type="number" [(ngModel)]="amount" step="0.01" min="0" />
            <mat-icon matPrefix>attach_money</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Categoria</mat-label>
            <mat-select [(ngModel)]="category">
              @for (cat of categories; track cat) {
                <mat-option [value]="cat">{{ cat }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Data</mat-label>
            <input matInput type="date" [(ngModel)]="expenseDate" />
          </mat-form-field>

          <div class="form-actions">
            <button mat-button (click)="goBack()">Cancelar</button>
            <button
              mat-raised-button
              color="primary"
              (click)="saveExpense()"
              [disabled]="!description || !amount"
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

    .header h2 { margin: 0; }

    mat-card { margin: 0 16px; }

    mat-card-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .full-width { width: 100%; }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  `,
})
export class ExpenseFormComponent implements OnInit {
  description = '';
  amount: number | null = null;
  category = '';
  expenseDate = '';
  categories: string[] = [];

  constructor(
    private expenseService: ExpenseService,
    private familyService: FamilyService,
    private configService: ConfigService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.categories = this.configService.budgetCategories;
    this.category = this.categories[0] || 'Outros';
    this.expenseDate = new Date().toISOString().split('T')[0];
  }

  async saveExpense(): Promise<void> {
    const familyId = this.familyService.family()?.id;
    if (!familyId || !this.description.trim() || !this.amount) return;

    const expense = await this.expenseService.createExpense({
      family_id: familyId,
      description: this.description.trim(),
      amount: this.amount,
      category: this.category,
      expense_date: this.expenseDate,
    });

    if (expense) {
      this.snackBar.open('Gasto registrado!', 'OK', { duration: 2000 });
      this.goBack();
    } else {
      this.snackBar.open('Erro ao registrar gasto', 'OK', { duration: 3000 });
    }
  }

  goBack(): void {
    this.router.navigate(['/budget']);
  }
}
