import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'payment' | 'committee' | 'member' | 'system';
  is_read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _notifications = signal<AppNotification[]>([]);
  notifications = this._notifications.asReadonly();
  unreadCount = computed(() => this._notifications().filter((n: AppNotification) => !n.is_read).length);
  private channel: any;

  constructor(private supabase: SupabaseService, private auth: AuthService) {
    this.auth.user$.subscribe(user => {
      if (user) { this.loadNotifications(user.id); this.subscribeToNotifications(user.id); }
      else { this._notifications.set([]); }
    });
  }

  async loadNotifications(userId: string) {
    const { data } = await this.supabase.client
      .from('notifications').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(50);
    this._notifications.set((data as AppNotification[]) ?? []);
  }

  subscribeToNotifications(userId: string) {
    if (this.channel) this.supabase.client.removeChannel(this.channel);
    this.channel = this.supabase.client
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload: any) => { this._notifications.update((n: AppNotification[]) => [payload.new as AppNotification, ...n]); })
      .subscribe();
  }

  async markAsRead(id: string) {
    await this.supabase.client.from('notifications').update({ is_read: true }).eq('id', id);
    this._notifications.update((ns: AppNotification[]) => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async markAllAsRead(userId: string) {
    await this.supabase.client.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    this._notifications.update((ns: AppNotification[]) => ns.map(n => ({ ...n, is_read: true })));
  }

  async createNotification(userId: string, title: string, message: string, type: AppNotification['type']) {
    await this.supabase.client.from('notifications').insert({ user_id: userId, title, message, type, is_read: false });
  }
}
