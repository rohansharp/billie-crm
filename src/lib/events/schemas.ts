/**
 * Event Sourcing Zod Schemas
 *
 * Validation schemas for event payloads.
 * Used to validate incoming command requests before publishing events.
 */

import { z } from 'zod'

// =============================================================================
// Write-Off Request Schema
// =============================================================================

/**
 * Valid reasons for a write-off request.
 */
export const WriteOffReasonSchema = z.enum([
  'hardship',
  'bankruptcy',
  'deceased',
  'unable_to_locate',
  'fraud_victim',
  'disputed',
  'aged_debt',
  'other',
])

/**
 * Priority levels for write-off requests.
 */
export const WriteOffPrioritySchema = z.enum(['normal', 'high', 'urgent'])

/**
 * Schema for the write-off request command (input from client).
 * This is what the client sends to the command API.
 */
export const WriteOffRequestCommandSchema = z.object({
  loanAccountId: z.string().min(1, 'Loan account ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  amount: z.number().positive('Amount must be positive'),
  originalBalance: z.number().nonnegative('Original balance cannot be negative'),
  reason: WriteOffReasonSchema,
  notes: z.string().optional(),
  priority: WriteOffPrioritySchema.default('normal'),
})

export type WriteOffRequestCommand = z.infer<typeof WriteOffRequestCommandSchema>

// =============================================================================
// Write-Off Approval Schema
// =============================================================================

/**
 * Schema for the write-off approval command (input from client).
 */
export const WriteOffApproveCommandSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  requestNumber: z.string().min(1, 'Request number is required'),
  comment: z.string().min(10, 'Approval comment must be at least 10 characters'),
})

export type WriteOffApproveCommand = z.infer<typeof WriteOffApproveCommandSchema>

// =============================================================================
// Write-Off Rejection Schema
// =============================================================================

/**
 * Schema for the write-off rejection command (input from client).
 */
export const WriteOffRejectCommandSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  requestNumber: z.string().min(1, 'Request number is required'),
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
})

export type WriteOffRejectCommand = z.infer<typeof WriteOffRejectCommandSchema>

// =============================================================================
// Write-Off Cancellation Schema
// =============================================================================

/**
 * Schema for the write-off cancellation command (input from client).
 */
export const WriteOffCancelCommandSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  requestNumber: z.string().min(1, 'Request number is required'),
})

export type WriteOffCancelCommand = z.infer<typeof WriteOffCancelCommandSchema>

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Schema for successful publish response.
 */
export const PublishSuccessResponseSchema = z.object({
  eventId: z.string(),
  requestId: z.string(),
  status: z.literal('accepted'),
  message: z.string(),
})

/**
 * Schema for error response.
 */
export const PublishErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})
