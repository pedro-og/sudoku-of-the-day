interface BlueFireIconProps {
  /** Rendered width/height in pixels. */
  size?: number;
  className?: string;
}

/** The blue-fire perfect-streak icon. Decorative — the adjacent value conveys
 * meaning, so it is hidden from screen readers. */
export function BlueFireIcon({ size = 32, className }: BlueFireIconProps) {
  return (
    <img
      src="/blue-fire.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
}
