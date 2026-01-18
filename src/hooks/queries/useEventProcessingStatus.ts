import { useQuery } from '@tanstack/react-query'

/**
 * Status for a single event stream
 */
export interface StreamProcessingStatus {
  streamName: string
  consumerGroup: string
  streamLength: string
  pendingCount: string
  lastDeliveredId: string
  lastEntryId: string
  lagSeconds: string
  status: 'healthy' | 'lagging' | 'stalled' | 'unknown'
  consumerCount: number
  lastError: string
  lastProcessedAt: string
}

/**
 * Event processing status response from API
 */
export interface EventProcessingStatusResponse {
  success: boolean
  errorMessage: string
  overallStatus: 'healthy' | 'degraded' | 'critical' | 'unknown'
  totalPending: string
  estimatedCatchupSeconds: string
  streams: StreamProcessingStatus[]
  queriedAt: string
  warning: string
}

/**
 * Options for useEventProcessingStatus hook
 */
export interface UseEventProcessingStatusOptions {
  /** Enable/disable the query (default: true) */
  enabled?: boolean
  /** Custom polling interval in ms (default: 10s) */
  pollingInterval?: number
}

/**
 * Fetch event processing status from the API
 */
async function fetchEventProcessingStatus(): Promise<EventProcessingStatusResponse> {
  const response = await fetch('/api/system/status')

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch system status')
  }

  return response.json()
}

/**
 * Query key for event processing status
 */
export const eventProcessingStatusQueryKey = ['event-processing-status'] as const

/**
 * Hook to monitor event processing status across all streams.
 *
 * Features:
 * - Polls every 10 seconds by default
 * - Returns overall system health status
 * - Includes per-stream breakdown
 * - Shows pending message count and estimated catchup time
 *
 * @example
 * ```tsx
 * const { overallStatus, streams, isLoading } = useEventProcessingStatus()
 *
 * if (overallStatus === 'degraded') {
 *   // Show warning banner
 * }
 *
 * return (
 *   <div>
 *     <StatusBadge status={overallStatus} />
 *     {streams.map(s => (
 *       <StreamStatus key={s.streamName} stream={s} />
 *     ))}
 *   </div>
 * )
 * ```
 */
export function useEventProcessingStatus(options: UseEventProcessingStatusOptions = {}) {
  const { enabled = true, pollingInterval = 10_000 } = options

  const query = useQuery({
    queryKey: eventProcessingStatusQueryKey,
    queryFn: fetchEventProcessingStatus,
    enabled,
    refetchInterval: enabled ? pollingInterval : false,
    staleTime: pollingInterval / 2,
    retry: false, // Don't retry - we want fast status detection
  })

  return {
    /** Overall system health status */
    overallStatus: query.data?.overallStatus ?? 'unknown',
    /** Total pending messages across all streams */
    totalPending: query.data?.totalPending ?? '0',
    /** Estimated seconds to process backlog */
    estimatedCatchupSeconds: query.data?.estimatedCatchupSeconds ?? '0',
    /** Per-stream status breakdown */
    streams: query.data?.streams ?? [],
    /** When the status was last queried */
    queriedAt: query.data?.queriedAt,
    /** Warning message (if any) */
    warning: query.data?.warning,
    /** Whether the query succeeded */
    success: query.data?.success ?? false,
    /** Error message from API */
    errorMessage: query.data?.errorMessage,
    /** Whether the initial check is loading */
    isLoading: query.isLoading,
    /** Whether a refetch is in progress */
    isFetching: query.isFetching,
    /** Force a status check now */
    refetch: query.refetch,
    /** Full query result for advanced usage */
    query,
  }
}
