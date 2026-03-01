export interface Budget {
  id: string;
  family_id: string;
  year: number;
  month: number;
  total_budget: number;
  created_at: string;
  updated_at: string;
  categories?: BudgetCategory[];
  total_spent?: number;
}

export interface BudgetCategory {
  id: string;
  budget_id: string;
  category_name: string;
  allocated_amount: number;
  created_at: string;
  spent_amount?: number;
}

export interface CreateBudgetDto {
  family_id: string;
  year: number;
  month: number;
  total_budget: number;
  categories: { category_name: string; allocated_amount: number }[];
}
