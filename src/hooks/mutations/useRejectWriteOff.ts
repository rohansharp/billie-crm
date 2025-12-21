import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MIN_APPROVAL_COMMENT_LENGTH, UNKNOWN_USER_FALLBACK } from '@/lib/constants'

export interface RejectWriteOffParams {
  /** Write-off request ID */
  requestId: string
  /** Mandatory rejection reason (min 10 chars) */
  reason: string
  /** Rejector's user ID */
  rejectorId?: string
  /** Rejector's name for audit */
  rejectorName?: string
}

export interface RejectWriteOffResponse {
  doc: {
    id: string
    requestNumber: string
    status: 'rejected'
    approvalDetails: {
      decidedBy: string
      decidedByName: string
      decidedAt: string
      comment: string
    }
  }
}

/**
 * Reject a write-off request via Payload REST API.
 * Updates status to 'rejected' and records rejection details.
 */
async function rejectWriteOff(
  params: RejectWriteOffParams
): Promise<RejectWriteOffResponse> {
  const { requestId, reason, rejectorId, rejectorName } = params

  // Validate reason length
  if (!reason || reason.trim().length < MIN_APPROVAL_COMMENT_LENGTH) {
    throw new Error(`Rejection reason must be at least ${MIN_APPROVAL_COMMENT_LENGTH} characters`)
  }

  const res = await fetch(`/api/write-off-requests/${requestId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'rejected',
      approvalDetails: {
        decidedBy: rejectorId,
        decidedByName: rejectorName || UNKNOWN_USER_FALLBACK,
        decidedAt: new Date().toISOString(),
        comment: reason.trim(),
      },
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to reject write-off request')
  }

  return res.json()
}

/**
 * Mutation hook for rejecting a write-off request.
 * Invalidates the pending approvals query on success.
 */
export function useRejectWriteOff() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: rejectWriteOff,
    retry: 1,
    retryDelay: 1000,
    onSuccess: (data) => {
      toast.success(`Write-off ${data.doc.requestNumber} rejected`, {
        description: 'The request has been rejected.',
      })
      // Invalidate approvals queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['write-off-requests'] })
    },
    onError: (error) => {
      toast.error('Failed to reject request', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  return {
    rejectRequest: mutation.mutate,
    rejectRequestAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  }
}
