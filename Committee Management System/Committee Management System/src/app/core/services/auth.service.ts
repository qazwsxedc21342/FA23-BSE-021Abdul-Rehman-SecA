import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  cnic?: string;
  avatar_url?: string;
  reputation_score: number;
  completed_committees_count: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = new BehaviorSubject<any>(null);
  private _profile = new BehaviorSubject<any>(null);
  private _loading = signal(true);

  user$ = this._user.asObservable();
  profile$ = this._profile.asObservable();

  get currentUser() { return this._user.value; }
  get currentProfile() { return this._profile.value; }
  get isLoading() { return this._loading(); }

  constructor(private supabase: SupabaseService, private router: Router) {
    this.supabase.client.auth.getSession().then(({ data }: any) => {
      this._user.next(data.session?.user ?? null);
      if (data.session?.user) this.loadProfile(data.session.user.id);
      this._loading.set(false);
    });

    this.supabase.client.auth.onAuthStateChange((event: any, session: any) => {
      this._user.next(session?.user ?? null);
      if (session?.user) { this.loadProfile(session.user.id); }
      else { this._profile.next(null); }
    });
  }

  async loadProfile(userId: string) {
    const { data } = await this.supabase.client
      .from('profiles').select('*').eq('id', userId).single();
    this._profile.next(data ?? null);
  }

  async signUp(email: string, password: string, fullName: string, phone: string): Promise<{ error: string | null }> {
    const { data, error } = await this.supabase.client.auth.signUp({ email, password });
    if (error) return { error: (error as any).message };
    if ((data as any)?.user) {
      await this.supabase.client.from('profiles').upsert({
        id: (data as any).user.id, full_name: fullName, email, phone,
        reputation_score: 100, completed_committees_count: 0,
      });
    }
    return { error: null };
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    return { error: error ? (error as any).message : null };
  }

  async signOut() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/auth/login']);
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    return { error: error ? (error as any).message : null };
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<{ error: string | null }> {
    const user = this.currentUser;
    if (!user) return { error: 'Not authenticated' };
    const { error } = await this.supabase.client.from('profiles').update(updates).eq('id', user.id);
    if (!error) await this.loadProfile(user.id);
    return { error: error ? (error as any).message : null };
  }
}
