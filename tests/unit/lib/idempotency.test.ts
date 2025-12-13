import { describe, test, expect } from 'vitest'
import { generateIdempotencyKey } from '@/lib/utils/idempotency'

describe('generateIdempotencyKey', () => {
  test('generates unique keys on repeated calls', () => {
    const key1 = generateIdempotencyKey('user-1', 'waive-fee')
    const key2 = generateIdempotencyKey('user-1', 'waive-fee')

    expect(key1).not.toBe(key2)
  })

  test('key format matches {userId}-{action}-{timestamp}-{random}', () => {
    const key = generateIdempotencyKey('user-123', 'record-repayment')

    // nanoid generates URL-safe characters: a-zA-Z0-9_-
    expect(key).toMatch(/^user-123-record-repayment-\d+-[a-zA-Z0-9_-]{8}$/)
  })

  test('includes all components', () => {
    const key = generateIdempotencyKey('abc', 'xyz')
    
    // Key format: {userId}-{action}-{timestamp}-{random8}
    // Note: nanoid can contain '-', so we match using regex instead of split
    expect(key).toMatch(/^abc-xyz-\d+-[a-zA-Z0-9_-]{8}$/)
    
    // Verify starts with userId-action
    expect(key.startsWith('abc-xyz-')).toBe(true)
  })

  test('timestamp is recent', () => {
    const before = Date.now()
    const key = generateIdempotencyKey('user', 'action')
    const after = Date.now()

    const parts = key.split('-')
    const timestamp = parseInt(parts[2], 10)

    expect(timestamp).toBeGreaterThanOrEqual(before)
    expect(timestamp).toBeLessThanOrEqual(after)
  })

  test('handles special characters in userId', () => {
    const key = generateIdempotencyKey('user@123', 'action')

    expect(key).toContain('user@123')
  })
})
