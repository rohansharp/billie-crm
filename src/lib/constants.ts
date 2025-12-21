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

// =============================================================================
// Toast IDs (for deduplication)
// =============================================================================

/**
 * Toast ID for system restored notification.
 * Used to prevent duplicate toasts when ledger recovers.
 */
export const TOAST_ID_SYSTEM_RESTORED = 'system-restored'

// =============================================================================
// Failed Actions Constants
// =============================================================================

/**
 * localStorage key for persisting failed actions.
 */
export const FAILED_ACTIONS_STORAGE_KEY = 'billie-crm-failed-actions'

/**
 * Time-to-live for failed actions in localStorage (in milliseconds).
 * Default: 24 hours
 */
export const FAILED_ACTIONS_TTL_MS = 24 * 60 * 60 * 1000

/**
 * Maximum number of failed actions to store.
 */
export const MAX_FAILED_ACTIONS = 50

/**
 * Maximum retry attempts before disabling retry button.
 */
export const MAX_RETRY_ATTEMPTS = 5

// =============================================================================
// Version Conflict Detection Constants
// =============================================================================

/**
 * Feature flag for version conflict checking.
 * Set to false to disable version checks during migration.
 */
export const VERSION_CONFLICT_CHECK_ENABLED = true

/**
 * Error code returned when a version conflict is detected.
 */
export const VERSION_CONFLICT_ERROR_CODE = 'VERSION_CONFLICT'

// =============================================================================
// Error Handling Constants
// =============================================================================

/**
 * Network timeout for fetch requests (in milliseconds).
 * Default: 30 seconds
 */
export const NETWORK_TIMEOUT_MS = 30_000

/**
 * Prefix for generated error IDs.
 * Format: ERR-{nanoid}
 */
export const ERROR_ID_PREFIX = 'ERR'
