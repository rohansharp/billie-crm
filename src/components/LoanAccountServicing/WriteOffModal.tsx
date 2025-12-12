'use client'

import React, { useState, useEffect } from 'react'
import styles from './styles.module.css'

interface WriteOffModalProps {
  loanAccountId: string
  onClose: () => void
  onSuccess: () => void
}

export const WriteOffModal: React.FC<WriteOffModalProps> = ({
  loanAccountId,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('')
  const [approvedBy, setApprovedBy] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [totalOutstanding, setTotalOutstanding] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch current balance
  useEffect(() => {
    fetch(`/api/ledger/balance?loanAccountId=${loanAccountId}`)
      .then(res => res.json())
      .then(data => {
        setTotalOutstanding(parseFloat(data.totalOutstanding || '0'))
      })
      .catch(console.error)
  }, [loanAccountId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (confirmText !== 'WRITE OFF') {
      setError('Please type "WRITE OFF" to confirm')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ledger/write-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanAccountId,
          reason,
          approvedBy,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to write off account')
      }

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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>❌ Write Off Account</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && (
              <div className={styles.successMessage}>
                Account written off successfully. Balance reduced to $0.00.
              </div>
            )}

            {!success && (
              <>
                <div className={styles.errorMessage} style={{ background: '#fef3c7', color: '#92400e' }}>
                  <strong>⚠️ Warning:</strong> This action is irreversible. Writing off this account will:
                  <ul style={{ margin: '0.5rem 0 0 1rem' }}>
                    <li>Set the balance to $0.00</li>
                    <li>Mark the account as written off</li>
                    <li>Disable all future transactions</li>
                  </ul>
                </div>

                <div className={styles.allocationPreview}>
                  <div className={styles.allocationRow} style={{ fontWeight: 600 }}>
                    <span>Amount to Write Off:</span>
                    <span style={{ color: '#dc2626' }}>${totalOutstanding.toFixed(2)}</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reason *</label>
                  <textarea
                    className={styles.formTextarea}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Customer declared bankrupt on 15/02/2024 - debt unrecoverable"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Approved By (Manager) *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    placeholder="Manager name or ID"
                    required
                  />
                  <p className={styles.formHint}>
                    Write-offs require manager approval
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Type "WRITE OFF" to confirm *
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="WRITE OFF"
                    required
                  />
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
                className={`${styles.btnSubmit} ${styles.danger}`}
                disabled={loading || !reason || !approvedBy || confirmText !== 'WRITE OFF'}
              >
                {loading ? 'Processing...' : 'Write Off Account'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}


