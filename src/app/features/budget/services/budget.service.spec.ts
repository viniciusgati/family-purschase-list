import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetService } from './budget.service';
import { SupabaseService } from '../../../core/services/supabase.service';

describe('BudgetService', () => {
  let budgetService: BudgetService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    };

    budgetService = new BudgetService(mockSupabase as unknown as SupabaseService);
    vi.clearAllMocks();
  });

  describe('loadCurrentBudget', () => {
    it('deve carregar orçamento do mês atual', async () => {
      const now = new Date();
      const mockBudget = {
        id: 'budget-123',
        family_id: 'family-123',
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        total_budget: 5000,
        categories: []
      };

      // Setup mock chain: select -> eq -> eq -> eq -> single
      const eqMock1 = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: () => Promise.resolve({ data: mockBudget, error: null }),
          })),
        })),
      }));
      
      const eqMock2 = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: () => Promise.resolve({ data: mockBudget, error: null }),
        })),
      }));

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: eqMock1,
        })),
      });

      // Override to match the actual call chain
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: (col: string, val: string) => {
            if (col === 'family_id') {
              return {
                eq: (col2: string, val2: number) => {
                  if (col2 === 'year') {
                    return {
                      eq: (col3: string, val3: number) => {
                        return {
                          single: () => Promise.resolve({ data: mockBudget, error: null }),
                        };
                      },
                    };
                  }
                  return { single: () => Promise.resolve({ data: null, error: null }) };
                },
              };
            }
            return { single: () => Promise.resolve({ data: null, error: null }) };
          },
        }),
      }));

      await budgetService.loadCurrentBudget('family-123');

      expect(budgetService.budget()).not.toBeNull();
      expect(budgetService.budget()?.total_budget).toBe(5000);
    });

    it('deve retornar null se não há orçamento para o mês', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: (col: string, val: string) => {
            return {
              eq: (col2: string, val2: number) => {
                return {
                  eq: (col3: string, val3: number) => {
                    return {
                      single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
                    };
                  },
                };
              },
            };
          },
        }),
      }));

      await budgetService.loadCurrentBudget('family-123');

      expect(budgetService.budget()).toBeNull();
    });

    it('deve tratar erro diferente de PGRST116', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: (col: string, val: string) => {
            return {
              eq: (col2: string, val2: number) => {
                return {
                  eq: (col3: string, val3: number) => {
                    return {
                      single: () => Promise.resolve({ data: null, error: { message: 'Database error', code: 'PGRST100' } }),
                    };
                  },
                };
              },
            };
          },
        }),
      }));

      await budgetService.loadCurrentBudget('family-123');

      expect(budgetService.budget()).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('loadBudgetHistory', () => {
    it('deve carregar histórico de orçamentos', async () => {
      const mockHistory = [
        { id: 'budget-1', family_id: 'family-123', year: 2024, month: 1, total_budget: 5000 },
        { id: 'budget-2', family_id: 'family-123', year: 2023, month: 12, total_budget: 4500 },
      ];

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: mockHistory, error: null }),
              }),
            }),
          }),
        }),
      }));

      await budgetService.loadBudgetHistory('family-123');

      expect(budgetService.history()).toHaveLength(2);
      expect(budgetService.history()[0]?.total_budget).toBe(5000);
    });

    it('deve tratar erro ao carregar histórico', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: null, error: { message: 'Error' } }),
              }),
            }),
          }),
        }),
      }));

      await budgetService.loadBudgetHistory('family-123');

      expect(budgetService.history()).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('createBudget', () => {
    it('deve criar orçamento com sucesso', async () => {
      const mockBudget = {
        id: 'budget-new-123',
        family_id: 'family-123',
        year: 2024,
        month: 1,
        total_budget: 5000,
        created_at: new Date().toISOString()
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'budgets' && callCount === 0) {
          callCount++;
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: mockBudget, error: null }),
              }),
            }),
            select: vi.fn(),
            eq: vi.fn(),
          };
        }
        if (table === 'budget_categories' && callCount === 1) {
          callCount++;
          return {
            insert: vi.fn(() => Promise.resolve({ error: null })),
            select: vi.fn(),
            eq: vi.fn(),
          };
        }
        if (table === 'budgets' && callCount === 2) {
          callCount++;
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: () => Promise.resolve({ data: mockBudget, error: null }),
              })),
            })),
            insert: vi.fn(),
          };
        }
        return mockSupabase.from(table);
      });

      const result = await budgetService.createBudget({
        family_id: 'family-123',
        year: 2024,
        month: 1,
        total_budget: 5000,
        categories: [
          { category_name: 'Alimentação', allocated_amount: 2000 },
          { category_name: 'Transporte', allocated_amount: 1000 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result?.total_budget).toBe(5000);
    });

    it('deve retornar null quando há erro ao criar orçamento', async () => {
      mockSupabase.from.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Error creating budget' } }),
          }),
        }),
        select: vi.fn(),
        eq: vi.fn(),
      });

      const result = await budgetService.createBudget({
        family_id: 'family-123',
        year: 2024,
        month: 1,
        total_budget: 5000,
        categories: [],
      });

      expect(result).toBeNull();
    });

    it('deve criar orçamento mesmo se categorias falharem', async () => {
      const mockBudget = {
        id: 'budget-new-123',
        family_id: 'family-123',
        year: 2024,
        month: 1,
        total_budget: 5000,
        created_at: new Date().toISOString()
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'budgets' && callCount === 0) {
          callCount++;
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: mockBudget, error: null }),
              }),
            }),
            select: vi.fn(),
            eq: vi.fn(),
          };
        }
        if (table === 'budget_categories' && callCount === 1) {
          callCount++;
          return {
            insert: vi.fn(() => Promise.resolve({ error: { message: 'Error creating categories' } })),
            select: vi.fn(),
            eq: vi.fn(),
          };
        }
        if (table === 'budgets' && callCount === 2) {
          callCount++;
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: () => Promise.resolve({ data: mockBudget, error: null }),
              })),
            })),
            insert: vi.fn(),
          };
        }
        return mockSupabase.from(table);
      });

      const result = await budgetService.createBudget({
        family_id: 'family-123',
        year: 2024,
        month: 1,
        total_budget: 5000,
        categories: [
          { category_name: 'Alimentação', allocated_amount: 2000 },
        ],
      });

      expect(result).not.toBeNull();
    });
  });

  describe('updateBudget', () => {
    it('deve atualizar orçamento com sucesso', async () => {
      mockSupabase.from.mockReturnValue({
        update: () => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        }),
      });

      await budgetService.updateBudget('budget-123', 6000);

      expect(mockSupabase.from).toHaveBeenCalledWith('budgets');
    });

    it('deve tratar erro ao atualizar orçamento', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockSupabase.from.mockReturnValue({
        update: () => ({
          eq: vi.fn(() => Promise.resolve({ error: { message: 'Update failed' } })),
        }),
      });

      await budgetService.updateBudget('budget-123', 6000);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('updateCategory', () => {
    it('deve atualizar categoria com sucesso', async () => {
      mockSupabase.from.mockReturnValue({
        update: () => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        }),
      });

      await budgetService.updateCategory('category-123', 2500);

      expect(mockSupabase.from).toHaveBeenCalledWith('budget_categories');
    });

    it('deve tratar erro ao atualizar categoria', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockSupabase.from.mockReturnValue({
        update: () => ({
          eq: vi.fn(() => Promise.resolve({ error: { message: 'Update failed' } })),
        }),
      });

      await budgetService.updateCategory('category-123', 2500);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
