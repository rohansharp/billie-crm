'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useCustomer, type LoanAccountData } from '@/hooks/queries/useCustomer'
import { ContextDrawer } from '@/components/ui/ContextDrawer'
import { CustomerProfile } from './CustomerProfile'
import { CustomerProfileSkeleton } from './CustomerProfileSkeleton'
import { LoanAccountsSkeleton } from './LoanAccountsSkeleton'
import { TransactionsSkeleton } from './TransactionsSkeleton'
import { VulnerableCustomerBanner } from './VulnerableCustomerBanner'
import { LoanAccountCard } from './LoanAccountCard'
import { LoanAccountDetails } from './LoanAccountDetails'
import { TransactionHistory } from './TransactionHistory'
import { WaiveFeeDrawer } from './WaiveFeeDrawer'
import { RecordRepaymentDrawer } from './RecordRepaymentDrawer'
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
 * Loan Accounts list with live balance display.
 */
interface LoanAccountsListProps {
  accounts: LoanAccountData[]
  onSelectAccount: (account: LoanAccountData) => void
}

const LoanAccountsList: React.FC<LoanAccountsListProps> = ({ accounts, onSelectAccount }) => {
  if (accounts.length === 0) {
    return (
      <div className={styles.accountsSection}>
        <h3 className={styles.sectionTitle}>Loan Accounts</h3>
        <p className={styles.placeholderText}>No loan accounts found</p>
      </div>
    )
  }

  return (
    <div className={styles.accountsSection}>
      <h3 className={styles.sectionTitle}>
        Loan Accounts ({accounts.length})
      </h3>
      <div className={styles.accountsList}>
        {accounts.map((account) => (
          <LoanAccountCard
            key={account.id}
            account={account}
            onSelect={onSelectAccount}
          />
        ))}
      </div>
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
  const [selectedAccount, setSelectedAccount] = useState<LoanAccountData | null>(null)
  const [waiveFeeOpen, setWaiveFeeOpen] = useState(false)
  const [recordRepaymentOpen, setRecordRepaymentOpen] = useState(false)

  const handleSelectAccount = useCallback((account: LoanAccountData) => {
    setSelectedAccount(account)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setSelectedAccount(null)
  }, [])

  const handleOpenWaiveFee = useCallback(() => {
    setWaiveFeeOpen(true)
  }, [])

  const handleCloseWaiveFee = useCallback(() => {
    setWaiveFeeOpen(false)
  }, [])

  const handleOpenRecordRepayment = useCallback(() => {
    setRecordRepaymentOpen(true)
  }, [])

  const handleCloseRecordRepayment = useCallback(() => {
    setRecordRepaymentOpen(false)
  }, [])

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
  const accounts = customer?.loanAccounts ?? []
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
          <LoanAccountsList accounts={accounts} onSelectAccount={handleSelectAccount} />
          <TransactionHistory loanAccountId={selectedAccount?.loanAccountId ?? null} />
        </div>
      </div>

      {/* Account Details Drawer */}
      <ContextDrawer
        isOpen={selectedAccount !== null}
        onClose={handleCloseDrawer}
        title="Account Details"
      >
        {selectedAccount && (
          <LoanAccountDetails
            account={selectedAccount}
            onWaiveFee={handleOpenWaiveFee}
            onRecordRepayment={handleOpenRecordRepayment}
          />
        )}
      </ContextDrawer>

      {/* Waive Fee Drawer */}
      {selectedAccount && (
        <WaiveFeeDrawer
          isOpen={waiveFeeOpen}
          onClose={handleCloseWaiveFee}
          loanAccountId={selectedAccount.loanAccountId}
          currentFeeBalance={
            selectedAccount.liveBalance?.feeBalance ?? 0
          }
        />
      )}

      {/* Record Repayment Drawer */}
      {selectedAccount && (
        <RecordRepaymentDrawer
          isOpen={recordRepaymentOpen}
          onClose={handleCloseRecordRepayment}
          loanAccountId={selectedAccount.loanAccountId}
          totalOutstanding={
            selectedAccount.liveBalance?.totalOutstanding ??
            selectedAccount.balances?.totalOutstanding ??
            0
          }
        />
      )}
    </div>
  )
}

// Default export for Payload import map
export default ServicingView
