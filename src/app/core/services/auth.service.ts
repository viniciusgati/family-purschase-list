import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private currentProfile = signal<Profile | null>(null);
  private loading = signal(true);

  readonly user = this.currentUser.asReadonly();
  readonly profile = this.currentProfile.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {
    this.initAuthListener();
  }

  private async initAuthListener(): Promise<void> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    if (session?.user) {
      this.currentUser.set(session.user);
      await this.loadProfile(session.user.id);
    }
    this.loading.set(false);

    this.supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          this.currentUser.set(session.user);
          await this.upsertProfile(session.user);
          await this.loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.currentUser.set(null);
          this.currentProfile.set(null);
          this.router.navigate(['/login']);
        }
      },
    );
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Erro ao fazer login com Google:', error.message);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error.message);
      throw error;
    }
  }

  private async upsertProfile(user: User): Promise<void> {
    const { error } = await this.supabase.from('profiles').upsert(
      {
        id: user.id,
        display_name: user.user_metadata['full_name'] || user.email?.split('@')[0] || 'Usuário',
        avatar_url: user.user_metadata['avatar_url'] || null,
        email: user.email || '',
      },
      { onConflict: 'id' },
    );

    if (error) {
      console.error('Erro ao criar/atualizar perfil:', error.message);
    }
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao carregar perfil:', error.message);
      return;
    }

    this.currentProfile.set(data as Profile);
  }
}
