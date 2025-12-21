import { useQuery } from '@tanstack/react-query'
import { HEALTH_CHECK_INTERVAL_MS } from '@/lib/constants'
import type { LedgerHealthStatus, LedgerHealthResponse } from '@/types/ledger-health'

// Re-export types for consumers
export type { LedgerHealthStatus, LedgerHealthResponse }

/**
 * Options for the useLedgerHealth hook
 */
export interface UseLedgerHealthOptions {
  /** Enable/disable polling (default: true) */
  enabled?: boolean
  /** Custom polling interval in ms (default: 30s) */
  pollingInterval?: number
}

/**
 * Fetch ledger health status from the API
 */
async function fetchLedgerHealth(): Promise<LedgerHealthResponse> {
  const res = await fetch('/api/ledger/health')

  if (!res.ok) {
    // If the health endpoint itself fails, treat as offline
    return {
      status: 'offline',
      latencyMs: 0,
      message: 'Health check endpoint unavailable',
      checkedAt: new Date().toISOString(),
    }
  }

  return res.json()
}

/**
 * Query key for ledger health
 */
export const ledgerHealthQueryKey = ['ledger', 'health'] as const

/**
 * Hook to monitor ledger health status with polling.
 *
 * Features:
 * - Polls every 30 seconds by default
 * - Returns current status (connected/degraded/offline)
 * - Includes latency information
 * - Can be disabled via options
 *
 * @example
 * ```tsx
 * const { status, latencyMs, isLoading } = useLedgerHealth()
 *
 * if (status === 'offline') {
 *   // Show warning banner
 * }
 * ```
 */
export function useLedgerHealth(options: UseLedgerHealthOptions = {}) {
  const { enabled = true, pollingInterval = HEALTH_CHECK_INTERVAL_MS } = options

  const query = useQuery({
    queryKey: ledgerHealthQueryKey,
    queryFn: fetchLedgerHealth,
    enabled,
    refetchInterval: enabled ? pollingInterval : false,
    staleTime: pollingInterval / 2, // Consider stale halfway through interval
    retry: false, // Don't retry - we want fast offline detection
  })

  return {
    /** Current health status */
    status: query.data?.status ?? 'offline',
    /** Response latency in milliseconds */
    latencyMs: query.data?.latencyMs ?? 0,
    /** Human-readable status message */
    message: query.data?.message ?? 'Checking connection...',
    /** When the last check occurred */
    checkedAt: query.data?.checkedAt,
    /** Whether the initial check is loading */
    isLoading: query.isLoading,
    /** Whether a refetch is in progress */
    isFetching: query.isFetching,
    /** Force a health check now */
    refetch: query.refetch,
    /** Full query result for advanced usage */
    query,
  }
}
