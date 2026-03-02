import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BudgetService } from '../services/budget.service';
import { ExpenseService } from '../services/expense.service';
import { FamilyService } from '../../family/services/family.service';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-budget-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTabsModule,
    MatListModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="budget-container">
      <h2>Orçamento</h2>
      <p class="month-label">{{ currentMonthLabel() }}</p>

      @if (budgetService.budget()) {
        <mat-card class="budget-summary">
          <mat-card-content>
            <div class="budget-total">
              <div class="budget-info">
                <span class="label">Orçamento</span>
                <span class="value">{{ budgetService.budget()!.total_budget | currency: 'BRL' }}</span>
              </div>
              <div class="budget-info">
                <span class="label">Gasto</span>
                <span class="value spent">{{ expenseService.totalSpent() | currency: 'BRL' }}</span>
              </div>
              <div class="budget-info">
                <span class="label">Restante</span>
                <span class="value" [class.negative]="remaining() < 0">
                  {{ remaining() | currency: 'BRL' }}
                </span>
              </div>
            </div>
            <mat-progress-bar
              [mode]="'determinate'"
              [value]="spentPercentage()"
              [color]="spentPercentage() > 90 ? 'warn' : 'primary'"
            ></mat-progress-bar>
            <span class="percentage">{{ spentPercentage() | number: '1.0-0' }}% utilizado</span>
          </mat-card-content>
        </mat-card>

        <h3>Categorias</h3>
        @for (cat of budgetService.budget()!.categories; track cat.id) {
          <mat-card class="category-card">
            <mat-card-content>
              <div class="category-header">
                <span class="category-name">{{ cat.category_name }}</span>
                <span class="category-amount">
                  {{ getCategorySpent(cat.category_name) | currency: 'BRL' }}
                  / {{ cat.allocated_amount | currency: 'BRL' }}
                </span>
              </div>
              <mat-progress-bar
                [mode]="'determinate'"
                [value]="getCategoryPercentage(cat.category_name, cat.allocated_amount)"
                [color]="getCategoryPercentage(cat.category_name, cat.allocated_amount) > 90 ? 'warn' : 'primary'"
              ></mat-progress-bar>
            </mat-card-content>
          </mat-card>
        }

        <h3>Últimos Gastos</h3>
        <mat-list>
          @for (expense of expenseService.allExpenses().slice(0, 5); track expense.id) {
            <mat-list-item>
              <mat-icon matListItemAvatar>receipt</mat-icon>
              <span matListItemTitle>{{ expense.description }}</span>
              <span matListItemLine>{{ expense.category }} · {{ expense.expense_date | date: 'dd/MM' }}</span>
              <span matListItemMeta class="expense-amount">
                {{ expense.amount | currency: 'BRL' }}
              </span>
            </mat-list-item>
          } @empty {
            <div class="empty-expenses">
              <p>Nenhum gasto registrado este mês</p>
            </div>
          }
        </mat-list>

        <div class="action-buttons">
          <button mat-raised-button color="primary" (click)="addExpense()">
            <mat-icon>add</mat-icon>
            Registrar Gasto
          </button>
          <button mat-stroked-button (click)="viewReports()">
            <mat-icon>bar_chart</mat-icon>
            Relatórios
          </button>
        </div>
      } @else {
        <mat-card class="no-budget">
          <mat-card-content>
            <mat-icon>account_balance_wallet</mat-icon>
            <p>Nenhum orçamento definido para este mês</p>
            <button mat-raised-button color="primary" (click)="createBudget()">
              <mat-icon>add</mat-icon>
              Criar Orçamento
            </button>
          </mat-card-content>
        </mat-card>
      }

      <button
        mat-fab
        color="primary"
        class="fab-add"
        (click)="addExpense()"
      >
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: `
    .budget-container {
      padding: 16px;
      padding-bottom: 80px;
    }

    h2 { margin: 0; }

    .month-label {
      color: var(--mat-sys-on-surface-variant);
      margin: 4px 0 16px;
      text-transform: capitalize;
    }

    .budget-summary {
      margin-bottom: 16px;
    }

    .budget-total {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .budget-info {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .budget-info .label {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    .budget-info .value {
      font-size: 18px;
      font-weight: 600;
    }

    .budget-info .value.spent {
      color: #f57c00;
    }

    .budget-info .value.negative {
      color: var(--mat-sys-error);
    }

    .percentage {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
    }

    h3 {
      margin: 16px 0 8px;
    }

    .category-card {
      margin-bottom: 8px;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .category-name {
      font-weight: 500;
    }

    .category-amount {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }

    .expense-amount {
      font-weight: 600;
      color: var(--mat-sys-error);
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .no-budget mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      gap: 16px;
    }

    .no-budget mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--mat-sys-on-surface-variant);
    }

    .empty-expenses {
      text-align: center;
      padding: 16px;
      color: var(--mat-sys-on-surface-variant);
    }

    .fab-add {
      position: fixed;
      bottom: 80px;
      right: 16px;
      z-index: 50;
    }
  `,
})
export class BudgetOverviewComponent implements OnInit {
  currentMonthLabel = signal('');

  remaining = computed(() => {
    const budget = this.budgetService.budget();
    if (!budget) return 0;
    return budget.total_budget - this.expenseService.totalSpent();
  });

  spentPercentage = computed(() => {
    const budget = this.budgetService.budget();
    if (!budget || budget.total_budget === 0) return 0;
    return Math.min((this.expenseService.totalSpent() / budget.total_budget) * 100, 100);
  });

  constructor(
    public budgetService: BudgetService,
    public expenseService: ExpenseService,
    private familyService: FamilyService,
    private configService: ConfigService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  async ngOnInit(): Promise<void> {
    const now = new Date();
    this.currentMonthLabel.set(
      now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    );

    const familyId = this.familyService.family()?.id;
    if (familyId) {
      try {
        await this.budgetService.loadCurrentBudget(familyId);
        await this.expenseService.loadExpenses(familyId, now.getFullYear(), now.getMonth() + 1);
      } catch (error) {
        this.snackBar.open('Erro ao carregar dados do orçamento', 'OK', { duration: 3000 });
      }
    } else {
      this.snackBar.open('Você precisa criar ou entrar em uma família primeiro', 'OK', { duration: 3000 });
    }
  }

  getCategorySpent(categoryName: string): number {
    return this.expenseService.byCategory().get(categoryName) || 0;
  }

  getCategoryPercentage(categoryName: string, allocated: number): number {
    if (allocated === 0) return 0;
    const spent = this.getCategorySpent(categoryName);
    return Math.min((spent / allocated) * 100, 100);
  }

  createBudget(): void {
    this.router.navigate(['/budget', 'create']);
  }

  addExpense(): void {
    this.router.navigate(['/budget', 'add-expense']);
  }

  viewReports(): void {
    this.router.navigate(['/budget', 'reports']);
  }
}
