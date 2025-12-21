'use client'

import React from 'react'
import { ContextDrawer, CopyButton } from '@/components/ui'
import type { ApprovalHistoryItem } from '@/hooks/queries/useApprovalHistory'
import { formatCurrency, formatDateMedium } from '@/lib/formatters'
import styles from './styles.module.css'

export interface HistoryDetailDrawerProps {
  item: ApprovalHistoryItem | null
  isOpen: boolean
  onClose: () => void
}

/**
 * Drawer showing detailed audit information for a completed write-off request.
 * Read-only view displaying original request + decision details.
 */
export const HistoryDetailDrawer: React.FC<HistoryDetailDrawerProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  if (!item) return null

  const requestDate = new Date(item.requestedAt || item.createdAt)
  const decisionDate = item.approvalDetails?.decidedAt
    ? new Date(item.approvalDetails.decidedAt)
    : null

  const isApproved = item.status === 'approved'

  return (
    <ContextDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Record Details"
    >
      {/* Request Number Header */}
      <div className={styles.detailHeader}>
        <span className={styles.detailRequestNumber}>{item.requestNumber}</span>
        <span
          className={`${styles.historyStatusBadge} ${isApproved ? styles.historyStatusApproved : styles.historyStatusRejected}`}
        >
          {isApproved ? '✓ Approved' : '✕ Rejected'}
        </span>
      </div>

      {/* Amount Section */}
      <div className={styles.detailSection}>
        <h4 className={styles.detailSectionTitle}>Amount</h4>
        <div className={styles.detailAmount}>
          {formatCurrency(item.amount)}
        </div>
        <div className={styles.detailLabel}>
          Original Balance: {formatCurrency(item.originalBalance)}
        </div>
      </div>

      {/* Decision Section - Most Important for Audit */}
      <div className={`${styles.detailSection} ${styles.historyDecisionSection}`}>
        <h4 className={styles.detailSectionTitle}>Decision</h4>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Decision</span>
            <span className={`${styles.detailValue} ${isApproved ? styles.textSuccess : styles.textDanger}`}>
              {isApproved ? 'Approved' : 'Rejected'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Decided By</span>
            <span className={styles.detailValue}>
              {item.approvalDetails?.decidedByName || 'Unknown'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Decision Date</span>
            <span className={styles.detailValue}>
              {decisionDate ? formatDateMedium(decisionDate) : '—'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Senior Approval Required</span>
            <span className={styles.detailValue}>
              {item.requiresSeniorApproval ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        {/* Decision Comment */}
        {item.approvalDetails?.comment && (
          <div className={styles.historyComment}>
            <span className={styles.detailLabel}>
              {isApproved ? 'Approval Comment' : 'Rejection Reason'}
            </span>
            <div className={styles.detailNotes}>
              {item.approvalDetails.comment}
            </div>
          </div>
        )}
      </div>

      {/* Customer & Account Section */}
      <div className={styles.detailSection}>
        <h4 className={styles.detailSectionTitle}>Customer & Account</h4>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Customer</span>
            <span className={styles.detailValue}>
              {item.customerName || 'Unknown'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Customer ID</span>
            <span className={`${styles.detailValue} ${styles.detailValueMono}`}>
              {item.customerId}
              <CopyButton value={item.customerId} label="Copy customer ID" />
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Account Number</span>
            <span className={`${styles.detailValue} ${styles.detailValueMono}`}>
              {item.accountNumber || '—'}
              {item.accountNumber && (
                <CopyButton value={item.accountNumber} label="Copy account number" />
              )}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Loan Account ID</span>
            <span className={`${styles.detailValue} ${styles.detailValueMono}`}>
              {item.loanAccountId}
              <CopyButton value={item.loanAccountId} label="Copy loan account ID" />
            </span>
          </div>
        </div>
      </div>

      {/* Original Request Section */}
      <div className={styles.detailSection}>
        <h4 className={styles.detailSectionTitle}>Original Request</h4>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Requested By</span>
            <span className={styles.detailValue}>
              {item.requestedByName || 'Unknown User'}
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
              {item.reason.replace(/_/g, ' ')}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Priority</span>
            <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
              {item.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Supporting Notes Section */}
      <div className={styles.detailSection}>
        <h4 className={styles.detailSectionTitle}>Supporting Notes</h4>
        {item.notes ? (
          <div className={styles.detailNotes}>{item.notes}</div>
        ) : (
          <div className={`${styles.detailNotes} ${styles.detailNoNotes}`}>
            No supporting notes provided.
          </div>
        )}
      </div>

      {/* Audit Notice */}
      <div className={styles.historyAuditNotice}>
        <span>🔒</span>
        <span>This is an immutable audit record and cannot be modified.</span>
      </div>
    </ContextDrawer>
  )
}

export default HistoryDetailDrawer
