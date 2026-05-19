import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Committee {
  id: string;
  creator_id: string;
  name: string;
  description?: string;
  monthly_amount: number;
  duration_months: number;
  max_members: number;
  current_members: number;
  start_date: string;
  status: 'open' | 'active' | 'completed' | 'cancelled';
  rules?: string;
  payment_deadline: number;
  iban?: string;
  payment_method?: string;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string; reputation_score: number };
}

export interface CommitteeMember {
  id: string;
  committee_id: string;
  user_id: string;
  position: number;
  status: 'pending' | 'approved' | 'rejected' | 'removed';
  joined_at: string;
  profiles?: { full_name: string; avatar_url: string; email: string; phone: string; reputation_score: number };
}

@Injectable({ providedIn: 'root' })
export class CommitteeService {
  constructor(private supabase: SupabaseService, private auth: AuthService) {}

  async getCommittees(statusFilter?: string): Promise<Committee[]> {
    let query = this.supabase.client
      .from('committees')
      .select('*, profiles(full_name, avatar_url, reputation_score)')
      .order('created_at', { ascending: false });
    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data } = await query;
    return data ?? [];
  }

  async getCommitteeById(id: string): Promise<Committee | null> {
    const { data } = await this.supabase.client
      .from('committees')
      .select('*, profiles(full_name, avatar_url, reputation_score)')
      .eq('id', id)
      .single();
    return data;
  }

  async getMyCommittees(): Promise<{ created: Committee[]; joined: Committee[] }> {
    const userId = this.auth.currentUser?.id;
    if (!userId) return { created: [], joined: [] };
    const { data: created } = await this.supabase.client
      .from('committees')
      .select('*, profiles(full_name, avatar_url, reputation_score)')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
    const { data: memberships } = await this.supabase.client
      .from('committee_members')
      .select('committee_id, committees(*, profiles(full_name, avatar_url, reputation_score))')
      .eq('user_id', userId)
      .eq('status', 'approved');
    const joined = (memberships ?? []).map((m: any) => m.committees).filter(Boolean);
    return { created: created ?? [], joined };
  }

  async createCommittee(data: Partial<Committee>): Promise<{ data: Committee | null; error: string | null }> {
    const userId = this.auth.currentUser?.id;
    if (!userId) return { data: null, error: 'Not authenticated' };
    const committee = { ...data, creator_id: userId, current_members: 1, status: 'open' };
    const { data: newCommittee, error } = await this.supabase.client
      .from('committees').insert(committee).select().single();
    if (!error && newCommittee) {
      await this.supabase.client.from('committee_members').insert({
        committee_id: newCommittee.id, user_id: userId, position: 1, status: 'approved'
      });
      await this.generatePayoutSchedule(newCommittee);
    }
    return { data: newCommittee, error: error?.message ?? null };
  }

  async generatePayoutSchedule(committee: Committee) {
    const { data: members } = await this.supabase.client
      .from('committee_members').select('id, position')
      .eq('committee_id', committee.id).eq('status', 'approved').order('position');
    if (!members) return;
    const schedule = members.map((m: any, i: number) => ({
      committee_id: committee.id,
      month_number: i + 1,
      recipient_member_id: m.id,
      payout_date: new Date(new Date(committee.start_date).setMonth(new Date(committee.start_date).getMonth() + i)).toISOString().split('T')[0],
      payout_amount: committee.monthly_amount * committee.max_members,
      status: 'pending'
    }));
    await this.supabase.client.from('payout_schedule').insert(schedule);
  }

  async requestJoin(committeeId: string): Promise<{ error: string | null }> {
    const userId = this.auth.currentUser?.id;
    if (!userId) return { error: 'Not authenticated' };
    const { data: existing } = await this.supabase.client
      .from('committee_members').select('id').eq('committee_id', committeeId).eq('user_id', userId).single();
    if (existing) return { error: 'Already a member or request pending' };
    const { data: committee } = await this.supabase.client
      .from('committees').select('current_members, max_members').eq('id', committeeId).single();
    if (!committee || committee.current_members >= committee.max_members) return { error: 'Committee is full' };
    const { error } = await this.supabase.client.from('committee_members').insert({
      committee_id: committeeId, user_id: userId, position: committee.current_members + 1, status: 'pending'
    });
    return { error: error?.message ?? null };
  }

  async approveRejectMember(memberId: string, approve: boolean): Promise<{ error: string | null }> {
    const newStatus = approve ? 'approved' : 'rejected';
    const { data: member } = await this.supabase.client
      .from('committee_members').select('committee_id').eq('id', memberId).single();
    const { error } = await this.supabase.client
      .from('committee_members').update({ status: newStatus }).eq('id', memberId);
    if (!error && approve && member) {
      const { data: c } = await this.supabase.client.from('committees').select('current_members').eq('id', member.committee_id).single();
      if (c) await this.supabase.client.from('committees').update({ current_members: (c as any).current_members + 1 }).eq('id', member.committee_id);
    }
    return { error: error?.message ?? null };
  }

  async getMembers(committeeId: string): Promise<CommitteeMember[]> {
    const { data } = await this.supabase.client
      .from('committee_members')
      .select('*, profiles(full_name, avatar_url, email, phone, reputation_score)')
      .eq('committee_id', committeeId)
      .order('position');
    return data ?? [];
  }

  async removeMember(memberId: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client
      .from('committee_members').update({ status: 'removed' }).eq('id', memberId);
    return { error: error?.message ?? null };
  }

  async getPayoutSchedule(committeeId: string) {
    const { data } = await this.supabase.client
      .from('payout_schedule')
      .select('*, committee_members(user_id, profiles(full_name))')
      .eq('committee_id', committeeId)
      .order('month_number');
    return data ?? [];
  }

  async updateStatus(committeeId: string, status: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client
      .from('committees').update({ status }).eq('id', committeeId);
    return { error: error?.message ?? null };
  }

  subscribeToCommittee(committeeId: string, callback: (payload: any) => void) {
    return this.supabase.client
      .channel(`committee-${committeeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'committee_members', filter: `committee_id=eq.${committeeId}` }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `committee_id=eq.${committeeId}` }, callback)
      .subscribe();
  }
}
