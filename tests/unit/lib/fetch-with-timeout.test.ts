import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWithTimeout, createFetchWithTimeout } from '@/lib/utils/fetch-with-timeout'
import { AppError } from '@/lib/utils/error'
import { ERROR_CODES } from '@/lib/errors/codes'

// Store original fetch
const originalFetch = global.fetch

describe('fetchWithTimeout', () => {
  afterEach(() => {
    vi.useRealTimers()
    global.fetch = originalFetch
  })

  it('should return response when fetch succeeds', async () => {
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), { status: 200 })
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const response = await fetchWithTimeout('/api/test', { method: 'GET' })

    expect(response).toBe(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'GET',
        signal: expect.any(AbortSignal),
      })
    )
  })

  it('should throw NETWORK_ERROR AppError on fetch TypeError', async () => {
    const error = new TypeError('Failed to fetch')
    global.fetch = vi.fn().mockRejectedValue(error)

    await expect(fetchWithTimeout('/api/test')).rejects.toThrow(AppError)
    await expect(fetchWithTimeout('/api/test')).rejects.toMatchObject({
      code: ERROR_CODES.NETWORK_ERROR,
    })
  })

  it('should re-throw non-network errors', async () => {
    const error = new Error('Some other error')
    global.fetch = vi.fn().mockRejectedValue(error)

    await expect(fetchWithTimeout('/api/test')).rejects.toThrow('Some other error')
  })

  it('should convert AbortError to NETWORK_TIMEOUT', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    global.fetch = vi.fn().mockRejectedValue(abortError)

    await expect(fetchWithTimeout('/api/test')).rejects.toThrow(AppError)
    await expect(fetchWithTimeout('/api/test')).rejects.toMatchObject({
      code: ERROR_CODES.NETWORK_TIMEOUT,
    })
  })

  it('should include details in network error', async () => {
    const error = new TypeError('Failed to fetch')
    global.fetch = vi.fn().mockRejectedValue(error)

    try {
      await fetchWithTimeout('/api/specific-endpoint')
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      expect((err as AppError).details?.url).toBe('/api/specific-endpoint')
    }
  })
})

describe('createFetchWithTimeout', () => {
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('should create fetch function with default timeout', async () => {
    const mockResponse = new Response('OK')
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const customFetch = createFetchWithTimeout(5000)
    const response = await customFetch('/api/test')
    
    expect(global.fetch).toHaveBeenCalled()
    expect(response).toBeDefined()
  })

  it('should pass signal to fetch', async () => {
    const mockResponse = new Response('OK')
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const customFetch = createFetchWithTimeout(5000)
    await customFetch('/api/test')
    
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    )
  })
})
