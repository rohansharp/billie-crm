import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MIN_APPROVAL_COMMENT_LENGTH, UNKNOWN_USER_FALLBACK } from '@/lib/constants'

export interface ApproveWriteOffParams {
  /** Write-off request ID */
  requestId: string
  /** Mandatory approval comment (min 10 chars) */
  comment: string
  /** Approver's user ID */
  approverId?: string
  /** Approver's name for audit */
  approverName?: string
}

export interface ApproveWriteOffResponse {
  doc: {
    id: string
    requestNumber: string
    status: 'approved'
    approvalDetails: {
      decidedBy: string
      decidedByName: string
      decidedAt: string
      comment: string
    }
  }
}

/**
 * Approve a write-off request via Payload REST API.
 * Updates status to 'approved' and records approval details.
 */
async function approveWriteOff(
  params: ApproveWriteOffParams
): Promise<ApproveWriteOffResponse> {
  const { requestId, comment, approverId, approverName } = params

  // Validate comment length
  if (!comment || comment.trim().length < MIN_APPROVAL_COMMENT_LENGTH) {
    throw new Error(`Approval comment must be at least ${MIN_APPROVAL_COMMENT_LENGTH} characters`)
  }

  const res = await fetch(`/api/write-off-requests/${requestId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'approved',
      approvalDetails: {
        decidedBy: approverId,
        decidedByName: approverName || UNKNOWN_USER_FALLBACK,
        decidedAt: new Date().toISOString(),
        comment: comment.trim(),
      },
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to approve write-off request')
  }

  return res.json()
}

/**
 * Mutation hook for approving a write-off request.
 * Invalidates the pending approvals query on success.
 */
export function useApproveWriteOff() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: approveWriteOff,
    retry: 1,
    retryDelay: 1000,
    onSuccess: (data) => {
      toast.success(`Write-off ${data.doc.requestNumber} approved`, {
        description: 'The request has been approved and processed.',
      })
      // Invalidate approvals queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['write-off-requests'] })
    },
    onError: (error) => {
      toast.error('Failed to approve request', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  return {
    approveRequest: mutation.mutate,
    approveRequestAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  }
}
