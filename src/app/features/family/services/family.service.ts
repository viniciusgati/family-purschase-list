import { Injectable, signal } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { Family, FamilyWithMembers, Member } from '../../../core/models';

@Injectable({
  providedIn: 'root',
})
export class FamilyService {
  private currentFamily = signal<FamilyWithMembers | null>(null);
  readonly family = this.currentFamily.asReadonly();

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
  ) {}

  async loadUserFamily(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const { data: memberData } = await this.supabase
      .from('members')
      .select('family_id')
      .eq('user_id', userId)
      .single();

    if (!memberData) return;

    await this.loadFamily(memberData.family_id);
  }

  async loadFamily(familyId: string): Promise<void> {
    const { data: family, error } = await this.supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();

    if (error || !family) {
      console.error('Erro ao carregar família:', error?.message);
      return;
    }

    const { data: members } = await this.supabase
      .from('members')
      .select(
        `
        *,
        profile:profiles(display_name, avatar_url, email)
      `,
      )
      .eq('family_id', familyId);

    this.currentFamily.set({
      ...(family as Family),
      members: (members as Member[]) || [],
    });
  }

  async createFamily(name: string): Promise<Family | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;

    const inviteCode = this.generateInviteCode();

    const { data: family, error } = await this.supabase
      .from('families')
      .insert({ name, invite_code: inviteCode })
      .select()
      .single();

    if (error || !family) {
      console.error('Erro ao criar família:', error?.message);
      return null;
    }

    const { error: memberError } = await this.supabase.from('members').insert({
      user_id: userId,
      family_id: (family as Family).id,
      role: 'admin',
    });

    if (memberError) {
      console.error('Erro ao adicionar membro:', memberError.message);
      return null;
    }

    await this.loadFamily((family as Family).id);
    return family as Family;
  }

  async joinFamily(inviteCode: string): Promise<boolean> {
    const userId = this.auth.user()?.id;
    if (!userId) return false;

    const { data: family } = await this.supabase
      .from('families')
      .select('id')
      .eq('invite_code', inviteCode)
      .single();

    if (!family) {
      console.error('Código de convite inválido');
      return false;
    }

    const { error } = await this.supabase.from('members').insert({
      user_id: userId,
      family_id: (family as { id: string }).id,
      role: 'member',
    });

    if (error) {
      console.error('Erro ao entrar na família:', error.message);
      return false;
    }

    await this.loadFamily((family as { id: string }).id);
    return true;
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
