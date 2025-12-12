'use client'

/**
 * Loan Account Servicing Panel
 * 
 * Custom component for the LoanAccounts collection that provides:
 * - Live balance display from ledger
 * - Transaction history with filtering
 * - Action buttons for payments, fees, waivers, etc.
 */

import React, { useState, useEffect } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import styles from './styles.module.css'

// Sub-components
import { BalanceCard } from './BalanceCard'
import { TransactionList } from './TransactionList'
import { RecordPaymentModal } from './RecordPaymentModal'
import { ApplyLateFeeModal } from './ApplyLateFeeModal'
import { WaiveFeeModal } from './WaiveFeeModal'
import { WriteOffModal } from './WriteOffModal'
import { AdjustmentModal } from './AdjustmentModal'

type ModalType = 'payment' | 'lateFee' | 'waiveFee' | 'writeOff' | 'adjustment' | null

export const LoanAccountServicing: React.FC = () => {
  const { id } = useDocumentInfo()
  const [loanAccountId, setLoanAccountId] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [accountStatus, setAccountStatus] = useState<string>('active')

  // Fetch the loanAccountId from the document
  useEffect(() => {
    if (id) {
      fetch(`/api/loan-accounts/${id}`)
        .then(res => res.json())
        .then(data => {
          setLoanAccountId(data.loanAccountId)
          setAccountStatus(data.accountStatus || 'active')
        })
        .catch(err => console.error('Failed to fetch loan account:', err))
    }
  }, [id])

  const handleActionComplete = () => {
    setActiveModal(null)
    setRefreshKey(prev => prev + 1)
  }

  if (!loanAccountId) {
    return (
      <div className={styles.loading}>
        Loading account details...
      </div>
    )
  }

  const isWrittenOff = accountStatus === 'written_off'
  const isPaidOff = accountStatus === 'paid_off'

  return (
    <div className={styles.container}>
      {/* Balance Card */}
      <BalanceCard 
        loanAccountId={loanAccountId} 
        refreshKey={refreshKey}
      />

      {/* Action Buttons */}
      <div className={styles.actionsSection}>
        <h3 className={styles.sectionTitle}>Account Actions</h3>
        <div className={styles.actionButtons}>
          <button
            className={`${styles.actionBtn} ${styles.primary}`}
            onClick={() => setActiveModal('payment')}
            disabled={isWrittenOff || isPaidOff}
          >
            <span className={styles.icon}>💳</span>
            Record Payment
          </button>
          <button
            className={`${styles.actionBtn} ${styles.warning}`}
            onClick={() => setActiveModal('lateFee')}
            disabled={isWrittenOff || isPaidOff}
          >
            <span className={styles.icon}>⚠️</span>
            Apply Late Fee
          </button>
          <button
            className={`${styles.actionBtn} ${styles.success}`}
            onClick={() => setActiveModal('waiveFee')}
            disabled={isWrittenOff}
          >
            <span className={styles.icon}>🎁</span>
            Waive Fee
          </button>
          <button
            className={`${styles.actionBtn} ${styles.neutral}`}
            onClick={() => setActiveModal('adjustment')}
            disabled={isWrittenOff}
          >
            <span className={styles.icon}>📝</span>
            Adjustment
          </button>
          <button
            className={`${styles.actionBtn} ${styles.danger}`}
            onClick={() => setActiveModal('writeOff')}
            disabled={isWrittenOff || isPaidOff}
          >
            <span className={styles.icon}>❌</span>
            Write Off
          </button>
        </div>
        {(isWrittenOff || isPaidOff) && (
          <p className={styles.disabledNote}>
            {isWrittenOff 
              ? 'This account has been written off. Most actions are disabled.'
              : 'This account is paid off. Payment and fee actions are disabled.'
            }
          </p>
        )}
      </div>

      {/* Transaction History */}
      <TransactionList 
        loanAccountId={loanAccountId}
        refreshKey={refreshKey}
      />

      {/* Modals */}
      {activeModal === 'payment' && (
        <RecordPaymentModal
          loanAccountId={loanAccountId}
          onClose={() => setActiveModal(null)}
          onSuccess={handleActionComplete}
        />
      )}
      {activeModal === 'lateFee' && (
        <ApplyLateFeeModal
          loanAccountId={loanAccountId}
          onClose={() => setActiveModal(null)}
          onSuccess={handleActionComplete}
        />
      )}
      {activeModal === 'waiveFee' && (
        <WaiveFeeModal
          loanAccountId={loanAccountId}
          onClose={() => setActiveModal(null)}
          onSuccess={handleActionComplete}
        />
      )}
      {activeModal === 'writeOff' && (
        <WriteOffModal
          loanAccountId={loanAccountId}
          onClose={() => setActiveModal(null)}
          onSuccess={handleActionComplete}
        />
      )}
      {activeModal === 'adjustment' && (
        <AdjustmentModal
          loanAccountId={loanAccountId}
          onClose={() => setActiveModal(null)}
          onSuccess={handleActionComplete}
        />
      )}
    </div>
  )
}

export default LoanAccountServicing


