/**
 * Application-wide constants for Billie CRM.
 * Centralized to avoid duplication and ensure consistency.
 */

/**
 * Minimum length for approval/rejection comments.
 * Used in write-off approval workflows.
 */
export const MIN_APPROVAL_COMMENT_LENGTH = 10

/**
 * Default fallback name for unknown users in audit trails.
 */
export const UNKNOWN_USER_FALLBACK = 'Unknown User'

/**
 * Default page size for paginated lists.
 * Used in approval history and other list views.
 */
export const DEFAULT_PAGE_SIZE = 20

// =============================================================================
// Ledger Health Check Constants
// =============================================================================

/**
 * Polling interval for ledger health checks (in milliseconds).
 * Default: 30 seconds
 */
export const HEALTH_CHECK_INTERVAL_MS = 30_000

/**
 * Latency threshold for "degraded" status (in milliseconds).
 * Response times above this are considered degraded.
 */
export const HEALTH_DEGRADED_THRESHOLD_MS = 1_000

/**
 * Latency threshold for "offline" status (in milliseconds).
 * Response times above this (or errors) are considered offline.
 */
export const HEALTH_OFFLINE_THRESHOLD_MS = 5_000

/**
 * Test loan account ID used for health checks.
 * This should be a known-existing account for reliable pings.
 */
export const HEALTH_CHECK_TEST_ACCOUNT = 'health-check-ping'

/**
 * Threshold for displaying latency in the UI (in milliseconds).
 * Latency is only shown if response time exceeds this value.
 */
export const LATENCY_DISPLAY_THRESHOLD_MS = 500
