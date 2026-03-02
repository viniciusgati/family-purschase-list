import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FamilyService } from './family.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';

describe('FamilyService', () => {
  let familyService: FamilyService;
  let mockSupabase: any;
  let mockAuth: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    };

    mockAuth = {
      user: vi.fn(() => ({ id: 'user-123' })),
    };

    familyService = new FamilyService(
      mockSupabase as unknown as SupabaseService,
      mockAuth as unknown as AuthService
    );
    vi.clearAllMocks();
  });

  describe('loadUserFamily', () => {
    it('deve retornar early se não há usuário', async () => {
      mockAuth.user = vi.fn(() => null);
      
      familyService = new FamilyService(
        mockSupabase as unknown as SupabaseService,
        mockAuth as unknown as AuthService
      );
      
      await familyService.loadUserFamily();
      
      expect(familyService.family()).toBeNull();
    });

    it('deve carregar família do usuário quando existe membro', async () => {
      const mockMemberData = { family_id: 'family-123' };
      const mockFamily = { 
        id: 'family-123', 
        name: 'Família Silva', 
        invite_code: 'ABC12345',
        created_at: new Date().toISOString()
      };
      const mockMembers = [
        { 
          id: 'member-1', 
          user_id: 'user-123', 
          family_id: 'family-123',
          role: 'admin',
          joined_at: new Date().toISOString(),
          profile: { display_name: 'João', avatar_url: null, email: 'joao@test.com' }
        }
      ];

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'members' && callCount === 0) {
          callCount++;
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockMemberData, error: null }),
              }),
            }),
            insert: vi.fn(),
          };
        }
        if (table === 'families' && callCount === 1) {
          callCount++;
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockFamily, error: null }),
              }),
            }),
            insert: vi.fn(),
          };
        }
        if (table === 'members' && callCount === 2) {
          callCount++;
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: mockMembers, error: null }),
            }),
            insert: vi.fn(),
          };
        }
        return mockSupabase.from(table);
      });

      await familyService.loadUserFamily();

      expect(familyService.family()).not.toBeNull();
      expect(familyService.family()?.name).toBe('Família Silva');
    });

    it('deve retornar null se usuário não tem família', async () => {
      mockSupabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        insert: vi.fn(),
      });

      await familyService.loadUserFamily();

      expect(familyService.family()).toBeNull();
    });
  });

  describe('createFamily', () => {
    it('deve retornar null se não há usuário logado', async () => {
      mockAuth.user = vi.fn(() => null);
      
      familyService = new FamilyService(
        mockSupabase as unknown as SupabaseService,
        mockAuth as unknown as AuthService
      );

      const result = await familyService.createFamily('Nova Família');

      expect(result).toBeNull();
    });

    it('deve criar família com sucesso', async () => {
      const mockFamily = {
        id: 'family-new-123',
        name: 'Nova Família',
        invite_code: 'XYZ98765',
        created_at: new Date().toISOString()
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'families' && callCount === 0) {
          callCount++;
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: mockFamily, error: null }),
              }),
            }),
            select: vi.fn(),
          };
        }
        if (table === 'members' && callCount === 1) {
          callCount++;
          return {
            insert: () => Promise.resolve({ error: null }),
            select: vi.fn(),
          };
        }
        if (table === 'families' && callCount === 2) {
          callCount++;
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockFamily, error: null }),
              }),
            }),
            insert: vi.fn(),
          };
        }
        if (table === 'members' && callCount === 3) {
          callCount++;
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
            insert: vi.fn(),
          };
        }
        return mockSupabase.from(table);
      });

      const result = await familyService.createFamily('Nova Família');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Nova Família');
    });

    it('deve retornar null quando há erro ao criar família', async () => {
      mockSupabase.from.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Error creating family' } }),
          }),
        }),
        select: vi.fn(),
      });

      const result = await familyService.createFamily('Nova Família');

      expect(result).toBeNull();
    });

    it('deve retornar null quando há erro ao adicionar membro', async () => {
      const mockFamily = {
        id: 'family-new-123',
        name: 'Nova Família',
        invite_code: 'XYZ98765',
        created_at: new Date().toISOString()
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'families' && callCount === 0) {
          callCount++;
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: mockFamily, error: null }),
              }),
            }),
            select: vi.fn(),
          };
        }
        if (table === 'members' && callCount === 1) {
          callCount++;
          return {
            insert: () => Promise.resolve({ error: { message: 'Error adding member' } }),
            select: vi.fn(),
          };
        }
        return mockSupabase.from(table);
      });

      const result = await familyService.createFamily('Nova Família');

      expect(result).toBeNull();
    });
  });

  describe('joinFamily', () => {
    it('deve retornar false se não há usuário logado', async () => {
      mockAuth.user = vi.fn(() => null);
      
      familyService = new FamilyService(
        mockSupabase as unknown as SupabaseService,
        mockAuth as unknown as AuthService
      );

      const result = await familyService.joinFamily('ABC12345');

      expect(result).toBe(false);
    });

    it('deve retornar false se código de convite é inválido', async () => {
      mockSupabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        insert: vi.fn(),
      });

      const result = await familyService.joinFamily('INVALID');

      expect(result).toBe(false);
    });

    it('deve entrar na família com sucesso', async () => {
      const mockFamily = { id: 'family-123' };
      const mockFamilyWithMembers = {
        ...mockFamily,
        name: 'Família Silva',
        invite_code: 'ABC12345',
        created_at: new Date().toISOString(),
        members: []
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'families' && callCount === 0) {
          callCount++;
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockFamily, error: null }),
              }),
            }),
            insert: vi.fn(),
          };
        }
        if (table === 'members' && callCount === 1) {
          callCount++;
          return {
            insert: () => Promise.resolve({ error: null }),
            select: vi.fn(),
          };
        }
        if (table === 'families' && callCount === 2) {
          callCount++;
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockFamilyWithMembers, error: null }),
              }),
            }),
            insert: vi.fn(),
          };
        }
        if (table === 'members' && callCount === 3) {
          callCount++;
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
            insert: vi.fn(),
          };
        }
        return mockSupabase.from(table);
      });

      const result = await familyService.joinFamily('ABC12345');

      expect(result).toBe(true);
    });

    it('deve retornar false se há erro ao entrar na família', async () => {
      const mockFamily = { id: 'family-123' };

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'families' && callCount === 0) {
          callCount++;
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockFamily, error: null }),
              }),
            }),
            insert: vi.fn(),
          };
        }
        if (table === 'members' && callCount === 1) {
          callCount++;
          return {
            insert: () => Promise.resolve({ error: { message: 'Already a member' } }),
            select: vi.fn(),
          };
        }
        return mockSupabase.from(table);
      });

      const result = await familyService.joinFamily('ABC12345');

      expect(result).toBe(false);
    });
  });
});
