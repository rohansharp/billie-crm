import { useQuery } from '@tanstack/react-query'

/**
 * PD rate configuration per bucket
 */
export interface PDRateConfig {
  bucket: string
  rate: number
  updatedAt: string
  updatedBy: string
  updatedByName?: string
}

/**
 * ECL Configuration from the Ledger service
 */
export interface ECLConfig {
  overlayMultiplier: number
  overlayUpdatedAt: string
  overlayUpdatedBy: string
  overlayUpdatedByName?: string
  pdRates: PDRateConfig[]
  lgd: number
  lgdUpdatedAt?: string
  lgdUpdatedBy?: string
}

export const eclConfigQueryKey = ['ecl-config'] as const

/**
 * Hook to fetch ECL configuration from the Ledger service.
 *
 * @returns Query result with ECL config including overlay multiplier and PD rates
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useECLConfig()
 * // data?.overlayMultiplier - 1.2
 * // data?.pdRates - array of bucket configs
 * ```
 */
export function useECLConfig() {
  return useQuery<ECLConfig>({
    queryKey: eclConfigQueryKey,
    queryFn: async () => {
      const res = await fetch('/api/ecl-config')
      if (!res.ok) {
        throw new Error('Failed to fetch ECL configuration')
      }
      return res.json()
    },
    staleTime: 60_000, // 1 minute
  })
}

export default useECLConfig
