import { Injectable, signal } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { PurchaseList, CreateListDto } from '../../../core/models';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  private lists = signal<PurchaseList[]>([]);
  readonly allLists = this.lists.asReadonly();

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
  ) {}

  async loadLists(familyId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('lists')
      .select(
        `
        *,
        owner:profiles!owner_id(display_name, avatar_url)
      `,
      )
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar listas:', error.message);
      return;
    }

    this.lists.set((data as PurchaseList[]) || []);
  }

  async createList(dto: CreateListDto): Promise<PurchaseList | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;

    const { data, error } = await this.supabase
      .from('lists')
      .insert({ ...dto, owner_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar lista:', error.message);
      return null;
    }

    const list = data as PurchaseList;
    this.lists.update((current) => [list, ...current]);
    return list;
  }

  async updateList(id: string, updates: Partial<PurchaseList>): Promise<void> {
    const { error } = await this.supabase.from('lists').update(updates).eq('id', id);

    if (error) {
      console.error('Erro ao atualizar lista:', error.message);
      return;
    }

    this.lists.update((current) => current.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }

  async deleteList(id: string): Promise<void> {
    const { error } = await this.supabase.from('lists').delete().eq('id', id);

    if (error) {
      console.error('Erro ao deletar lista:', error.message);
      return;
    }

    this.lists.update((current) => current.filter((l) => l.id !== id));
  }

  async getListById(id: string): Promise<PurchaseList | null> {
    const { data, error } = await this.supabase
      .from('lists')
      .select(
        `
        *,
        owner:profiles!owner_id(display_name, avatar_url)
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao carregar lista:', error.message);
      return null;
    }

    return data as PurchaseList;
  }
}
