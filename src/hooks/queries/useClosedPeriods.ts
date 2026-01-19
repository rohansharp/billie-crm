import { useQuery } from '@tanstack/react-query'

/**
 * Closed period entry from the Ledger service
 */
export interface ClosedPeriod {
  periodDate: string // ISO date, e.g. "2026-01-31"
  closedAt: string // ISO timestamp
  closedBy: string
  closedByName?: string
  totalAccounts: number
  totalAccruedYield: number
  totalECLAllowance: number
  totalCarryingAmount: number
  journalEntries?: {
    id: string
    type: string
    amount: number
  }[]
}

interface ClosedPeriodsResponse {
  periods: ClosedPeriod[]
  lastClosedPeriod?: string // ISO date
  _fallback?: boolean
  _message?: string
}

/**
 * Hook to fetch closed periods from the Ledger service.
 *
 * @returns Query result with closed periods list and last closed period date
 *
 * @example
 * ```tsx
 * const { data, isLoading, isFallback } = useClosedPeriods()
 * // data?.periods - array of closed periods
 * // data?.lastClosedPeriod - "2025-12-31"
 * // isFallback - true if service unavailable
 * ```
 */
export function useClosedPeriods() {
  const query = useQuery<ClosedPeriodsResponse>({
    queryKey: ['period-close', 'history'],
    queryFn: async () => {
      const res = await fetch('/api/period-close/history')
      if (!res.ok) {
        throw new Error('Failed to fetch closed periods')
      }
      return res.json()
    },
    staleTime: 60_000, // 1 minute
  })

  return {
    ...query,
    /** Whether data is from fallback (service unavailable) */
    isFallback: query.data?._fallback ?? false,
    /** Fallback message if service unavailable */
    fallbackMessage: query.data?._message,
  }
}

export default useClosedPeriods
