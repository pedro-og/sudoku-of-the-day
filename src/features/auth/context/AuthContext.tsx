import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import i18n from '@/i18n';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  getSession,
  linkAnonymousPlayer,
  getMe,
  setPreferences as setPreferencesApi,
  signInWithGoogle as signInWithGoogleApi,
  signOut as signOutApi,
  type PlayerProfile,
} from '../lib/authApi';
import { getPlayerId, setAuthenticatedPlayer, clearAuthenticatedPlayer } from '@features/daily/lib/playerIdentity';
import { saveTheme } from '@shared/lib/localGameStorage';

interface AuthContextValue {
  session: Session | null;
  profile: PlayerProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updatePreferences: (prefs: { language?: string; theme?: 'light' | 'dark' }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const linkedForUserRef = useRef<string | null>(null);

  const applyProfilePreferences = useCallback((p: PlayerProfile | null) => {
    if (!p?.preferences) return;
    if (p.preferences.language && p.preferences.language !== i18n.language) {
      i18n.changeLanguage(p.preferences.language);
    }
    if (p.preferences.theme) {
      document.documentElement.setAttribute('data-theme', p.preferences.theme);
      saveTheme(p.preferences.theme);
    }
  }, []);

  const loadProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setProfile(null);
      clearAuthenticatedPlayer();
      return;
    }

    const userId = currentSession.user.id;

    // Only link once per user per mount; subsequent loads use get_me.
    let p: PlayerProfile | null;
    if (linkedForUserRef.current !== userId) {
      const anonId = getPlayerId();
      p = await linkAnonymousPlayer(anonId);
      linkedForUserRef.current = userId;
    } else {
      p = await getMe();
    }

    setProfile(p);
    if (p) {
      setAuthenticatedPlayer(p.id, p.username);
      applyProfilePreferences(p);
    }
  }, [applyProfilePreferences]);

  // Initial session load + subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      const current = await getSession();
      if (!mounted) return;
      setSession(current);
      await loadProfile(current);
      if (mounted) setLoading(false);
    })();

    const supabase = getSupabase();
    const { data: listener } = supabase!.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      await loadProfile(newSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signInWithGoogle = useCallback(async () => {
    await signInWithGoogleApi();
  }, []);

  const signOut = useCallback(async () => {
    await signOutApi();
    linkedForUserRef.current = null;
    setProfile(null);
    clearAuthenticatedPlayer();
  }, []);

  const updatePreferences = useCallback(async (prefs: { language?: string; theme?: 'light' | 'dark' }) => {
    if (!session) return;
    await setPreferencesApi(prefs);
    setProfile(prev => prev ? { ...prev, preferences: { ...prev.preferences, ...prefs } } : prev);
  }, [session]);

  const refreshProfile = useCallback(async () => {
    if (!session) return;
    const p = await getMe();
    setProfile(p);
  }, [session]);

  const value = useMemo<AuthContextValue>(() => ({
    session, profile, loading,
    signInWithGoogle, signOut, updatePreferences, refreshProfile,
  }), [session, profile, loading, signInWithGoogle, signOut, updatePreferences, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
