import type { Wallet } from '@/types';
import { SHOP_ITEMS, type ShopItemId } from './coinEconomy';

const WALLET_KEY = 'daily-sudoku:wallet';

const EMPTY_WALLET: Wallet = { balance: 0, streakFreezes: 0, undoTokens: 0 };

export function loadWallet(): Wallet {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (raw) return { ...EMPTY_WALLET, ...(JSON.parse(raw) as Partial<Wallet>) };
  } catch { /* ignore */ }
  return { ...EMPTY_WALLET };
}

function saveWallet(wallet: Wallet): void {
  try { localStorage.setItem(WALLET_KEY, JSON.stringify(wallet)); } catch { /* ignore */ }
}

/** Credits coins to the local wallet (anonymous players). Idempotency is
 * the caller's responsibility (mirrors the existing completion guards). */
export function addCoins(amount: number): Wallet {
  const wallet = loadWallet();
  const updated: Wallet = { ...wallet, balance: wallet.balance + Math.max(0, amount) };
  saveWallet(updated);
  return updated;
}

/**
 * Attempts to purchase a shop item. Returns the updated wallet on success,
 * or null when the player can't afford it or is at the item's max stock.
 */
export function purchaseItem(item: ShopItemId): Wallet | null {
  const wallet = loadWallet();
  const { price, maxOwned } = SHOP_ITEMS[item];
  const owned = item === 'streakFreeze' ? wallet.streakFreezes : wallet.undoTokens;

  if (wallet.balance < price || owned >= maxOwned) return null;

  const updated: Wallet = {
    ...wallet,
    balance: wallet.balance - price,
    streakFreezes: wallet.streakFreezes + (item === 'streakFreeze' ? 1 : 0),
    undoTokens: wallet.undoTokens + (item === 'undoToken' ? 1 : 0),
  };
  saveWallet(updated);
  return updated;
}

/** Consumes one undo token. Returns the updated wallet, or null if none left. */
export function consumeUndoToken(): Wallet | null {
  const wallet = loadWallet();
  if (wallet.undoTokens <= 0) return null;
  const updated: Wallet = { ...wallet, undoTokens: wallet.undoTokens - 1 };
  saveWallet(updated);
  return updated;
}

/** Consumes one streak freeze (used by the automatic Duolingo-style freeze). */
export function consumeStreakFreeze(): Wallet | null {
  const wallet = loadWallet();
  if (wallet.streakFreezes <= 0) return null;
  const updated: Wallet = { ...wallet, streakFreezes: wallet.streakFreezes - 1 };
  saveWallet(updated);
  return updated;
}
