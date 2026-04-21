import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';

export interface PlayerProfile {
  id: string;
  username: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  preferences: { language?: string; theme?: 'light' | 'dark' };
  auth_user_id: string | null;
  avg_solve_time_seconds: number | null;
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/account`,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function linkAnonymousPlayer(anonId: string | null): Promise<PlayerProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('link_anonymous_player', { p_anon_id: anonId });
  if (error || !data) return null;
  const profile = data as PlayerProfile;
  // link_anonymous_player doesn't compute avg_solve_time_seconds; fetch via get_me
  // so the menu renders the full profile (name, streak, avg time) correctly.
  if (profile.avg_solve_time_seconds == null) {
    const full = await getMe();
    if (full) return full;
  }
  return profile;
}

export async function getMe(): Promise<PlayerProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_me');
  if (error || !data) return null;
  return data as PlayerProfile;
}

export async function setPreferences(prefs: {
  language?: string;
  theme?: 'light' | 'dark';
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.rpc('set_preferences', { p_prefs: prefs });
}
