import { useQuery } from '@tanstack/react-query'

/**
 * ECL config change history entry
 */
export interface ECLConfigHistoryEntry {
  id: string
  timestamp: string
  parameter: 'overlay_multiplier' | 'pd_rate' | 'lgd'
  bucket?: string // For PD rate changes
  oldValue: number
  newValue: number
  changedBy: string
  changedByName?: string
  reason?: string
}

export interface ECLConfigHistoryResponse {
  entries: ECLConfigHistoryEntry[]
  totalCount: number
  nextCursor?: string
}

export interface UseECLConfigHistoryOptions {
  limit?: number
  cursor?: string
  parameter?: string
  changedBy?: string
  enabled?: boolean
}

export const eclConfigHistoryQueryKey = (options?: UseECLConfigHistoryOptions) =>
  ['ecl-config', 'history', options] as const

/**
 * Hook to fetch ECL configuration change history.
 *
 * @param options - Pagination and filter options
 * @returns Query result with config change history
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useECLConfigHistory({ limit: 20 })
 * // data?.entries - array of history entries
 * ```
 */
export function useECLConfigHistory(options: UseECLConfigHistoryOptions = {}) {
  const { limit = 20, cursor, parameter, changedBy, enabled = true } = options

  return useQuery<ECLConfigHistoryResponse>({
    queryKey: eclConfigHistoryQueryKey(options),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (limit) params.set('limit', String(limit))
      if (cursor) params.set('cursor', cursor)
      if (parameter) params.set('parameter', parameter)
      if (changedBy) params.set('changedBy', changedBy)

      const res = await fetch(`/api/ecl-config/history?${params}`)
      if (!res.ok) {
        throw new Error('Failed to fetch ECL config history')
      }
      return res.json()
    },
    enabled,
    staleTime: 30_000,
  })
}

export default useECLConfigHistory
