import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@shared/components/Modal/Modal';
import { Button } from '@shared/components/Button/Button';
import { SHOP_ITEMS, type ShopItemId } from '../lib/coinEconomy';
import { useWallet } from '../hooks/useWallet';
import { CoinIcon } from './CoinIcon';
import css from './Shop.module.css';

interface ShopProps {
  open: boolean;
  onClose: () => void;
}

interface ItemMeta {
  id: ShopItemId;
  icon: string;
  owned: number;
}

export function Shop({ open, onClose }: ShopProps) {
  const { t } = useTranslation();
  const { wallet, purchase } = useWallet();
  const [pending, setPending] = useState<ShopItemId | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const items: ItemMeta[] = [
    { id: 'streakFreeze', icon: '🧊', owned: wallet.streakFreezes },
    { id: 'undoToken', icon: '↩️', owned: wallet.undoTokens },
  ];

  async function handleBuy(id: ShopItemId) {
    setError(null);
    setPending(id);
    const { price, maxOwned } = SHOP_ITEMS[id];
    const owned = id === 'streakFreeze' ? wallet.streakFreezes : wallet.undoTokens;
    if (owned >= maxOwned) {
      setError(t('shop.maxOwned'));
      setPending(null);
      return;
    }
    if (wallet.balance < price) {
      setError(t('shop.insufficient'));
      setPending(null);
      return;
    }
    const ok = await purchase(id);
    if (!ok) setError(t('shop.purchaseFailed'));
    setPending(null);
  }

  return (
    <Modal open onClose={onClose} ariaLabel={t('shop.title')}>
      <div className={css.header}>
        <h2 className={css.title}>{t('shop.title')}</h2>
        <div className={css.balance}><CoinIcon size={18} /> {wallet.balance}</div>
      </div>

      {error && <p className={css.error}>{error}</p>}

      <ul className={css.items}>
        {items.map((item) => {
          const { price, maxOwned } = SHOP_ITEMS[item.id];
          const atMax = item.owned >= maxOwned;
          const tooPoor = wallet.balance < price;
          return (
            <li key={item.id} className={css.item}>
              <span className={css.itemIcon} aria-hidden="true">{item.icon}</span>
              <div className={css.itemInfo}>
                <span className={css.itemName}>{t(`shop.${item.id}`)}</span>
                <span className={css.itemDesc}>{t(`shop.${item.id}Desc`)}</span>
                <span className={css.itemOwned}>
                  {t('shop.owned', { count: item.owned })}
                  {Number.isFinite(maxOwned) ? ` / ${maxOwned}` : ''}
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={atMax || tooPoor || pending === item.id}
                onClick={() => handleBuy(item.id)}
              >
                {atMax ? t('shop.maxLabel') : <><CoinIcon size={14} /> {price}</>}
              </Button>
            </li>
          );
        })}
      </ul>

      <Button variant="secondary" fullWidth onClick={onClose}>
        {t('shop.close')}
      </Button>
    </Modal>
  );
}
