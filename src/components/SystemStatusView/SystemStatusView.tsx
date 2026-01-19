'use client'

import React from 'react'
import {
  useEventProcessingStatus,
  type StreamProcessingStatus,
} from '@/hooks/queries/useEventProcessingStatus'
import styles from './styles.module.css'

/**
 * Get status icon based on overall status
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'healthy':
      return '✅'
    case 'degraded':
      return '⚠️'
    case 'critical':
      return '🔴'
    default:
      return '❓'
  }
}

/**
 * Get status class based on overall status
 */
function getStatusClass(status: string): string {
  switch (status) {
    case 'healthy':
      return styles.statusHealthy
    case 'degraded':
      return styles.statusDegraded
    case 'critical':
      return styles.statusCritical
    default:
      return styles.statusUnknown
  }
}

/**
 * Get stream status class
 */
function getStreamStatusClass(status: string): string {
  switch (status) {
    case 'healthy':
      return styles.streamHealthy
    case 'lagging':
      return styles.streamLagging
    case 'stalled':
      return styles.streamStalled
    default:
      return styles.streamUnknown
  }
}

/**
 * Format large numbers with commas
 */
function formatNumber(value: string | number): string {
  const num = typeof value === 'string' ? parseInt(value, 10) : value
  return num.toLocaleString()
}

/**
 * Format seconds to human-readable duration
 */
function formatDuration(seconds: string | number): string {
  const secs = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp: string | undefined): string {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)

  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`
  return date.toLocaleDateString()
}

/**
 * Stream Card Component
 */
function StreamCard({ stream }: { stream: StreamProcessingStatus }) {
  const pendingCount = parseInt(stream.pendingCount, 10)
  const lagSeconds = parseInt(stream.lagSeconds, 10)

  return (
    <div className={styles.streamCard}>
      <div className={`${styles.streamStatus} ${getStreamStatusClass(stream.status)}`} />
      <div className={styles.streamInfo}>
        <h4 className={styles.streamName}>{stream.streamName}</h4>
        <div className={styles.streamMeta}>
          {stream.consumerGroup} • {stream.consumerCount} consumers
        </div>
      </div>
      <div className={styles.streamStats}>
        <div className={styles.streamStat}>
          <div className={styles.streamStatLabel}>Pending</div>
          <div
            className={`${styles.streamStatValue} ${
              pendingCount > 1000 ? styles.streamStatWarning : ''
            } ${pendingCount > 10000 ? styles.streamStatError : ''}`}
          >
            {formatNumber(stream.pendingCount)}
          </div>
        </div>
        <div className={styles.streamStat}>
          <div className={styles.streamStatLabel}>Lag</div>
          <div
            className={`${styles.streamStatValue} ${
              lagSeconds > 30 ? styles.streamStatWarning : ''
            } ${lagSeconds > 300 ? styles.streamStatError : ''}`}
          >
            {formatDuration(stream.lagSeconds)}
          </div>
        </div>
        <div className={styles.streamStat}>
          <div className={styles.streamStatLabel}>Last Processed</div>
          <div className={styles.streamStatValue}>
            {formatRelativeTime(stream.lastProcessedAt)}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * System Status View
 *
 * Displays event processing health across all streams.
 * Shows overall status, pending message counts, and per-stream details.
 *
 * Story E1-S10: Create System Status View
 */
export function SystemStatusView() {
  const {
    overallStatus,
    totalPending,
    estimatedCatchupSeconds,
    streams,
    queriedAt,
    warning,
    isFallback,
    fallbackMessage,
    success,
    errorMessage,
    isLoading,
    isFetching,
    refetch,
  } = useEventProcessingStatus({ pollingInterval: 5000 }) // Poll every 5s for this view

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Loading system status...</span>
        </div>
      </div>
    )
  }

  if (!success && errorMessage) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <h3 className={styles.errorTitle}>Unable to Load Status</h3>
          <p className={styles.errorText}>{errorMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>System Status</h1>
        <button
          className={styles.refreshButton}
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <span>{isFetching ? '⟳' : '🔄'}</span>
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Service Unavailable Warning */}
      {isFallback && (
        <div className={styles.warningBanner}>
          <span className={styles.warningIcon}>⚠️</span>
          <span className={styles.warningText}>
            <strong>Ledger Service Unavailable:</strong> {fallbackMessage || 'The Accounting Ledger Service is currently unavailable. Status information is not available.'}
          </span>
        </div>
      )}

      {/* Other Warning Banner */}
      {!isFallback && warning && (
        <div className={styles.warningBanner}>
          <span className={styles.warningIcon}>⚠️</span>
          <span className={styles.warningText}>{warning}</span>
        </div>
      )}

      {/* Overall Status */}
      <div className={styles.overallStatus}>
        <div className={`${styles.statusIcon} ${getStatusClass(overallStatus)}`}>
          {getStatusIcon(overallStatus)}
        </div>
        <div className={styles.statusInfo}>
          <p className={styles.statusLabel}>Overall System Status</p>
          <h2 className={styles.statusValue}>{overallStatus}</h2>
          <div className={styles.statusMeta}>
            <span className={styles.statusMetaItem}>
              <span className={styles.statusMetaValue}>{streams.length}</span> streams monitored
            </span>
            <span className={styles.statusMetaItem}>
              Last check: <span className={styles.statusMetaValue}>{formatRelativeTime(queriedAt)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total Pending</p>
          <h3 className={styles.summaryValue}>{formatNumber(totalPending)}</h3>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Est. Catchup Time</p>
          <h3 className={styles.summaryValue}>{formatDuration(estimatedCatchupSeconds)}</h3>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Active Streams</p>
          <h3 className={styles.summaryValue}>{streams.filter((s) => s.status === 'healthy').length}/{streams.length}</h3>
        </div>
      </div>

      {/* Streams Section */}
      <div className={styles.streamsSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Event Streams</h3>
        </div>
        <div className={styles.streamsList}>
          {streams.length === 0 ? (
            <div className={styles.error}>
              <span className={styles.errorIcon}>📭</span>
              <h3 className={styles.errorTitle}>No Streams Found</h3>
              <p className={styles.errorText}>No event streams are currently being monitored.</p>
            </div>
          ) : (
            streams.map((stream) => <StreamCard key={stream.streamName} stream={stream} />)
          )}
        </div>
      </div>

      {/* Last Updated */}
      <div className={styles.lastUpdated}>
        Auto-refreshing every 5 seconds • Last updated: {queriedAt ? new Date(queriedAt).toLocaleTimeString() : 'Never'}
      </div>
    </div>
  )
}
