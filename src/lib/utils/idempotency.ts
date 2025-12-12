import { nanoid } from 'nanoid'

/**
 * Generates an idempotency key for write operations.
 * Format: {userId}-{action}-{timestamp}-{random8chars}
 *
 * @param userId - The current user's ID
 * @param action - The action type (e.g., 'waive-fee', 'record-repayment')
 * @returns A unique idempotency key
 */
export function generateIdempotencyKey(userId: string, action: string): string {
  return `${userId}-${action}-${Date.now()}-${nanoid(8)}`
}
