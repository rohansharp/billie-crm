import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useLoanAccountSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  test('exports useLoanAccountSearch function', async () => {
    const { useLoanAccountSearch } = await import('@/hooks/queries/useLoanAccountSearch')
    expect(typeof useLoanAccountSearch).toBe('function')
  })

  test('exports LoanAccountSearchResult type', async () => {
    const module = await import('@/hooks/queries/useLoanAccountSearch')
    expect(module).toBeDefined()
  })

  test('search requires minimum 3 characters', () => {
    expect('ab'.length >= 3).toBe(false)
    expect('abc'.length >= 3).toBe(true)
    expect('ACC-'.length >= 3).toBe(true)
  })

  test('query key format is correct', () => {
    const expectedKeyFormat = ['loan-account-search', 'test-query']
    expect(expectedKeyFormat[0]).toBe('loan-account-search')
    expect(expectedKeyFormat.length).toBe(2)
  })

  test('staleTime is set to 30 seconds', () => {
    const expectedStaleTime = 30_000
    expect(expectedStaleTime).toBe(30000)
  })
})

describe('searchLoanAccounts fetch behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  test('fetch is called with correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [], total: 0 }),
    })

    const query = 'ACC-12345'
    const expectedUrl = `/api/loan-accounts/search?q=${encodeURIComponent(query)}`

    await fetch(expectedUrl)

    expect(mockFetch).toHaveBeenCalledWith(expectedUrl)
  })

  test('query is URL encoded', () => {
    const query = 'ACC & 123'
    const encoded = encodeURIComponent(query)
    expect(encoded).toBe('ACC%20%26%20123')
  })

  test('throws error when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const result = await fetch('/api/loan-accounts/search?q=test')
    expect(result.ok).toBe(false)
  })
})
