/**
 * Unit Tests for Polling Utilities
 *
 * Tests for the event sourcing polling functions.
 * Uses real timers with short intervals for simplicity.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  pollForWriteOffRequest,
  pollForWriteOffUpdate,
  pollUntil,
  PollTimeoutError,
} from '@/lib/events/poll'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('pollForWriteOffRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the document when found on first attempt', async () => {
    const mockDoc = {
      id: 'doc-123',
      requestNumber: 'WO-TEST-001',
      eventId: 'evt-123',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ docs: [mockDoc] }),
    })

    const result = await pollForWriteOffRequest('evt-123', {
      maxAttempts: 3,
      intervalMs: 10,
      initialDelayMs: 0,
    })

    expect(result).toEqual(mockDoc)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should poll multiple times until document is found', async () => {
    const mockDoc = {
      id: 'doc-123',
      requestNumber: 'WO-TEST-001',
      eventId: 'evt-123',
    }

    // First two attempts return empty, third returns the doc
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ docs: [] }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ docs: [] }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ docs: [mockDoc] }) })

    const result = await pollForWriteOffRequest('evt-123', {
      maxAttempts: 5,
      intervalMs: 10,
      initialDelayMs: 0,
    })

    expect(result).toEqual(mockDoc)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('should throw PollTimeoutError after max attempts', async () => {
    // All attempts return empty
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ docs: [] }) })

    await expect(
      pollForWriteOffRequest('evt-123', {
        maxAttempts: 3,
        intervalMs: 10,
        initialDelayMs: 0,
      })
    ).rejects.toThrow(PollTimeoutError)

    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('should continue polling on fetch errors', async () => {
    const mockDoc = { id: 'doc-123', eventId: 'evt-123' }

    // First attempt throws, second returns doc
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ docs: [mockDoc] }) })

    const result = await pollForWriteOffRequest('evt-123', {
      maxAttempts: 3,
      intervalMs: 10,
      initialDelayMs: 0,
    })

    expect(result).toEqual(mockDoc)
  })

  it('should include eventId in query string', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ docs: [] }) })

    try {
      await pollForWriteOffRequest('my-event-id', {
        maxAttempts: 1,
        intervalMs: 10,
        initialDelayMs: 0,
      })
    } catch {
      // Expected timeout
    }

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('eventId')
    )
  })
})

describe('pollForWriteOffUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return document when status matches expected', async () => {
    const mockDoc = {
      id: 'doc-123',
      requestId: 'req-123',
      status: 'approved',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ docs: [mockDoc] }),
    })

    const result = await pollForWriteOffUpdate('req-123', 'approved', {
      maxAttempts: 3,
      intervalMs: 10,
      initialDelayMs: 0,
    })

    expect(result).toEqual(mockDoc)
  })

  it('should include requestId and status in query', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ docs: [] }) })

    try {
      await pollForWriteOffUpdate('req-abc', 'rejected', {
        maxAttempts: 1,
        intervalMs: 10,
        initialDelayMs: 0,
      })
    } catch {
      // Expected timeout
    }

    const callUrl = mockFetch.mock.calls[0][0]
    expect(callUrl).toContain('requestId')
    expect(callUrl).toContain('status')
  })
})

describe('pollUntil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return result when fetchFn returns truthy value', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ data: 'found' })

    const result = await pollUntil(fetchFn, {
      maxAttempts: 5,
      intervalMs: 10,
      initialDelayMs: 0,
    })

    expect(result).toEqual({ data: 'found' })
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('should throw PollTimeoutError with custom label', async () => {
    const fetchFn = vi.fn().mockResolvedValue(null)

    await expect(
      pollUntil(fetchFn, {
        maxAttempts: 2,
        intervalMs: 10,
        initialDelayMs: 0,
        label: 'custom-projection',
      })
    ).rejects.toThrow('custom-projection')
  })
})

describe('PollTimeoutError', () => {
  it('should include eventId and attempts in error', () => {
    const error = new PollTimeoutError('evt-123', 5)

    expect(error.eventId).toBe('evt-123')
    expect(error.attempts).toBe(5)
    expect(error.name).toBe('PollTimeoutError')
    expect(error.message).toContain('5 attempts')
    expect(error.message).toContain('evt-123')
  })
})
