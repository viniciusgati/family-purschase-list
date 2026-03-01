export interface Expense {
  id: string;
  family_id: string;
  item_id: string | null;
  member_id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  created_at: string;
  member_profile?: {
    display_name: string;
    avatar_url: string | null;
  };
  item?: {
    name: string;
  };
}

export interface CreateExpenseDto {
  family_id: string;
  item_id?: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
}
