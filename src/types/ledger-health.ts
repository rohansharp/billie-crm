/**
 * Ledger Health Types
 *
 * Shared type definitions for ledger health check functionality.
 * Used by both the API endpoint and the client hook.
 */

/**
 * Possible health statuses for the ledger service
 */
export type LedgerHealthStatus = 'connected' | 'degraded' | 'offline'

/**
 * Response structure from the health check API
 */
export interface LedgerHealthResponse {
  /** Current health status */
  status: LedgerHealthStatus
  /** Response latency in milliseconds */
  latencyMs: number
  /** Human-readable status message */
  message: string
  /** ISO timestamp of when the check occurred */
  checkedAt: string
}
