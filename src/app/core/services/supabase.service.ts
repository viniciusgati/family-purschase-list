import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    __env__: {
      SUPABASE_URL?: string;
      SUPABASE_ANONKEY?: string;
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    console.log('[SupabaseService] Initializing...');
    console.log('[SupabaseService] environment:', environment);

    // Get values from environment file or runtime injection
    const url = environment.supabase?.url || window.__env__?.SUPABASE_URL || '';
    const key = environment.supabase?.anonKey || window.__env__?.SUPABASE_ANONKEY || '';

    console.log('[SupabaseService] URL:', url);
    console.log('[SupabaseService] Key present:', !!key);
    
    // Use URL if valid
    const isValidUrl = url && url !== 'YOUR_SUPABASE_URL' && !url.includes('placeholder');
    
    if (!isValidUrl) {
      console.error('[SupabaseService] ERROR: Invalid URL!');
      this.supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: { persistSession: false },
      });
    } else if (!key) {
      console.error('[SupabaseService] ERROR: Missing anon key!');
      this.supabase = createClient(url, 'placeholder-key', {
        auth: { persistSession: false },
      });
    } else {
      console.log('[SupabaseService] Creating client with URL:', url);
      this.supabase = createClient(url, key);
      console.log('[SupabaseService] Client created');
    }
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }

  get storage() {
    return this.supabase.storage;
  }

  from(table: string) {
    return this.supabase.from(table);
  }

  channel(name: string) {
    return this.supabase.channel(name);
  }
}
