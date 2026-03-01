import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { Expense, CreateExpenseDto } from '../../../core/models';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private expenses = signal<Expense[]>([]);
  readonly allExpenses = this.expenses.asReadonly();

  readonly totalSpent = computed(() =>
    this.expenses().reduce((sum, exp) => sum + exp.amount, 0),
  );

  readonly byCategory = computed(() => {
    const map = new Map<string, number>();
    for (const exp of this.expenses()) {
      const current = map.get(exp.category) || 0;
      map.set(exp.category, current + exp.amount);
    }
    return map;
  });

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
  ) {}

  async loadExpenses(familyId: string, year: number, month: number): Promise<void> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('expenses')
      .select(
        `
        *,
        member_profile:profiles!member_id(display_name, avatar_url),
        item:items!item_id(name)
      `,
      )
      .eq('family_id', familyId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Erro ao carregar gastos:', error.message);
      return;
    }

    this.expenses.set((data as Expense[]) || []);
  }

  async createExpense(dto: CreateExpenseDto): Promise<Expense | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;

    const { data, error } = await this.supabase
      .from('expenses')
      .insert({ ...dto, member_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar gasto:', error.message);
      return null;
    }

    const expense = data as Expense;
    this.expenses.update((current) => [expense, ...current]);
    return expense;
  }

  async deleteExpense(id: string): Promise<void> {
    const { error } = await this.supabase.from('expenses').delete().eq('id', id);

    if (error) {
      console.error('Erro ao deletar gasto:', error.message);
      return;
    }

    this.expenses.update((current) => current.filter((e) => e.id !== id));
  }
}
