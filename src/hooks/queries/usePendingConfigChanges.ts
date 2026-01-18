import { useQuery } from '@tanstack/react-query'

/**
 * Pending configuration change
 */
export interface PendingConfigChange {
  id: string
  parameter: 'overlay_multiplier' | 'pd_rate' | 'lgd'
  bucket?: string // For PD rate changes
  currentValue: number
  newValue: number
  effectiveDate: string
  createdBy: string
  createdByName?: string
  createdAt: string
  reason?: string
}

export interface PendingConfigChangesResponse {
  changes: PendingConfigChange[]
}

export const pendingConfigChangesQueryKey = ['ecl-config', 'pending'] as const

/**
 * Hook to fetch pending ECL config changes.
 *
 * @returns Query result with pending config changes
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePendingConfigChanges()
 * // data?.changes - array of pending changes
 * ```
 */
export function usePendingConfigChanges() {
  return useQuery<PendingConfigChangesResponse>({
    queryKey: pendingConfigChangesQueryKey,
    queryFn: async () => {
      const res = await fetch('/api/ecl-config/pending')
      if (!res.ok) {
        throw new Error('Failed to fetch pending config changes')
      }
      return res.json()
    },
    staleTime: 30_000,
  })
}

export default usePendingConfigChanges
