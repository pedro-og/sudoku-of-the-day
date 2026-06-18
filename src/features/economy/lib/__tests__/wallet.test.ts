import { loadWallet, addCoins, purchaseItem, consumeUndoToken, consumeStreakFreeze } from '../wallet';
import { SHOP_ITEMS } from '../coinEconomy';

beforeEach(() => localStorage.clear());

describe('wallet', () => {
  it('starts empty', () => {
    expect(loadWallet()).toEqual({ balance: 0, streakFreezes: 0, undoTokens: 0 });
  });

  it('adds coins', () => {
    expect(addCoins(30).balance).toBe(30);
    expect(addCoins(20).balance).toBe(50);
  });

  it('ignores negative credits', () => {
    expect(addCoins(-10).balance).toBe(0);
  });

  it('purchases an undo token when affordable', () => {
    addCoins(SHOP_ITEMS.undoToken.price);
    const w = purchaseItem('undoToken');
    expect(w?.undoTokens).toBe(1);
    expect(w?.balance).toBe(0);
  });

  it('rejects a purchase the player cannot afford', () => {
    addCoins(SHOP_ITEMS.undoToken.price - 1);
    expect(purchaseItem('undoToken')).toBeNull();
  });

  it('caps streak freezes at the max', () => {
    addCoins(SHOP_ITEMS.streakFreeze.price * 3);
    purchaseItem('streakFreeze');
    purchaseItem('streakFreeze');
    expect(purchaseItem('streakFreeze')).toBeNull();
    expect(loadWallet().streakFreezes).toBe(2);
  });

  it('consumes an undo token only when available', () => {
    expect(consumeUndoToken()).toBeNull();
    addCoins(SHOP_ITEMS.undoToken.price);
    purchaseItem('undoToken');
    expect(consumeUndoToken()?.undoTokens).toBe(0);
  });

  it('consumes a streak freeze only when available', () => {
    expect(consumeStreakFreeze()).toBeNull();
    addCoins(SHOP_ITEMS.streakFreeze.price);
    purchaseItem('streakFreeze');
    expect(consumeStreakFreeze()?.streakFreezes).toBe(0);
  });
});
