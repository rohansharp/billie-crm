import { useQuery } from '@tanstack/react-query'

/**
 * Accrual trace source event
 */
export interface AccrualSourceEvent {
  eventId: string
  timestamp: string
  eventType: string
  field: string
  value: string | number
  description: string
}

/**
 * Accrual trace result
 */
export interface AccrualTraceResult {
  accountId: string
  currentAccruedAmount: number
  calculationDate: string
  // Source disbursement info
  disbursement: {
    eventId: string
    timestamp: string
    amount: number
    feeAmount: number
    termDays: number
    effectiveRate: number
  }
  // Daily rate calculation
  dailyRate: {
    value: number
    formula: string
    sources: AccrualSourceEvent[]
  }
  // Accrual progression
  accrualEvents: Array<{
    eventId: string
    timestamp: string
    dayNumber: number
    dailyAmount: number
    cumulativeAmount: number
  }>
  // Summary
  totalEventCount: number
  daysAccrued: number
  remainingDays: number
}

export const traceAccrualQueryKey = (accountId: string) => ['trace-accrual', accountId] as const

/**
 * Hook to trace accrued yield back to source events.
 *
 * @param accountId - Account ID to trace
 * @param enabled - Whether to enable the query
 * @returns Query result with accrual trace
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTraceAccrual('acc-123')
 * // data?.disbursement - Original disbursement info
 * ```
 */
export function useTraceAccrual(accountId: string, enabled = true) {
  return useQuery<AccrualTraceResult>({
    queryKey: traceAccrualQueryKey(accountId),
    queryFn: async () => {
      const res = await fetch(`/api/investigation/trace/accrual/${accountId}`)
      if (!res.ok) {
        throw new Error('Failed to trace accrual')
      }
      return res.json()
    },
    enabled: enabled && !!accountId,
    staleTime: 60_000,
  })
}

export default useTraceAccrual
