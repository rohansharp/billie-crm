'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import styles from './styles.module.css'

/**
 * Skeleton loader for a single transaction row.
 */
const TransactionRowSkeleton: React.FC = () => {
  return (
    <div className={styles.transactionRow}>
      <Skeleton variant="text" width={80} height={14} />
      <Skeleton variant="text" width={100} height={14} />
      <Skeleton variant="text" width={80} height={14} />
      <Skeleton variant="text" width={120} height={14} />
    </div>
  )
}

/**
 * Skeleton loader for the transaction history section.
 * Renders 5 placeholder transaction rows.
 */
export const TransactionsSkeleton: React.FC = () => {
  return (
    <div className={styles.transactionsSection} data-testid="transactions-skeleton">
      <Skeleton variant="text" width={180} height={20} className={styles.sectionTitle} />
      <div className={styles.transactionsList}>
        <TransactionRowSkeleton />
        <TransactionRowSkeleton />
        <TransactionRowSkeleton />
        <TransactionRowSkeleton />
        <TransactionRowSkeleton />
      </div>
    </div>
  )
}
