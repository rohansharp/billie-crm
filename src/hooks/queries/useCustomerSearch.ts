'use client'

import { useQuery } from '@tanstack/react-query'
import { useDeferredValue } from 'react'
import type { SearchResponse } from '@/types/search'

// Re-export types for convenience
export type { CustomerSearchResult, SearchResponse } from '@/types/search'

async function searchCustomers(query: string): Promise<SearchResponse> {
  if (query.length < 3) {
    return { results: [], total: 0 }
  }

  const res = await fetch(`/api/customer/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) {
    throw new Error('Search failed')
  }
  return res.json()
}

/**
 * Hook to search customers with priority-based rendering and caching.
 *
 * Uses React 19's useDeferredValue for priority-based rendering optimization.
 * Note: useDeferredValue is NOT time-based debouncing - it allows React to
 * defer non-urgent updates. The `enabled` condition (>= 3 chars) prevents
 * unnecessary API calls for short queries. For high-traffic scenarios,
 * consider adding explicit debouncing via lodash.debounce or useDebouncedValue.
 *
 * @param query - Search query string
 * @returns TanStack Query result with search results
 */
export function useCustomerSearch(query: string) {
  // useDeferredValue allows React to defer this update during urgent updates
  // (like typing) to keep the UI responsive. This is priority-based, not time-based.
  const deferredQuery = useDeferredValue(query)

  return useQuery({
    queryKey: ['customer-search', deferredQuery],
    queryFn: () => searchCustomers(deferredQuery),
    enabled: deferredQuery.length >= 3,
    staleTime: 30_000, // 30 seconds - cache results
    placeholderData: (previousData) => previousData, // Keep showing previous results while loading
  })
}
