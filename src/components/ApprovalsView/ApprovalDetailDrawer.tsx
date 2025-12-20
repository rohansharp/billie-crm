'use client'

import React from 'react'
import { ContextDrawer, CopyButton } from '@/components/ui'
import type { WriteOffApproval } from '@/hooks/queries/usePendingApprovals'
import { formatCurrency, formatDateMedium } from '@/lib/formatters'
import styles from './styles.module.css'

export interface ApprovalDetailDrawerProps {
  approval: WriteOffApproval | null
  isOpen: boolean
  onClose: () => void
}

/**
 * Drawer showing detailed information about a write-off approval request.
 * Actions (approve/reject) are handled in Story 4.3.
 */
export const ApprovalDetailDrawer: React.FC<ApprovalDetailDrawerProps> = ({
  approval,
  isOpen,
  onClose,
}) => {
  if (!approval) return null

  const requestDate = new Date(approval.requestedAt || approval.createdAt)

  return (
    <ContextDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Write-Off Request Details"
    >
      {/* Request Number Header */}
      <div className={styles.detailHeader}>
        <span className={styles.detailRequestNumber}>{approval.requestNumber}</span>
        <span className={styles.reasonBadge}>{approval.reason}</span>
      </div>

      {/* Senior Approval Warning */}
      {approval.requiresSeniorApproval && (
        <div className={styles.seniorApprovalFlag}>
          <span className={styles.seniorApprovalIcon}>⚠️</span>
          <span>This request requires senior approval (amount ≥ $10,000)</span>
        </div>
      )}

      {/* Amount Section */}
      <div className={styles.detailSection}>
        <h4 className={styles.detailSectionTitle}>Amount</h4>
        <div className={styles.detailAmount}>
          {formatCurrency(approval.amount)}
        </div>
        <div className={styles.detailLabel}>
          Original Balance: {formatCurrency(approval.originalBalance)}
        </div>
      </div>

      {/* Customer & Account Section */}
      <div className={styles.detailSection}>
        <h4 className={styles.detailSectionTitle}>Customer & Account</h4>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Customer</span>
            <span className={styles.detailValue}>
              {approval.customerName || 'Unknown'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Customer ID</span>
            <span className={`${styles.detailValue} ${styles.detailValueMono}`}>
              {approval.customerId}
              <CopyButton value={approval.customerId} label="Copy customer ID" />
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Account Number</span>
            <span className={`${styles.detailValue} ${styles.detailValueMono}`}>
              {approval.accountNumber || '—'}
              {approval.accountNumber && (
                <CopyButton value={approval.accountNumber} label="Copy account number" />
              )}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Loan Account ID</span>
            <span className={`${styles.detailValue} ${styles.detailValueMono}`}>
              {approval.loanAccountId}
              <CopyButton value={approval.loanAccountId} label="Copy loan account ID" />
            </span>
          </div>
        </div>
      </div>

      {/* Request Details Section */}
      <div className={styles.detailSection}>
        <h4 className={styles.detailSectionTitle}>Request Details</h4>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Requested By</span>
            <span className={styles.detailValue}>
              {approval.requestedByName || 'Unknown User'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Requested At</span>
            <span className={styles.detailValue}>
              {formatDateMedium(requestDate)}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Reason</span>
            <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
              {approval.reason.replace(/-/g, ' ')}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Status</span>
            <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
              {approval.status}
            </span>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className={styles.detailSection}>
        <h4 className={styles.detailSectionTitle}>Supporting Notes</h4>
        {approval.notes ? (
          <div className={styles.detailNotes}>{approval.notes}</div>
        ) : (
          <div className={`${styles.detailNotes} ${styles.detailNoNotes}`}>
            No supporting notes provided.
          </div>
        )}
      </div>

      {/* Action buttons will be added in Story 4.3 */}
    </ContextDrawer>
  )
}

export default ApprovalDetailDrawer
