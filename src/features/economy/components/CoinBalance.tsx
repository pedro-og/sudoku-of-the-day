import { CoinIcon } from './CoinIcon';
import css from './CoinBalance.module.css';

interface CoinBalanceProps {
  balance: number;
  onClick?: () => void;
}

export function CoinBalance({ balance, onClick }: CoinBalanceProps) {
  return (
    <button type="button" className={css.badge} onClick={onClick} aria-label={`${balance} Sudokoins`}>
      <CoinIcon size={16} />
      <span className={css.value}>{balance}</span>
    </button>
  );
}
