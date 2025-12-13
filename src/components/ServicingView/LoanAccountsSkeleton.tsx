'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import styles from './styles.module.css'

/**
 * Skeleton loader for a single loan account card.
 */
const LoanAccountCardSkeleton: React.FC = () => {
  return (
    <div className={styles.accountCard}>
      <div className={styles.accountHeader}>
        <Skeleton variant="text" width={120} height={20} />
        <Skeleton variant="rectangular" width={60} height={24} />
      </div>
      <div className={styles.accountDetails}>
        <div className={styles.balanceRow}>
          <Skeleton variant="text" width={80} height={14} />
          <Skeleton variant="text" width={100} height={18} />
        </div>
        <div className={styles.balanceRow}>
          <Skeleton variant="text" width={80} height={14} />
          <Skeleton variant="text" width={100} height={18} />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton loader for the loan accounts list section.
 * Renders 2 placeholder account cards.
 */
export const LoanAccountsSkeleton: React.FC = () => {
  return (
    <div className={styles.accountsSection} data-testid="loan-accounts-skeleton">
      <Skeleton variant="text" width={140} height={20} className={styles.sectionTitle} />
      <div className={styles.accountsList}>
        <LoanAccountCardSkeleton />
        <LoanAccountCardSkeleton />
      </div>
    </div>
  )
}
