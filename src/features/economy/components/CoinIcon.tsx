interface CoinIconProps {
  /** Rendered width/height in pixels. */
  size?: number;
  className?: string;
}

/** The Sudokoin emerald icon. Decorative — the adjacent value conveys meaning,
 * so it is hidden from screen readers. */
export function CoinIcon({ size = 16, className }: CoinIconProps) {
  return (
    <img
      src="/sudokoin.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
}
