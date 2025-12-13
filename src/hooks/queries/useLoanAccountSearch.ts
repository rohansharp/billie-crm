'use client'

import { useQuery } from '@tanstack/react-query'
import { useDeferredValue } from 'react'
import type { LoanAccountSearchResponse } from '@/types/search'

// Re-export types for convenience
export type { LoanAccountSearchResult, LoanAccountSearchResponse } from '@/types/search'

async function searchLoanAccounts(query: string): Promise<LoanAccountSearchResponse> {
  if (query.length < 3) {
    return { results: [], total: 0 }
  }

  const res = await fetch(`/api/loan-accounts/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) {
    throw new Error('Loan account search failed')
  }
  return res.json()
}

/**
 * Hook to search loan accounts with priority-based rendering and caching.
 *
 * Uses React 19's useDeferredValue for priority-based rendering optimization.
 * The `enabled` condition (>= 3 chars) prevents unnecessary API calls.
 *
 * @param query - Search query string
 * @returns TanStack Query result with search results
 */
export function useLoanAccountSearch(query: string) {
  const deferredQuery = useDeferredValue(query)

  return useQuery({
    queryKey: ['loan-account-search', deferredQuery],
    queryFn: () => searchLoanAccounts(deferredQuery),
    enabled: deferredQuery.length >= 3,
    staleTime: 30_000, // 30 seconds - cache results
    placeholderData: (previousData) => previousData,
  })
}
