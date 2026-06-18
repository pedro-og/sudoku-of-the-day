// Components
export { Shop } from './components/Shop';
export { CoinBalance } from './components/CoinBalance';
export { CoinIcon } from './components/CoinIcon';
export { CoinBreakdown } from './components/CoinBreakdown';
export { WeekStrip } from './components/WeekStrip';

// Hooks
export { useWallet } from './hooks/useWallet';

// Lib
export { calculateRewards, COIN_ECONOMY, SHOP_ITEMS } from './lib/coinEconomy';
export type { ShopItemId } from './lib/coinEconomy';
export { getWeekStatuses, getWeekDates, isPerfectWeek } from './lib/weekCalendar';
export * from './lib/wallet';
