import { useQuery } from '@tanstack/react-query'

/**
 * ECL summary for a single aging bucket
 */
export interface ECLBucketSummary {
  bucket: string
  accountCount: number
  totalEcl: string
  totalCarryingAmount: string
  averagePdRate: string
}

/**
 * Portfolio ECL response from API
 */
export interface PortfolioECLResponse {
  asOfDate: string
  totalAccounts: number
  totalEcl: string
  totalCarryingAmount: string
  buckets: ECLBucketSummary[]
  _fallback?: boolean
  _message?: string
}

/**
 * Options for usePortfolioECL hook
 */
export interface UsePortfolioECLOptions {
  /** Enable/disable the query (default: true) */
  enabled?: boolean
}

/**
 * Fetch portfolio ECL from the API
 */
async function fetchPortfolioECL(): Promise<PortfolioECLResponse> {
  const response = await fetch('/api/ledger/ecl/portfolio')

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch portfolio ECL')
  }

  return response.json()
}

/**
 * Query key for portfolio ECL
 */
export const portfolioECLQueryKey = ['portfolio-ecl'] as const

/**
 * Hook to fetch portfolio-wide ECL summary with bucket breakdown.
 *
 * Features:
 * - Returns total ECL and carrying amount
 * - Includes per-bucket breakdown
 * - Auto-refreshes every 60 seconds
 * - Graceful fallback when service unavailable
 *
 * @example
 * ```tsx
 * const { totalEcl, buckets, isLoading } = usePortfolioECL()
 *
 * if (isLoading) return <Skeleton />
 *
 * return (
 *   <div>
 *     <h2>Portfolio ECL: {formatCurrency(totalEcl)}</h2>
 *     {buckets.map(b => (
 *       <div key={b.bucket}>{b.bucket}: {formatCurrency(b.totalEcl)}</div>
 *     ))}
 *   </div>
 * )
 * ```
 */
export function usePortfolioECL(options: UsePortfolioECLOptions = {}) {
  const { enabled = true } = options

  const query = useQuery({
    queryKey: portfolioECLQueryKey,
    queryFn: fetchPortfolioECL,
    enabled,
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 60_000, // Refresh every 60s
  })

  return {
    /** Timestamp of the aggregation */
    asOfDate: query.data?.asOfDate,
    /** Total accounts with ECL state */
    totalAccounts: query.data?.totalAccounts ?? 0,
    /** Portfolio-wide ECL sum */
    totalEcl: query.data?.totalEcl ?? '0.00',
    /** Portfolio-wide carrying amount */
    totalCarryingAmount: query.data?.totalCarryingAmount ?? '0.00',
    /** Per-bucket breakdown */
    buckets: query.data?.buckets ?? [],
    /** Whether data is from fallback (service unavailable) */
    isFallback: query.data?._fallback ?? false,
    /** Whether the initial load is in progress */
    isLoading: query.isLoading,
    /** Whether a refetch is in progress */
    isFetching: query.isFetching,
    /** Error if the fetch failed */
    error: query.error,
    /** Force a refetch */
    refetch: query.refetch,
    /** Full query result for advanced usage */
    query,
  }
}
