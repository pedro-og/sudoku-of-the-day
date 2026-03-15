import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  active?: boolean;
}

export function IconButton({ icon, label, active = false, className, ...props }: IconButtonProps) {
  const classNames = [
    styles.button,
    active ? styles.active : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      aria-label={label}
      aria-pressed={active}
      {...props}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}
