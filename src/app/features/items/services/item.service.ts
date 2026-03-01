import { Injectable, signal } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { Item, CreateItemDto, UpdateItemDto } from '../../../core/models';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private items = signal<Item[]>([]);
  readonly allItems = this.items.asReadonly();

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
  ) {}

  async loadItems(listId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('items')
      .select(
        `
        *,
        added_by_profile:profiles!added_by(display_name, avatar_url)
      `,
      )
      .eq('list_id', listId)
      .order('priority_order', { ascending: true });

    if (error) {
      console.error('Erro ao carregar itens:', error.message);
      return;
    }

    this.items.set((data as Item[]) || []);
  }

  async createItem(dto: CreateItemDto): Promise<Item | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;

    const maxOrder = this.items().reduce((max, item) => Math.max(max, item.priority_order), 0);

    const { data, error } = await this.supabase
      .from('items')
      .insert({
        ...dto,
        added_by: userId,
        priority_order: maxOrder + 1,
        status: 'pending',
        is_purchased: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar item:', error.message);
      return null;
    }

    const item = data as Item;
    this.items.update((current) => [...current, item]);
    return item;
  }

  async updateItem(id: string, updates: UpdateItemDto): Promise<void> {
    const { error } = await this.supabase
      .from('items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar item:', error.message);
      return;
    }

    this.items.update((current) => current.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await this.supabase.from('items').delete().eq('id', id);

    if (error) {
      console.error('Erro ao deletar item:', error.message);
      return;
    }

    this.items.update((current) => current.filter((i) => i.id !== id));
  }

  async markAsPurchased(id: string, actualPrice: number): Promise<void> {
    const userId = this.auth.user()?.id;
    await this.updateItem(id, {
      is_purchased: true,
      status: 'purchased',
      actual_price: actualPrice,
    });

    this.items.update((current) =>
      current.map((i) =>
        i.id === id
          ? {
              ...i,
              is_purchased: true,
              status: 'purchased' as const,
              actual_price: actualPrice,
              purchased_by: userId || null,
              purchased_at: new Date().toISOString(),
            }
          : i,
      ),
    );
  }

  async reorderItems(items: Item[]): Promise<void> {
    const updates = items.map((item, index) => ({
      id: item.id,
      priority_order: index + 1,
    }));

    for (const update of updates) {
      await this.supabase
        .from('items')
        .update({ priority_order: update.priority_order })
        .eq('id', update.id);
    }

    this.items.set(items.map((item, index) => ({ ...item, priority_order: index + 1 })));
  }
}
