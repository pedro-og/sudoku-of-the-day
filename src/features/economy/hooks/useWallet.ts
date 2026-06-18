import { useCallback, useEffect, useState } from 'react';
import type { Wallet } from '@/types';
import { useAuth } from '@features/auth/context/AuthContext';
import {
  purchaseItem as purchaseItemApi,
  consumeUndoToken as consumeUndoTokenApi,
} from '@features/auth/lib/authApi';
import {
  loadWallet,
  purchaseItem as purchaseItemLocal,
  consumeUndoToken as consumeUndoTokenLocal,
} from '../lib/wallet';
import type { ShopItemId } from '../lib/coinEconomy';

export interface UseWallet {
  wallet: Wallet;
  /** Buy a shop item. Returns true on success. */
  purchase: (item: ShopItemId) => Promise<boolean>;
  /** Consume one undo token. Returns true if one was available. */
  useUndoToken: () => Promise<boolean>;
  /** Re-read the wallet (e.g. after a completion credited coins server-side). */
  refresh: () => void;
}

/**
 * Hybrid wallet, mirroring useStreak: when logged in, the server profile is
 * the source of truth; when anonymous, localStorage is.
 */
export function useWallet(): UseWallet {
  const { session, profile, refreshProfile } = useAuth();
  const [localWallet, setLocalWallet] = useState<Wallet>(() => loadWallet());

  const serverWallet: Wallet | null = session && profile
    ? {
        balance: profile.sudokoins,
        streakFreezes: profile.streak_freezes,
        undoTokens: profile.undo_tokens,
      }
    : null;

  const wallet = serverWallet ?? localWallet;

  const refresh = useCallback(() => {
    if (session) {
      refreshProfile();
    } else {
      setLocalWallet(loadWallet());
    }
  }, [session, refreshProfile]);

  // Keep local wallet fresh when switching away from a session.
  useEffect(() => {
    if (!session) setLocalWallet(loadWallet());
  }, [session]);

  const purchase = useCallback(async (item: ShopItemId): Promise<boolean> => {
    if (session && profile) {
      const res = await purchaseItemApi(profile.id, item);
      if (res?.ok) {
        await refreshProfile();
        return true;
      }
      return false;
    }
    const updated = purchaseItemLocal(item);
    if (updated) {
      setLocalWallet(updated);
      return true;
    }
    return false;
  }, [session, profile, refreshProfile]);

  const useUndoToken = useCallback(async (): Promise<boolean> => {
    if (session && profile) {
      const ok = await consumeUndoTokenApi(profile.id);
      if (ok) await refreshProfile();
      return ok;
    }
    const updated = consumeUndoTokenLocal();
    if (updated) {
      setLocalWallet(updated);
      return true;
    }
    return false;
  }, [session, profile, refreshProfile]);

  // Anonymous: credit happens client-side in useGamePersistence, which writes
  // to localStorage. Pick up those writes on mount and on focus.
  useEffect(() => {
    if (session) return;
    const handler = () => setLocalWallet(loadWallet());
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [session]);

  return { wallet, purchase, useUndoToken, refresh };
}
