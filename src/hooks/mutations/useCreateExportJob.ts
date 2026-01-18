import { useMutation, useQueryClient } from '@tanstack/react-query'
import { exportJobsQueryKey, type ExportJobType, type ExportFormat } from '@/hooks/queries/useExportJobs'

export interface CreateExportJobRequest {
  type: ExportJobType
  format: ExportFormat
  createdBy: string
  options?: {
    periodDate?: string
    accountIds?: string[]
    startDate?: string
    endDate?: string
    includeCalculationBreakdown?: boolean
  }
}

export interface CreateExportJobResponse {
  success: boolean
  jobId: string
  status: 'pending' | 'processing'
  message?: string
}

/**
 * Mutation hook to create a new export job.
 *
 * @example
 * ```tsx
 * const { createExportJob, isPending } = useCreateExportJob()
 *
 * const handleExport = async () => {
 *   const result = await createExportJob({
 *     type: 'journal_entries',
 *     format: 'csv',
 *     createdBy: userId,
 *     options: { periodDate: '2026-01-31' }
 *   })
 *   // result.jobId - ID of created job
 * }
 * ```
 */
export function useCreateExportJob() {
  const queryClient = useQueryClient()

  const mutation = useMutation<CreateExportJobResponse, Error, CreateExportJobRequest>({
    mutationFn: async (request) => {
      const res = await fetch('/api/export/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to create export job')
      }
      return res.json()
    },
    onSuccess: () => {
      // Invalidate jobs list to show new job
      queryClient.invalidateQueries({ queryKey: exportJobsQueryKey })
    },
  })

  return {
    createExportJob: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}

export default useCreateExportJob
