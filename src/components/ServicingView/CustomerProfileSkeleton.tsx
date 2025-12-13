'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import styles from './styles.module.css'

/**
 * Skeleton loader for the customer profile section.
 * Matches the shape of the CustomerProfile component.
 */
export const CustomerProfileSkeleton: React.FC = () => {
  return (
    <div className={styles.profileCard} data-testid="customer-profile-skeleton">
      <div className={styles.profileHeader}>
        {/* Avatar placeholder */}
        <Skeleton variant="circular" width={64} height={64} />
        <div className={styles.profileHeaderText}>
          {/* Name placeholder */}
          <Skeleton variant="text" width={200} height={24} />
          {/* Customer ID placeholder */}
          <Skeleton variant="text" width={120} height={16} />
        </div>
      </div>

      <div className={styles.profileDetails}>
        {/* Contact info */}
        <div className={styles.profileRow}>
          <Skeleton variant="text" width={60} height={14} />
          <Skeleton variant="text" width={180} height={16} />
        </div>
        <div className={styles.profileRow}>
          <Skeleton variant="text" width={60} height={14} />
          <Skeleton variant="text" width={140} height={16} />
        </div>
        <div className={styles.profileRow}>
          <Skeleton variant="text" width={60} height={14} />
          <Skeleton variant="text" width={220} height={16} />
        </div>
      </div>
    </div>
  )
}
