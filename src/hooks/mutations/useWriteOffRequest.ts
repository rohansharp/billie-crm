import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useUIStore } from '@/stores/ui'

export interface WriteOffRequestParams {
  loanAccountId: string
  customerId: string
  customerName?: string
  accountNumber?: string
  amount: number
  originalBalance: number
  reason: string
  notes?: string
  /** User ID who is submitting the request (for audit/segregation of duties) */
  requestedBy?: string
  /** User name for display in audit trail */
  requestedByName?: string
}

export interface WriteOffRequestResponse {
  doc: {
    id: string
    requestNumber: string
    loanAccountId: string
    customerId: string
    amount: number
    reason: string
    status: string
    requiresSeniorApproval: boolean
    createdAt: string
  }
  message: string
}

/**
 * Senior approval threshold in AUD
 */
export const SENIOR_APPROVAL_THRESHOLD = 10000

async function submitWriteOffRequest(
  params: WriteOffRequestParams
): Promise<WriteOffRequestResponse> {
  const requiresSeniorApproval = params.amount >= SENIOR_APPROVAL_THRESHOLD

  const res = await fetch('/api/write-off-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loanAccountId: params.loanAccountId,
      customerId: params.customerId,
      customerName: params.customerName,
      accountNumber: params.accountNumber,
      amount: params.amount,
      originalBalance: params.originalBalance,
      reason: params.reason,
      notes: params.notes || '',
      status: 'pending',
      priority: 'normal',
      requiresSeniorApproval,
      requestedAt: new Date().toISOString(),
      // Audit: who submitted this request (for segregation of duties in approval)
      requestedBy: params.requestedBy,
      requestedByName: params.requestedByName || 'Unknown User', // TODO: Get from auth context
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ errors: [{ message: 'Failed to submit request' }] }))
    const message = error.errors?.[0]?.message || error.message || 'Failed to submit write-off request'
    throw new Error(message)
  }

  return res.json()
}

/**
 * Query key for pending write-off requests
 */
export const writeOffRequestsQueryKey = (loanAccountId: string) =>
  ['write-off-requests', loanAccountId] as const

/**
 * Mutation hook for submitting write-off requests.
 */
export function useWriteOffRequest() {
  const queryClient = useQueryClient()
  const readOnlyMode = useUIStore((state) => state.readOnlyMode)

  const mutation = useMutation({
    mutationFn: submitWriteOffRequest,

    onSuccess: (data) => {
      const requiresSenior = data.doc.requiresSeniorApproval

      toast.success('Write-off request submitted', {
        description: requiresSenior
          ? `Request ${data.doc.requestNumber} requires senior approval`
          : `Request ${data.doc.requestNumber} is pending approval`,
      })

      // Invalidate pending write-off queries
      queryClient.invalidateQueries({
        queryKey: ['write-off-requests'],
      })
    },

    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to submit write-off request'

      toast.error('Request failed', {
        description: errorMessage,
      })
    },
  })

  return {
    submitRequest: mutation.mutate,
    submitRequestAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    isReadOnlyMode: readOnlyMode,
  }
}
