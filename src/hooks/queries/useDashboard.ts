import { useQuery } from '@tanstack/react-query'
import { useRecentCustomersStore } from '@/stores/recentCustomers'
import { useFailedActionsStore } from '@/stores/failed-actions'
import type { DashboardResponse } from '@/lib/schemas/dashboard'

/**
 * Fetch dashboard data from the API.
 */
async function fetchDashboard(recentCustomerIds: string[]): Promise<DashboardResponse> {
  const params =
    recentCustomerIds.length > 0 ? `?recentCustomerIds=${recentCustomerIds.join(',')}` : ''

  const response = await fetch(`/api/dashboard${params}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch dashboard')
  }

  return response.json()
}

/**
 * Query key for dashboard data.
 */
export const dashboardQueryKey = (recentCustomerIds: string[]) =>
  ['dashboard', recentCustomerIds] as const

/**
 * Options for useDashboard hook.
 */
export interface UseDashboardOptions {
  /** Enable/disable the query (default: true) */
  enabled?: boolean
}

/**
 * Hook to fetch and manage dashboard data.
 *
 * Features:
 * - Integrates with recentCustomers store for customer IDs
 * - Merges failedActionsCount from client-side store
 * - Auto-refreshes every 30 seconds
 * - Refetches on window focus
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDashboard()
 *
 * if (isLoading) return <Skeleton />
 *
 * return (
 *   <div>
 *     Hello, {data.user.firstName}!
 *     {data.actionItems.pendingApprovalsCount > 0 && (
 *       <Badge>{data.actionItems.pendingApprovalsCount}</Badge>
 *     )}
 *   </div>
 * )
 * ```
 *
 * Story 6.2: Dashboard Home Page
 */
export function useDashboard(options: UseDashboardOptions = {}) {
  const { enabled = true } = options

  // Get recent customer IDs from localStorage store
  const recentCustomers = useRecentCustomersStore((s) => s.customers)
  const recentCustomerIds = recentCustomers.map((c) => c.customerId)

  // Get failed actions count from client store
  const failedActionsCount = useFailedActionsStore((s) => s.getActiveCount())

  const query = useQuery({
    queryKey: dashboardQueryKey(recentCustomerIds),
    queryFn: () => fetchDashboard(recentCustomerIds),
    enabled,
    staleTime: 10_000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 30_000, // Refresh every 30s for pending approvals
  })

  // Merge client-side failed actions count into the response
  const data = query.data
    ? {
        ...query.data,
        actionItems: {
          ...query.data.actionItems,
          failedActionsCount, // Override with client-side count
        },
      }
    : undefined

  return {
    /** Dashboard data with merged client-side state */
    data,
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
