'use client'

import Link from 'next/link'
import { useCustomer } from '@/hooks/queries/useCustomer'
import { CustomerProfile } from './CustomerProfile'
import { CustomerProfileSkeleton } from './CustomerProfileSkeleton'
import { LoanAccountsSkeleton } from './LoanAccountsSkeleton'
import { TransactionsSkeleton } from './TransactionsSkeleton'
import { VulnerableCustomerBanner } from './VulnerableCustomerBanner'
import styles from './styles.module.css'

export interface ServicingViewProps {
  customerId: string
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
  const isVulnerable = customer?.vulnerableFlag ?? false

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Customer Servicing</h1>
        <div className={styles.headerBreadcrumb}>
          <Link href="/admin">Dashboard</Link> / {customer?.fullName || 'Customer'}
        </div>
      </div>

      {/* Vulnerable customer warning banner */}
      {isVulnerable && <VulnerableCustomerBanner />}

      <div className={styles.grid}>
        <div className={styles.sidebar}>
          {customer && <CustomerProfile customer={customer} />}
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
