import { useQuery } from '@tanstack/react-query'

/**
 * ECL trace source event
 */
export interface ECLSourceEvent {
  eventId: string
  timestamp: string
  eventType: string
  field: string
  value: string | number
  description: string
}

/**
 * ECL trace result
 */
export interface ECLTraceResult {
  accountId: string
  currentECL: number
  carryingAmount: number
  calculationDate: string
  // Trigger info
  triggerEvent: {
    eventId: string
    timestamp: string
    eventType: string
  }
  // Calculation inputs
  inputs: {
    pdRate: number
    pdRateSource: ECLSourceEvent
    lgd: number
    lgdSource: ECLSourceEvent
    ead: number
    eadSource: ECLSourceEvent
    overlayMultiplier: number
    overlaySource: ECLSourceEvent
  }
  // Formula breakdown
  formula: string
  intermediateSteps: Array<{
    step: string
    value: number
    description: string
  }>
}

export const traceECLQueryKey = (accountId: string) => ['trace-ecl', accountId] as const

/**
 * Hook to trace ECL calculation back to source events.
 *
 * @param accountId - Account ID to trace
 * @param enabled - Whether to enable the query
 * @returns Query result with ECL trace
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTraceECL('acc-123')
 * // data?.inputs - ECL calculation inputs with sources
 * ```
 */
export function useTraceECL(accountId: string, enabled = true) {
  return useQuery<ECLTraceResult>({
    queryKey: traceECLQueryKey(accountId),
    queryFn: async () => {
      const res = await fetch(`/api/investigation/trace/ecl/${accountId}`)
      if (!res.ok) {
        throw new Error('Failed to trace ECL')
      }
      return res.json()
    },
    enabled: enabled && !!accountId,
    staleTime: 60_000,
  })
}

export default useTraceECL
