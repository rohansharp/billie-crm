'use client'

import { useState, useMemo } from 'react'
import type { ScheduledPayment } from '@/hooks/queries/useCustomer'
import styles from './styles.module.css'

export interface RepaymentScheduleListProps {
  payments: ScheduledPayment[] | null
  numberOfPayments: number | null
  paymentFrequency: 'weekly' | 'fortnightly' | 'monthly' | null
}

// Hoisted for performance
const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
})

const dateFormatter = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  try {
    return dateFormatter.format(new Date(dateString))
  } catch {
    return '—'
  }
}

function formatFrequency(freq: string | null): string {
  if (!freq) return '—'
  const map: Record<string, string> = {
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    monthly: 'Monthly',
  }
  return map[freq] || freq
}

/**
 * Get status configuration for visual display
 */
function getPaymentStatusConfig(status: ScheduledPayment['status'], isNext: boolean) {
  if (isNext && status === 'scheduled') {
    return {
      icon: '●',
      label: 'Due (next)',
      className: styles.paymentStatusNext,
    }
  }

  switch (status) {
    case 'paid':
      return {
        icon: '✓',
        label: 'Paid',
        className: styles.paymentStatusPaid,
      }
    case 'missed':
      return {
        icon: '✗',
        label: 'Missed',
        className: styles.paymentStatusMissed,
      }
    case 'partial':
      return {
        icon: '◐',
        label: 'Partial',
        className: styles.paymentStatusPartial,
      }
    case 'scheduled':
    default:
      return {
        icon: '',
        label: 'Scheduled',
        className: styles.paymentStatusScheduled,
      }
  }
}

/**
 * RepaymentScheduleList - Expandable list of scheduled payments.
 * Shows summary by default with option to view all payments.
 */
export const RepaymentScheduleList: React.FC<RepaymentScheduleListProps> = ({
  payments,
  numberOfPayments,
  paymentFrequency,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate payment statistics
  const stats = useMemo(() => {
    if (!payments || payments.length === 0) {
      return { paid: 0, total: numberOfPayments ?? 0, nextPaymentIndex: -1 }
    }

    const paid = payments.filter((p) => p.status === 'paid').length
    const total = payments.length

    // Find the next due payment (first scheduled payment)
    const nextPaymentIndex = payments.findIndex((p) => p.status === 'scheduled')

    return { paid, total, nextPaymentIndex }
  }, [payments, numberOfPayments])

  const hasPayments = payments && payments.length > 0

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <div className={styles.scheduleSection} data-testid="repayment-schedule-list">
      {/* Summary grid */}
      <div className={styles.overviewGrid}>
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Frequency</span>
          <span className={styles.overviewValue}>{formatFrequency(paymentFrequency)}</span>
        </div>
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Payments</span>
          <span className={styles.overviewValue}>
            {stats.paid > 0 ? `${stats.paid} of ${stats.total} paid` : `${stats.total}`}
          </span>
        </div>
      </div>

      {/* Expand/collapse toggle */}
      {hasPayments && (
        <>
          <button
            type="button"
            className={styles.scheduleToggle}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            aria-expanded={isExpanded}
            aria-controls="payment-list"
            data-testid="schedule-toggle"
          >
            <svg
              className={`${styles.scheduleToggleIcon} ${isExpanded ? styles.scheduleToggleIconExpanded : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
            <span>{isExpanded ? 'Hide payments' : `View all ${stats.total} payments`}</span>
          </button>

          {/* Payment list */}
          {isExpanded && (
            <div
              id="payment-list"
              className={styles.paymentList}
              role="list"
              data-testid="payment-list"
            >
              {payments.map((payment, index) => {
                const isNext = index === stats.nextPaymentIndex
                const statusConfig = getPaymentStatusConfig(payment.status, isNext)

                return (
                  <div
                    key={payment.id ?? payment.paymentNumber}
                    className={`${styles.paymentRow} ${statusConfig.className}`}
                    role="listitem"
                    data-testid={`payment-row-${payment.paymentNumber}`}
                  >
                    <span className={styles.paymentIcon} aria-hidden="true">
                      {statusConfig.icon}
                    </span>
                    <span className={styles.paymentNumber}>#{payment.paymentNumber}</span>
                    <span className={styles.paymentDate}>{formatDate(payment.dueDate)}</span>
                    <span className={styles.paymentAmount}>
                      {currencyFormatter.format(payment.amount)}
                    </span>
                    <span className={styles.paymentStatus}>{statusConfig.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
