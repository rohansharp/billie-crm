/**
 * Unit Tests for Event Sourcing Infrastructure
 *
 * Tests for:
 * - Event creation
 * - Polling utilities
 * - Zod schemas
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  WriteOffRequestCommandSchema,
  WriteOffApproveCommandSchema,
  WriteOffRejectCommandSchema,
  WriteOffCancelCommandSchema,
} from '@/lib/events/schemas'
import {
  CRM_AGENT_ID,
  EVENT_TYPE_WRITEOFF_REQUESTED,
  REDIS_PUBLISH_STREAM,
} from '@/lib/events/config'

// =============================================================================
// Schema Validation Tests
// =============================================================================

describe('WriteOffRequestCommandSchema', () => {
  it('should validate a complete valid request', () => {
    const validRequest = {
      loanAccountId: 'acc-123',
      customerId: 'cust-456',
      customerName: 'John Smith',
      accountNumber: '1234567890',
      amount: 1500.0,
      originalBalance: 1500.0,
      reason: 'hardship',
      notes: 'Customer experiencing financial hardship',
      priority: 'normal',
    }

    const result = WriteOffRequestCommandSchema.safeParse(validRequest)
    expect(result.success).toBe(true)
  })

  it('should accept all valid reason values', () => {
    const validReasons = [
      'hardship',
      'bankruptcy',
      'deceased',
      'unable_to_locate',
      'fraud_victim',
      'disputed',
      'aged_debt',
      'other',
    ]

    validReasons.forEach((reason) => {
      const request = {
        loanAccountId: 'acc-123',
        customerId: 'cust-456',
        customerName: 'John Smith',
        accountNumber: '123',
        amount: 100,
        originalBalance: 100,
        reason,
      }
      const result = WriteOffRequestCommandSchema.safeParse(request)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid reason values', () => {
    const request = {
      loanAccountId: 'acc-123',
      customerId: 'cust-456',
      customerName: 'John Smith',
      accountNumber: '123',
      amount: 100,
      originalBalance: 100,
      reason: 'invalid_reason',
    }

    const result = WriteOffRequestCommandSchema.safeParse(request)
    expect(result.success).toBe(false)
  })

  it('should reject negative amounts', () => {
    const request = {
      loanAccountId: 'acc-123',
      customerId: 'cust-456',
      customerName: 'John Smith',
      accountNumber: '123',
      amount: -100,
      originalBalance: 100,
      reason: 'hardship',
    }

    const result = WriteOffRequestCommandSchema.safeParse(request)
    expect(result.success).toBe(false)
  })

  it('should reject empty loanAccountId', () => {
    const request = {
      loanAccountId: '',
      customerId: 'cust-456',
      customerName: 'John Smith',
      accountNumber: '123',
      amount: 100,
      originalBalance: 100,
      reason: 'hardship',
    }

    const result = WriteOffRequestCommandSchema.safeParse(request)
    expect(result.success).toBe(false)
  })

  it('should default priority to normal if not provided', () => {
    const request = {
      loanAccountId: 'acc-123',
      customerId: 'cust-456',
      customerName: 'John Smith',
      accountNumber: '123',
      amount: 100,
      originalBalance: 100,
      reason: 'hardship',
    }

    const result = WriteOffRequestCommandSchema.safeParse(request)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe('normal')
    }
  })
})

describe('WriteOffApproveCommandSchema', () => {
  it('should validate a valid approval command', () => {
    const command = {
      requestId: 'req-123',
      requestNumber: 'WO-20241211-ABCD',
      comment: 'Approved after review of supporting documentation',
    }

    const result = WriteOffApproveCommandSchema.safeParse(command)
    expect(result.success).toBe(true)
  })

  it('should reject comment shorter than 10 characters', () => {
    const command = {
      requestId: 'req-123',
      requestNumber: 'WO-20241211-ABCD',
      comment: 'Approved', // Only 8 characters
    }

    const result = WriteOffApproveCommandSchema.safeParse(command)
    expect(result.success).toBe(false)
  })

  it('should reject empty requestId', () => {
    const command = {
      requestId: '',
      requestNumber: 'WO-20241211-ABCD',
      comment: 'Approved after review',
    }

    const result = WriteOffApproveCommandSchema.safeParse(command)
    expect(result.success).toBe(false)
  })
})

describe('WriteOffRejectCommandSchema', () => {
  it('should validate a valid rejection command', () => {
    const command = {
      requestId: 'req-123',
      requestNumber: 'WO-20241211-ABCD',
      reason: 'Insufficient documentation provided',
    }

    const result = WriteOffRejectCommandSchema.safeParse(command)
    expect(result.success).toBe(true)
  })

  it('should reject reason shorter than 10 characters', () => {
    const command = {
      requestId: 'req-123',
      requestNumber: 'WO-20241211-ABCD',
      reason: 'No docs', // Only 7 characters
    }

    const result = WriteOffRejectCommandSchema.safeParse(command)
    expect(result.success).toBe(false)
  })
})

describe('WriteOffCancelCommandSchema', () => {
  it('should validate a valid cancellation command', () => {
    const command = {
      requestId: 'req-123',
      requestNumber: 'WO-20241211-ABCD',
    }

    const result = WriteOffCancelCommandSchema.safeParse(command)
    expect(result.success).toBe(true)
  })

  it('should reject empty requestNumber', () => {
    const command = {
      requestId: 'req-123',
      requestNumber: '',
    }

    const result = WriteOffCancelCommandSchema.safeParse(command)
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// Configuration Tests
// =============================================================================

describe('Event Configuration', () => {
  it('should have correct CRM agent ID', () => {
    expect(CRM_AGENT_ID).toBe('billie-crm')
  })

  it('should have correct default publish stream', () => {
    expect(REDIS_PUBLISH_STREAM).toBe('inbox:billie-servicing:internal')
  })

  it('should have correct event type for writeoff requested', () => {
    expect(EVENT_TYPE_WRITEOFF_REQUESTED).toBe('writeoff.requested.v1')
  })
})
