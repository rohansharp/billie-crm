'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { ContextDrawer } from '@/components/ui/ContextDrawer'
import {
  useWriteOffRequest,
  SENIOR_APPROVAL_THRESHOLD,
} from '@/hooks/mutations/useWriteOffRequest'
import styles from './styles.module.css'

export interface WriteOffRequestDrawerProps {
  isOpen: boolean
  onClose: () => void
  loanAccountId: string
  customerId: string
  customerName?: string
  accountNumber?: string
  totalOutstanding: number
}

/**
 * Write-off reason options
 */
const WRITE_OFF_REASONS = [
  { value: '', label: 'Select a reason...' },
  { value: 'hardship', label: 'Customer Hardship' },
  { value: 'bankruptcy', label: 'Bankruptcy/Insolvency' },
  { value: 'deceased', label: 'Deceased Estate' },
  { value: 'unable_to_locate', label: 'Unable to Locate' },
  { value: 'fraud_victim', label: 'Fraud - Customer is Victim' },
  { value: 'disputed', label: 'Disputed Debt' },
  { value: 'aged_debt', label: 'Aged Debt (>180 days)' },
  { value: 'other', label: 'Other' },
] as const

// Hoisted formatter
const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
})

/**
 * WriteOffRequestDrawer - Slide-over form for submitting write-off requests.
 * Part of Epic 4: Write-Off & Approval Workflow.
 */
export const WriteOffRequestDrawer: React.FC<WriteOffRequestDrawerProps> = ({
  isOpen,
  onClose,
  loanAccountId,
  customerId,
  customerName,
  accountNumber,
  totalOutstanding,
}) => {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const { submitRequestAsync, isPending, isReadOnlyMode } = useWriteOffRequest()

  // Calculate if senior approval is required
  const numAmount = useMemo(() => parseFloat(amount) || 0, [amount])
  const requiresSeniorApproval = numAmount >= SENIOR_APPROVAL_THRESHOLD

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      // Default to full balance
      setAmount(totalOutstanding.toFixed(2))
      setReason('')
      setNotes('')
      setValidationError(null)
    }
  }, [isOpen, totalOutstanding])

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
    setValidationError(null)
  }, [])

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setReason(e.target.value)
    setValidationError(null)
  }, [])

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Validation
      if (isNaN(numAmount) || numAmount <= 0) {
        setValidationError('Please enter a valid amount')
        return
      }

      if (numAmount > totalOutstanding) {
        setValidationError(
          `Amount cannot exceed outstanding balance (${currencyFormatter.format(totalOutstanding)})`
        )
        return
      }

      if (!reason) {
        setValidationError('Please select a reason')
        return
      }

      try {
        // Submit request and wait for success before closing
        await submitRequestAsync({
          loanAccountId,
          customerId,
          customerName,
          accountNumber,
          amount: numAmount,
          originalBalance: totalOutstanding,
          reason,
          notes: notes.trim() || undefined,
          // TODO: Get requestedBy from auth context when available
        })

        // Only close drawer on success
        onClose()
      } catch {
        // Error is already handled by the mutation hook (shows toast)
        // Keep drawer open so user can retry
      }
    },
    [
      numAmount,
      reason,
      notes,
      totalOutstanding,
      loanAccountId,
      customerId,
      customerName,
      accountNumber,
      submitRequestAsync,
      onClose,
    ]
  )

  const isFormValid = numAmount > 0 && reason && !validationError
  const isDisabled = isPending || isReadOnlyMode

  return (
    <ContextDrawer isOpen={isOpen} onClose={onClose} title="Request Write-Off">
      <form onSubmit={handleSubmit} className={styles.writeOffForm}>
        {/* Read-only mode warning */}
        {isReadOnlyMode && (
          <div className={styles.readOnlyWarning} role="alert">
            <span className={styles.readOnlyIcon}>🔒</span>
            <span>System is in read-only mode. Actions are disabled.</span>
          </div>
        )}

        {/* Senior approval warning */}
        {requiresSeniorApproval && (
          <div className={styles.seniorApprovalWarning} role="alert">
            <span className={styles.warningIcon}>⚠️</span>
            <span>
              This request exceeds {currencyFormatter.format(SENIOR_APPROVAL_THRESHOLD)} and
              requires senior approval.
            </span>
          </div>
        )}

        {/* Account summary */}
        <div className={styles.writeOffSummary}>
          <h4 className={styles.writeOffSummaryTitle}>Account Summary</h4>
          <div className={styles.writeOffSummaryGrid}>
            <div className={styles.writeOffSummaryItem}>
              <span className={styles.writeOffSummaryLabel}>Account</span>
              <span className={styles.writeOffSummaryValue}>{accountNumber || loanAccountId}</span>
            </div>
            <div className={styles.writeOffSummaryItem}>
              <span className={styles.writeOffSummaryLabel}>Customer</span>
              <span className={styles.writeOffSummaryValue}>{customerName || customerId}</span>
            </div>
            <div className={styles.writeOffSummaryItem}>
              <span className={styles.writeOffSummaryLabel}>Outstanding Balance</span>
              <span className={styles.writeOffSummaryValueLarge}>
                {currencyFormatter.format(totalOutstanding)}
              </span>
            </div>
          </div>
        </div>

        {/* Validation error */}
        {validationError && (
          <div className={styles.writeOffError} role="alert">
            {validationError}
          </div>
        )}

        {/* Write-off amount */}
        <div className={styles.writeOffField}>
          <label htmlFor="writeoff-amount" className={styles.writeOffLabel}>
            Write-Off Amount <span className={styles.required}>*</span>
          </label>
          <div className={styles.writeOffInputWrapper}>
            <span className={styles.writeOffInputPrefix}>$</span>
            <input
              id="writeoff-amount"
              type="number"
              className={styles.writeOffInput}
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              max={totalOutstanding}
              disabled={isDisabled}
              required
              data-testid="writeoff-amount-input"
            />
          </div>
          <p className={styles.writeOffHint}>
            Defaults to full outstanding balance. Adjust if partial write-off.
          </p>
        </div>

        {/* Reason dropdown */}
        <div className={styles.writeOffField}>
          <label htmlFor="writeoff-reason" className={styles.writeOffLabel}>
            Reason <span className={styles.required}>*</span>
          </label>
          <select
            id="writeoff-reason"
            className={styles.writeOffSelect}
            value={reason}
            onChange={handleReasonChange}
            disabled={isDisabled}
            required
            data-testid="writeoff-reason-select"
          >
            {WRITE_OFF_REASONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Supporting notes */}
        <div className={styles.writeOffField}>
          <label htmlFor="writeoff-notes" className={styles.writeOffLabel}>
            Supporting Notes
          </label>
          <textarea
            id="writeoff-notes"
            className={styles.writeOffTextarea}
            value={notes}
            onChange={handleNotesChange}
            placeholder="Provide context and supporting information for this request..."
            rows={4}
            disabled={isDisabled}
            data-testid="writeoff-notes-textarea"
          />
          <p className={styles.writeOffHint}>
            Include relevant details: customer circumstances, previous contact attempts, etc.
          </p>
        </div>

        {/* Actions */}
        <div className={styles.writeOffActions}>
          <button type="button" className={styles.writeOffCancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={styles.writeOffSubmitBtn}
            disabled={!isFormValid || isDisabled}
            title={isReadOnlyMode ? 'System in read-only mode' : undefined}
            data-testid="writeoff-submit-button"
          >
            {isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </ContextDrawer>
  )
}
