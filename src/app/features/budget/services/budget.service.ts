import { Injectable, signal } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Budget, BudgetCategory, CreateBudgetDto } from '../../../core/models';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private currentBudget = signal<Budget | null>(null);
  private budgetHistory = signal<Budget[]>([]);

  readonly budget = this.currentBudget.asReadonly();
  readonly history = this.budgetHistory.asReadonly();

  constructor(private supabase: SupabaseService) {}

  async loadCurrentBudget(familyId: string): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { data, error } = await this.supabase
      .from('budgets')
      .select(
        `
        *,
        categories:budget_categories(*)
      `,
      )
      .eq('family_id', familyId)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao carregar orçamento:', error.message);
      return;
    }

    this.currentBudget.set(data as Budget | null);
  }

  async loadBudgetHistory(familyId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('budgets')
      .select(
        `
        *,
        categories:budget_categories(*)
      `,
      )
      .eq('family_id', familyId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(12);

    if (error) {
      console.error('Erro ao carregar histórico:', error.message);
      return;
    }

    this.budgetHistory.set((data as Budget[]) || []);
  }

  async createBudget(dto: CreateBudgetDto): Promise<Budget | null> {
    const { data: budget, error } = await this.supabase
      .from('budgets')
      .insert({
        family_id: dto.family_id,
        year: dto.year,
        month: dto.month,
        total_budget: dto.total_budget,
      })
      .select()
      .single();

    if (error || !budget) {
      console.error('Erro ao criar orçamento:', error?.message);
      return null;
    }

    const categories = dto.categories.map((cat) => ({
      budget_id: (budget as Budget).id,
      category_name: cat.category_name,
      allocated_amount: cat.allocated_amount,
    }));

    const { error: catError } = await this.supabase.from('budget_categories').insert(categories);

    if (catError) {
      console.error('Erro ao criar categorias:', catError.message);
    }

    await this.loadCurrentBudget(dto.family_id);
    return budget as Budget;
  }

  async updateBudget(id: string, totalBudget: number): Promise<void> {
    const { error } = await this.supabase
      .from('budgets')
      .update({ total_budget: totalBudget })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar orçamento:', error.message);
    }
  }

  async updateCategory(id: string, allocatedAmount: number): Promise<void> {
    const { error } = await this.supabase
      .from('budget_categories')
      .update({ allocated_amount: allocatedAmount })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar categoria:', error.message);
    }
  }
}
