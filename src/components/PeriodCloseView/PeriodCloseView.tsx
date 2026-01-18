'use client'

import React, { useState, useCallback } from 'react'
import { useClosedPeriods, type ClosedPeriod } from '@/hooks/queries/useClosedPeriods'
import { formatCurrency } from '@/lib/formatters'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PeriodCloseWizard } from './PeriodCloseWizard'
import styles from './styles.module.css'

export interface PeriodCloseViewProps {
  /** Current user ID for audit trail */
  userId?: string
  /** Current user name */
  userName?: string
}

/**
 * Period Close View - Main view for month-end close process.
 * Includes wizard for new closes and history of past closes.
 */
export const PeriodCloseView: React.FC<PeriodCloseViewProps> = ({
  userId,
  userName,
}) => {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<ClosedPeriod | null>(null)

  const { data: closedPeriodsData, isLoading: isLoadingHistory } = useClosedPeriods()

  const openHistory = useCallback(() => {
    setHistoryOpen(true)
  }, [])

  const closeHistory = useCallback(() => {
    setHistoryOpen(false)
    setSelectedPeriod(null)
  }, [])

  const selectPeriod = useCallback((period: ClosedPeriod) => {
    setSelectedPeriod(period)
  }, [])

  return (
    <div className={styles.container} data-testid="period-close-view">
      <Breadcrumb
        items={[
          { label: 'Finance', href: '/admin' },
          { label: 'Period Close' },
        ]}
      />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Period Close</h1>
          <p className={styles.subtitle}>
            Month-end close process for ECL, accruals, and journal generation
          </p>
        </div>
        <button
          type="button"
          className={styles.historyBtn}
          onClick={openHistory}
          data-testid="history-btn"
        >
          📋 View History
        </button>
      </div>

      {/* Wizard */}
      <PeriodCloseWizard userId={userId} userName={userName} />

      {/* History Drawer */}
      <div
        className={`${styles.historyOverlay} ${historyOpen ? styles.open : ''}`}
        onClick={closeHistory}
        aria-hidden="true"
      />
      <div
        className={`${styles.historyDrawer} ${historyOpen ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        <div className={styles.drawerHeader}>
          <h2 id="history-title" className={styles.drawerTitle}>
            Close History
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeHistory}
            aria-label="Close history drawer"
          >
            ×
          </button>
        </div>
        <div className={styles.drawerContent}>
          {isLoadingHistory ? (
            <p>Loading history...</p>
          ) : !closedPeriodsData?.periods?.length ? (
            <p>No closed periods yet.</p>
          ) : selectedPeriod ? (
            <PeriodDetail period={selectedPeriod} onBack={() => setSelectedPeriod(null)} />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Closed Date</th>
                  <th>Closed By</th>
                  <th className={styles.numericCol}>Total ECL</th>
                </tr>
              </thead>
              <tbody>
                {closedPeriodsData.periods.map((period) => (
                  <tr
                    key={period.periodDate}
                    onClick={() => selectPeriod(period)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      {new Date(period.periodDate).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      {new Date(period.closedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>{period.closedByName || period.closedBy}</td>
                    <td className={styles.numericCol}>{formatCurrency(period.totalECLAllowance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

/** Period Detail component for history drawer */
interface PeriodDetailProps {
  period: ClosedPeriod
  onBack: () => void
}

const PeriodDetail: React.FC<PeriodDetailProps> = ({ period, onBack }) => {
  return (
    <div>
      <button type="button" onClick={onBack} className={styles.backBtn} style={{ marginBottom: '1rem' }}>
        ← Back to List
      </button>

      <h3 className={styles.sectionTitle}>
        {new Date(period.periodDate).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })}
      </h3>

      <div className={styles.summaryCards} style={{ marginBottom: '1.5rem' }}>
        <div className={styles.summaryCard}>
          <span className={styles.cardLabel}>Total Accounts</span>
          <span className={styles.cardValue}>{period.totalAccounts.toLocaleString()}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.cardLabel}>Accrued Yield</span>
          <span className={styles.cardValue}>{formatCurrency(period.totalAccruedYield)}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.cardLabel}>ECL Allowance</span>
          <span className={styles.cardValue}>{formatCurrency(period.totalECLAllowance)}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.cardLabel}>Carrying Amount</span>
          <span className={styles.cardValue}>{formatCurrency(period.totalCarryingAmount)}</span>
        </div>
      </div>

      <div className={styles.finalSummary}>
        <div className={styles.summaryRow}>
          <span>Closed By:</span>
          <strong>{period.closedByName || period.closedBy}</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>Closed At:</span>
          <strong>
            {new Date(period.closedAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </strong>
        </div>
      </div>

      {period.journalEntries && period.journalEntries.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Journal Entries</h4>
          <ul className={styles.journalList}>
            {period.journalEntries.map((entry) => (
              <li key={entry.id}>
                {entry.type}: {formatCurrency(entry.amount)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default PeriodCloseView
