import type { ReactNode } from 'react';
import styles from './CompactKpiCard.module.css';

type CompactKpiCardProps = {
  title: string;
  value: ReactNode;
  subtitle: string;
  icon: ReactNode;
  accent?: 'blue' | 'orange' | 'green' | 'red';
  transitionKey?: string;
};

export function CompactKpiCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'blue',
  transitionKey,
}: CompactKpiCardProps) {
  return (
    <div className={`${styles.card} ${styles[accent]} ${transitionKey ? styles.statusCard : ''}`} tabIndex={0}>
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <div key={transitionKey} className={`${styles.copy} ${transitionKey ? styles.transitioning : ''}`}>
        <strong className={styles.value}>{value}</strong>
        <span className={styles.title}>{title}</span>
        <small className={styles.subtitle}>{subtitle}</small>
      </div>
    </div>
  );
}
