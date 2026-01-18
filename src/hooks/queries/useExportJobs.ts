import { useQuery } from '@tanstack/react-query'

/**
 * Export job status
 */
export type ExportJobStatus = 'pending' | 'processing' | 'ready' | 'failed'

/**
 * Export job type
 */
export type ExportJobType = 'journal_entries' | 'audit_trail' | 'methodology'

/**
 * Export format
 */
export type ExportFormat = 'csv' | 'json' | 'xlsx'

/**
 * Export job
 */
export interface ExportJob {
  id: string
  type: ExportJobType
  format: ExportFormat
  status: ExportJobStatus
  createdAt: string
  createdBy: string
  createdByName?: string
  completedAt?: string
  sizeBytes?: number
  downloadUrl?: string
  errorMessage?: string
  // Type-specific options
  options?: {
    periodDate?: string
    accountIds?: string[]
    startDate?: string
    endDate?: string
    includeCalculationBreakdown?: boolean
  }
}

export interface ExportJobsResponse {
  jobs: ExportJob[]
  totalCount: number
}

export interface UseExportJobsOptions {
  enabled?: boolean
  refetchInterval?: number | false
}

export const exportJobsQueryKey = ['export-jobs'] as const

/**
 * Hook to fetch export jobs for the current user.
 * Auto-refreshes when there are pending jobs.
 *
 * @param options - Query options
 * @returns Query result with export jobs
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useExportJobs()
 * // data?.jobs - array of export jobs
 * ```
 */
export function useExportJobs(options: UseExportJobsOptions = {}) {
  const { enabled = true, refetchInterval = false } = options

  return useQuery<ExportJobsResponse>({
    queryKey: exportJobsQueryKey,
    queryFn: async () => {
      const res = await fetch('/api/export/jobs')
      if (!res.ok) {
        throw new Error('Failed to fetch export jobs')
      }
      return res.json()
    },
    enabled,
    staleTime: 30_000,
    refetchInterval, // Auto-refresh for pending jobs
  })
}

export default useExportJobs
