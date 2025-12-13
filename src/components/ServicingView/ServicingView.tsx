'use client'

import Link from 'next/link'
import { useCustomer } from '@/hooks/queries/useCustomer'
import { CustomerProfileSkeleton } from './CustomerProfileSkeleton'
import { LoanAccountsSkeleton } from './LoanAccountsSkeleton'
import { TransactionsSkeleton } from './TransactionsSkeleton'
import styles from './styles.module.css'

export interface ServicingViewProps {
  customerId: string
}

/**
 * Customer Profile section - displays customer details.
 * Placeholder for Story 2.2 full implementation.
 */
const CustomerProfile: React.FC<{ customer: ReturnType<typeof useCustomer>['data'] }> = ({
  customer,
}) => {
  if (!customer) return null

  const initials = customer.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

  return (
    <div className={styles.profileCard}>
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatar}>{initials}</div>
        <div className={styles.profileHeaderText}>
          <h2 className={styles.profileName}>{customer.fullName || 'Unknown'}</h2>
          <span className={styles.profileCustomerId}>{customer.customerId}</span>
        </div>
      </div>

      <div className={styles.profileDetails}>
        <div className={styles.profileRow}>
          <span className={styles.profileLabel}>Email</span>
          <span className={styles.profileValue}>{customer.emailAddress || '—'}</span>
        </div>
        <div className={styles.profileRow}>
          <span className={styles.profileLabel}>Phone</span>
          <span className={styles.profileValue}>{customer.mobilePhoneNumber || '—'}</span>
        </div>
        <div className={styles.profileRow}>
          <span className={styles.profileLabel}>Address</span>
          <span className={styles.profileValue}>
            {customer.residentialAddress?.fullAddress ||
              customer.residentialAddress?.suburb ||
              '—'}
          </span>
        </div>
      </div>

      {/* Identity badges */}
      <div className={styles.profileBadges}>
        {customer.identityVerified && (
          <span className={`${styles.badge} ${styles.badgeVerified}`}>✓ Verified</span>
        )}
        {customer.staffFlag && (
          <span className={`${styles.badge} ${styles.badgeStaff}`}>Staff</span>
        )}
        {customer.investorFlag && (
          <span className={`${styles.badge} ${styles.badgeInvestor}`}>Investor</span>
        )}
        {customer.founderFlag && (
          <span className={`${styles.badge} ${styles.badgeFounder}`}>Founder</span>
        )}
      </div>
    </div>
  )
}

/**
 * Error state component for customer not found.
 */
const CustomerNotFound: React.FC = () => {
  return (
    <div className={styles.errorContainer}>
      <svg
        className={styles.errorIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <h2 className={styles.errorTitle}>Customer not found</h2>
      <p className={styles.errorMessage}>
        The customer you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Link href="/admin" className={styles.errorLink}>
        ← Back to Dashboard
      </Link>
      <p className={styles.errorHint}>Press ⌘K to search for another customer</p>
    </div>
  )
}

/**
 * Loan Accounts placeholder - will be implemented in Story 2.3.
 */
const LoanAccountsPlaceholder: React.FC<{ accountCount: number }> = ({ accountCount }) => {
  return (
    <div className={styles.accountsSection}>
      <h3 className={styles.sectionTitle}>Loan Accounts</h3>
      <p className={styles.placeholderText}>
        {accountCount} account{accountCount !== 1 ? 's' : ''} — Details coming in Story 2.3
      </p>
    </div>
  )
}

/**
 * Transactions placeholder - will be implemented in Story 2.4.
 */
const TransactionsPlaceholder: React.FC = () => {
  return (
    <div className={styles.transactionsSection}>
      <h3 className={styles.sectionTitle}>Transaction History</h3>
      <p className={styles.placeholderText}>
        Transaction details coming in Story 2.4
      </p>
    </div>
  )
}

/**
 * ServicingView - Main customer servicing dashboard.
 * 
 * Displays customer profile, loan accounts, and transaction history.
 * Uses skeleton loaders while data is being fetched.
 */
export const ServicingView: React.FC<ServicingViewProps> = ({ customerId }) => {
  const { data: customer, isLoading, isError } = useCustomer(customerId)

  // Error state
  if (isError) {
    return (
      <div className={styles.container}>
        <CustomerNotFound />
      </div>
    )
  }

  // Loading state with skeletons
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Customer Servicing</h1>
          <div className={styles.headerBreadcrumb}>
            <Link href="/admin">Dashboard</Link> / Loading...
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.sidebar}>
            <CustomerProfileSkeleton />
          </div>
          <div className={styles.main}>
            <LoanAccountsSkeleton />
            <TransactionsSkeleton />
          </div>
        </div>
      </div>
    )
  }

  // Data loaded
  const accountCount = customer?.loanAccounts?.length ?? 0

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Customer Servicing</h1>
        <div className={styles.headerBreadcrumb}>
          <Link href="/admin">Dashboard</Link> / {customer?.fullName || 'Customer'}
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.sidebar}>
          <CustomerProfile customer={customer} />
        </div>
        <div className={styles.main}>
          <LoanAccountsPlaceholder accountCount={accountCount} />
          <TransactionsPlaceholder />
        </div>
      </div>
    </div>
  )
}

// Default export for Payload import map
export default ServicingView
