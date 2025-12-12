'use client'

import React, { useState } from 'react'
import styles from './styles.module.css'

interface RecordPaymentModalProps {
  loanAccountId: string
  onClose: () => void
  onSuccess: () => void
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  loanAccountId,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Generate a unique payment ID
      const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const res = await fetch('/api/ledger/repayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanAccountId,
          amount: amount,
          paymentId,
          paymentReference,
          paymentMethod,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment')
      }

      setResult(data)
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value || '0')
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(num)
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>💳 Record Payment</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && (
              <div className={styles.errorMessage}>{error}</div>
            )}

            {success && result && (
              <div className={styles.successMessage}>
                Payment recorded successfully!
                <div className={styles.allocationPreview}>
                  <div className={styles.allocationRow}>
                    <span>Applied to Fees:</span>
                    <span>{formatCurrency(result.allocatedToFees || '0')}</span>
                  </div>
                  <div className={styles.allocationRow}>
                    <span>Applied to Principal:</span>
                    <span>{formatCurrency(result.allocatedToPrincipal || '0')}</span>
                  </div>
                  {parseFloat(result.overpayment || '0') > 0 && (
                    <div className={styles.allocationRow}>
                      <span>Overpayment:</span>
                      <span>{formatCurrency(result.overpayment)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!success && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Amount *</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                  />
                  <p className={styles.formHint}>
                    Payments are allocated to fees first, then principal
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Reference *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g., DD-20240215-001"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Method</label>
                  <select
                    className={styles.formSelect}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="direct_debit">Direct Debit</option>
                    <option value="card">Card Payment</option>
                    <option value="bpay">BPAY</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              {success ? 'Close' : 'Cancel'}
            </button>
            {!success && (
              <button 
                type="submit" 
                className={styles.btnSubmit}
                disabled={loading || !amount || !paymentReference}
              >
                {loading ? 'Processing...' : 'Record Payment'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}


