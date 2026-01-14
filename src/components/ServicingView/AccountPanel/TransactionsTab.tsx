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
 * Shows inline back button on highlighted transaction row.
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

  // Clear highlight after animation completes (3s) - but keep navigation source
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
      <TransactionHistory 
        loanAccountId={loanAccountId} 
        highlightedTransactionId={highlightedTransactionId}
        linkedTransactionId={navigationSource?.transactionId}
        onBackToPayment={navigationSource && onNavigateBack ? handleBackClick : undefined}
        backToPaymentNumber={navigationSource?.paymentNumber}
      />
    </div>
  )
}
