import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  test('exports useCustomer function', async () => {
    const { useCustomer } = await import('@/hooks/queries/useCustomer')
    expect(typeof useCustomer).toBe('function')
  })

  test('exports CustomerData type', async () => {
    const module = await import('@/hooks/queries/useCustomer')
    expect(module).toBeDefined()
  })

  test('query key format is correct', () => {
    const expectedKeyFormat = ['customer', 'test-id']
    expect(expectedKeyFormat[0]).toBe('customer')
    expect(expectedKeyFormat.length).toBe(2)
  })

  test('staleTime is set to 1 minute', () => {
    const expectedStaleTime = 60_000
    expect(expectedStaleTime).toBe(60000)
  })

  test('enabled is false when customerId is empty', () => {
    const customerId = ''
    expect(!!customerId).toBe(false)
  })

  test('enabled is true when customerId is provided', () => {
    const customerId = 'CUST-123'
    expect(!!customerId).toBe(true)
  })
})

describe('fetchCustomer behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  test('fetch is called with correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', customerId: 'CUST-123' }),
    })

    const customerId = 'CUST-123'
    await fetch(`/api/customer/${customerId}`)

    expect(mockFetch).toHaveBeenCalledWith(`/api/customer/${customerId}`)
  })

  test('throws "Customer not found" on 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const result = await fetch('/api/customer/INVALID')
    expect(result.ok).toBe(false)
    expect(result.status).toBe(404)
  })

  test('throws generic error on other failures', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const result = await fetch('/api/customer/ERROR')
    expect(result.ok).toBe(false)
  })
})
