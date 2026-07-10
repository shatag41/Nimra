import type { ReactNode } from 'react';
import styles from './CompactKpiCard.module.css';

type CompactKpiCardProps = {
  title: string;
  value: ReactNode;
  subtitle: string;
  icon: ReactNode;
  accent?: 'blue' | 'orange' | 'green' | 'red';
};

export function CompactKpiCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'blue',
}: CompactKpiCardProps) {
  return (
    <div className={`${styles.card} ${styles[accent]}`} tabIndex={0}>
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <div className={styles.copy}>
        <strong className={styles.value}>{value}</strong>
        <span className={styles.title}>{title}</span>
        <small className={styles.subtitle}>{subtitle}</small>
      </div>
    </div>
  );
}
