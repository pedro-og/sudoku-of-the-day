import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';

export interface PlayerProfile {
  id: string;
  username: string;
  current_streak: number;
  longest_streak: number;
  perfect_streak: number;
  longest_perfect_streak: number;
  last_completed_date: string | null;
  preferences: { language?: string; theme?: 'light' | 'dark' };
  auth_user_id: string | null;
  avg_solve_time_seconds: number | null;
  sudokoins: number;
  streak_freezes: number;
  undo_tokens: number;
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

export interface MyCompletion {
  puzzle_number: number;
  elapsed_seconds: number;
  mistakes: number;
  solved: boolean;
}

export async function getMyCompletion(puzzleNumber: number): Promise<MyCompletion | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_my_completion', { p_puzzle_number: puzzleNumber });
  if (error || !data) return null;
  return data as MyCompletion;
}

export async function setPreferences(prefs: {
  language?: string;
  theme?: 'light' | 'dark';
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.rpc('set_preferences', { p_prefs: prefs });
}

export interface PurchaseResult {
  ok: boolean;
  error?: 'insufficient' | 'maxOwned';
  sudokoins?: number;
  streak_freezes?: number;
  undo_tokens?: number;
}

export async function purchaseItem(playerId: string, item: 'streakFreeze' | 'undoToken'): Promise<PurchaseResult | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('purchase_item', { p_player_id: playerId, p_item: item });
  if (error || !data) return null;
  return data as PurchaseResult;
}

export async function consumeUndoToken(playerId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('consume_undo_token', { p_player_id: playerId });
  if (error || !data) return false;
  return (data as { ok: boolean }).ok;
}

export interface WeekCalendarResponse {
  week_start: string;
  completed: string[];
  frozen: string[];
}

export async function getWeekCalendar(playerId: string, today: string): Promise<WeekCalendarResponse | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_week_calendar', { p_player_id: playerId, p_today: today });
  if (error || !data) return null;
  return data as WeekCalendarResponse;
}
