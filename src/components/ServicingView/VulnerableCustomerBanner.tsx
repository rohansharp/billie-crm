'use client'

import styles from './styles.module.css'

/**
 * Warning banner displayed when viewing a vulnerable customer.
 * Shows handling guidelines to ensure proper care.
 */
export const VulnerableCustomerBanner: React.FC = () => {
  return (
    <div className={styles.vulnerableBanner} role="alert" data-testid="vulnerable-banner">
      <div className={styles.vulnerableBannerIcon}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className={styles.vulnerableBannerContent}>
        <h3 className={styles.vulnerableBannerTitle}>Vulnerable Customer</h3>
        <p className={styles.vulnerableBannerText}>
          This customer has been flagged as requiring additional care. Please ensure all interactions are:
        </p>
        <ul className={styles.vulnerableBannerList}>
          <li>Clear and jargon-free</li>
          <li>Patient and understanding</li>
          <li>Properly documented</li>
        </ul>
      </div>
    </div>
  )
}
