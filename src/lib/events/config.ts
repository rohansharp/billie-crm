/**
 * Event Sourcing Configuration
 *
 * Configurable via environment variables for stream names and event types.
 * This allows the infrastructure team to route events appropriately.
 */

// =============================================================================
// Redis Stream Configuration
// =============================================================================

/**
 * The Redis stream to publish CRM-originated events to.
 * This is a dedicated internal stream consumed directly by the Event Processor.
 * No external router dependency - events flow directly to the processor.
 * Default: 'inbox:billie-servicing:internal'
 */
export const REDIS_PUBLISH_STREAM =
  process.env.REDIS_PUBLISH_STREAM ?? 'inbox:billie-servicing:internal'

/**
 * The Redis stream for external events (routed from ecosystem via Event Router).
 * This is configured here for reference but consumed by the Python service.
 * Default: 'inbox:billie-servicing'
 */
export const REDIS_EXTERNAL_STREAM =
  process.env.REDIS_EXTERNAL_STREAM ?? 'inbox:billie-servicing'

// =============================================================================
// Event Types (Write-Off)
// =============================================================================

/**
 * Event type for write-off request submission.
 */
export const EVENT_TYPE_WRITEOFF_REQUESTED =
  process.env.EVENT_TYPE_WRITEOFF_REQUESTED ?? 'writeoff.requested.v1'

/**
 * Event type for write-off approval.
 */
export const EVENT_TYPE_WRITEOFF_APPROVED =
  process.env.EVENT_TYPE_WRITEOFF_APPROVED ?? 'writeoff.approved.v1'

/**
 * Event type for write-off rejection.
 */
export const EVENT_TYPE_WRITEOFF_REJECTED =
  process.env.EVENT_TYPE_WRITEOFF_REJECTED ?? 'writeoff.rejected.v1'

/**
 * Event type for write-off cancellation.
 */
export const EVENT_TYPE_WRITEOFF_CANCELLED =
  process.env.EVENT_TYPE_WRITEOFF_CANCELLED ?? 'writeoff.cancelled.v1'

// =============================================================================
// Publisher Configuration
// =============================================================================

/**
 * Agent identifier for CRM-originated events.
 */
export const CRM_AGENT_ID = 'billie-crm'

/**
 * Number of retry attempts for publishing events.
 */
export const PUBLISH_MAX_RETRIES = 3

/**
 * Backoff delays in milliseconds for each retry attempt.
 */
export const PUBLISH_BACKOFF_MS = [100, 200, 400] as const

// =============================================================================
// Event Registry (for external routing configuration)
// =============================================================================

/**
 * All CRM-originated event types.
 * Export this for routing configuration and documentation.
 */
export const CRM_EVENT_TYPES = {
  writeoff: {
    requested: EVENT_TYPE_WRITEOFF_REQUESTED,
    approved: EVENT_TYPE_WRITEOFF_APPROVED,
    rejected: EVENT_TYPE_WRITEOFF_REJECTED,
    cancelled: EVENT_TYPE_WRITEOFF_CANCELLED,
  },
} as const

/**
 * Flat list of all CRM event types for routing configuration.
 */
export const ALL_CRM_EVENT_TYPES = [
  EVENT_TYPE_WRITEOFF_REQUESTED,
  EVENT_TYPE_WRITEOFF_APPROVED,
  EVENT_TYPE_WRITEOFF_REJECTED,
  EVENT_TYPE_WRITEOFF_CANCELLED,
] as const
