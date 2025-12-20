'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { ContextDrawer } from '@/components/ui/ContextDrawer'
import { useWaiveFee } from '@/hooks/mutations/useWaiveFee'
import type { SelectedFee } from './FeeList'
import styles from './styles.module.css'

export interface BulkWaiveFeeDrawerProps {
  isOpen: boolean
  onClose: () => void
  loanAccountId: string
  selectedFees: SelectedFee[]
  onSuccess?: () => void
}

// Hoisted formatter
const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
})

const dateFormatter = new Intl.DateTimeFormat('en-AU', {
  day: '2-digit',
  month: 'short',
})

function formatShortDate(dateString: string): string {
  if (!dateString) return ''
  try {
    return dateFormatter.format(new Date(dateString))
  } catch {
    return ''
  }
}

/**
 * BulkWaiveFeeDrawer - Summary drawer for bulk fee waiver.
 * Shows selected fees summary and single reason field.
 */
export const BulkWaiveFeeDrawer: React.FC<BulkWaiveFeeDrawerProps> = ({
  isOpen,
  onClose,
  loanAccountId,
  selectedFees,
  onSuccess,
}) => {
  const [reason, setReason] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const { waiveFee, isPending, isReadOnlyMode, hasPendingWaive } = useWaiveFee(loanAccountId)

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return selectedFees.reduce((sum, fee) => sum + fee.amount, 0)
  }, [selectedFees])

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setReason('')
      setValidationError(null)
    }
  }, [isOpen])

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value)
    setValidationError(null)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (!reason.trim()) {
        setValidationError('Reason is required')
        return
      }

      // Submit bulk waiver as single request with total amount
      waiveFee({
        loanAccountId,
        waiverAmount: totalAmount,
        reason: reason.trim(),
        approvedBy: 'current-user', // TODO: Get from auth context
      })

      // Close drawer and notify success
      onClose()
      onSuccess?.()
    },
    [reason, loanAccountId, totalAmount, waiveFee, onClose, onSuccess]
  )

  const isDisabled = isPending || isReadOnlyMode || hasPendingWaive
  const isFormValid = reason.trim() && selectedFees.length > 0

  return (
    <ContextDrawer isOpen={isOpen} onClose={onClose} title="Bulk Fee Waiver">
      <form onSubmit={handleSubmit} className={styles.bulkWaiveForm}>
        {/* Read-only mode warning */}
        {isReadOnlyMode && (
          <div className={styles.readOnlyWarning} role="alert">
            <span className={styles.readOnlyIcon}>🔒</span>
            <span>System is in read-only mode. Actions are disabled.</span>
          </div>
        )}

        {/* Pending action warning */}
        {hasPendingWaive && !isReadOnlyMode && (
          <div className={styles.pendingWarning} role="alert">
            <span className={styles.pendingIcon}>⏳</span>
            <span>Action in progress. Please wait for the current request to complete.</span>
          </div>
        )}

        {/* Summary */}
        <div className={styles.bulkWaiveSummary}>
          <h4 className={styles.bulkWaiveSummaryTitle}>Waiver Summary</h4>
          <div className={styles.bulkWaiveSummaryGrid}>
            <div className={styles.bulkWaiveSummaryItem}>
              <span className={styles.bulkWaiveSummaryLabel}>Number of Fees</span>
              <span className={styles.bulkWaiveSummaryValue}>{selectedFees.length}</span>
            </div>
            <div className={styles.bulkWaiveSummaryItem}>
              <span className={styles.bulkWaiveSummaryLabel}>Total Amount</span>
              <span className={styles.bulkWaiveSummaryValue}>
                {currencyFormatter.format(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Fee list */}
        <div className={styles.bulkWaiveFeeList}>
          {selectedFees.map((fee) => (
            <div key={fee.transactionId} className={styles.bulkWaiveFeeItem}>
              <span className={styles.bulkWaiveFeeType}>
                {fee.typeLabel} • {formatShortDate(fee.date)}
              </span>
              <span className={styles.bulkWaiveFeeAmount}>
                {currencyFormatter.format(fee.amount)}
              </span>
            </div>
          ))}
        </div>

        {/* Validation error */}
        {validationError && (
          <div className={styles.waiveFeeError} role="alert">
            {validationError}
          </div>
        )}

        {/* Reason field */}
        <div className={styles.bulkWaiveField}>
          <label htmlFor="bulk-waive-reason" className={styles.bulkWaiveLabel}>
            Reason <span className={styles.required}>*</span>
          </label>
          <textarea
            id="bulk-waive-reason"
            className={styles.bulkWaiveTextarea}
            value={reason}
            onChange={handleReasonChange}
            placeholder="e.g., Customer dispute resolution - multiple fees waived as goodwill"
            rows={3}
            disabled={isDisabled}
            required
          />
        </div>

        {/* Actions */}
        <div className={styles.bulkWaiveActions}>
          <button type="button" className={styles.bulkWaiveCancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={styles.bulkWaiveSubmitBtn}
            disabled={!isFormValid || isDisabled}
            title={
              isReadOnlyMode
                ? 'System in read-only mode'
                : hasPendingWaive
                  ? 'Action in progress'
                  : undefined
            }
          >
            {isPending || hasPendingWaive
              ? 'Waiving...'
              : `Waive ${currencyFormatter.format(totalAmount)}`}
          </button>
        </div>
      </form>
    </ContextDrawer>
  )
}
