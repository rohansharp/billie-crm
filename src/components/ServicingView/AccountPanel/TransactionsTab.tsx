'use client'

import { useEffect, useCallback } from 'react'
import { TransactionHistory } from '../TransactionHistory'
import { useUIStore } from '@/stores/ui'
import styles from './styles.module.css'

export interface TransactionsTabProps {
  loanAccountId: string
  /** Callback to navigate back to Overview tab */
  onNavigateBack?: () => void
}

/**
 * TransactionsTab - Wrapper for TransactionHistory in tab panel.
 * Reads highlighted transaction ID from UI store for payment linking.
 * Shows "Back to Payment #X" link when navigated from payment details.
 */
export const TransactionsTab: React.FC<TransactionsTabProps> = ({ 
  loanAccountId,
  onNavigateBack,
}) => {
  const highlightedTransactionId = useUIStore((s) => s.highlightedTransactionId)
  const clearHighlightedTransaction = useUIStore((s) => s.clearHighlightedTransaction)
  const navigationSource = useUIStore((s) => s.transactionNavigationSource)
  const setNavigationSource = useUIStore((s) => s.setTransactionNavigationSource)
  const setExpandedPaymentNumber = useUIStore((s) => s.setExpandedPaymentNumber)

  // Clear highlight after animation completes (3s)
  useEffect(() => {
    if (highlightedTransactionId) {
      const timer = setTimeout(() => {
        clearHighlightedTransaction()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightedTransactionId, clearHighlightedTransaction])

  // Handle back navigation
  const handleBackClick = useCallback(() => {
    if (navigationSource) {
      // Set the payment to auto-expand
      setExpandedPaymentNumber(navigationSource.paymentNumber)
      // Clear navigation source
      setNavigationSource(null)
      // Navigate back to Overview
      onNavigateBack?.()
    }
  }, [navigationSource, setExpandedPaymentNumber, setNavigationSource, onNavigateBack])

  return (
    <div
      className={styles.tabPanel}
      role="tabpanel"
      id="tabpanel-transactions"
      aria-labelledby="tab-transactions"
      data-testid="transactions-tab"
    >
      {/* Back to payment link */}
      {navigationSource && onNavigateBack && (
        <button
          type="button"
          className={styles.backToPaymentLink}
          onClick={handleBackClick}
          data-testid="back-to-payment-link"
        >
          <svg 
            className={styles.backToPaymentIcon} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Payment #{navigationSource.paymentNumber}
        </button>
      )}
      
      <TransactionHistory 
        loanAccountId={loanAccountId} 
        highlightedTransactionId={highlightedTransactionId}
      />
    </div>
  )
}
