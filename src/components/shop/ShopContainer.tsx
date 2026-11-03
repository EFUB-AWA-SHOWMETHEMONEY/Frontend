import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Shop.module.css';

interface ShopContainerProps extends HTMLAttributes<HTMLElement> {
  toolbar?: ReactNode;
}

/** Place after the shared header: the 61px toolbar and 48px gap set Y=285. */
export default function ShopContainer({
  toolbar,
  children,
  className = '',
  ...props
}: ShopContainerProps) {
  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>{toolbar}</div>
      <section className={`${styles.container} ${className}`} {...props}>
        {children}
      </section>
    </div>
  );
}
