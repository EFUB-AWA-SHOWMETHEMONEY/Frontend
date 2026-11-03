import type { HTMLAttributes, ButtonHTMLAttributes } from 'react';
import styles from './Shop.module.css';

export function ItemCard({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={`${styles.card} ${styles.purchase} ${className}`} {...props} />;
}

interface SellItemCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function SellItemCard({
  selected = false,
  className = '',
  type = 'button',
  ...props
}: SellItemCardProps) {
  return (
    <button
      {...props}
      type={type}
      aria-pressed={selected}
      className={`${styles.card} ${styles.sale} ${selected ? styles.selected : ''} ${className}`}
    />
  );
}
