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
}

/**
 * Hook to fetch closed periods from the Ledger service.
 *
 * @returns Query result with closed periods list and last closed period date
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useClosedPeriods()
 * // data?.periods - array of closed periods
 * // data?.lastClosedPeriod - "2025-12-31"
 * ```
 */
export function useClosedPeriods() {
  return useQuery<ClosedPeriodsResponse>({
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
}

export default useClosedPeriods
