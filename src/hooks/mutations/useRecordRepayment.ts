import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useOptimisticStore } from '@/stores/optimistic'
import { useUIStore } from '@/stores/ui'
import { generateIdempotencyKey } from '@/lib/utils/idempotency'
import { transactionsQueryKey } from '@/hooks/queries/useTransactions'
import type { PendingMutation } from '@/types/mutation'

export interface RecordRepaymentParams {
  loanAccountId: string
  amount: number
  paymentReference: string
  paymentMethod: string
  notes?: string
}

export interface RepaymentAllocation {
  allocatedToFees: number
  allocatedToPrincipal: number
  overpayment: number
}

export interface RecordRepaymentResponse {
  success: boolean
  transaction: {
    id: string
    accountId: string
    type: string
    typeLabel: string
    date: string
    principalDelta: number
    feeDelta: number
    totalDelta: number
    principalAfter: number
    feeAfter: number
    totalAfter: number
    description: string
  }
  eventId: string
  allocation: RepaymentAllocation
}

async function recordRepayment(params: RecordRepaymentParams): Promise<RecordRepaymentResponse> {
  // Generate unique payment ID
  const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const res = await fetch('/api/ledger/repayment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loanAccountId: params.loanAccountId,
      amount: params.amount.toString(),
      paymentId,
      paymentMethod: params.paymentMethod,
      paymentReference: params.paymentReference,
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to record repayment' }))
    throw new Error(error.error || error.details || 'Failed to record repayment')
  }

  return res.json()
}

/**
 * Mutation hook for recording repayments with optimistic UI updates.
 *
 * Flow:
 * 1. Generate idempotency key
 * 2. Add to optimistic store (stage: 'optimistic')
 * 3. Submit API request
 * 4a. On success: update stage to 'confirmed', show toast, invalidate queries
 * 4b. On error: update stage to 'failed', show error toast
 */
export function useRecordRepayment() {
  const queryClient = useQueryClient()
  const { setPending, setStage, clearPending } = useOptimisticStore()
  const readOnlyMode = useUIStore((state) => state.readOnlyMode)

  const mutation = useMutation({
    mutationFn: recordRepayment,

    onMutate: async (params) => {
      // Generate idempotency key
      const mutationId = generateIdempotencyKey(params.loanAccountId, 'record-repayment')

      // Create pending mutation
      const pendingMutation: PendingMutation = {
        id: mutationId,
        accountId: params.loanAccountId,
        action: 'record-repayment',
        stage: 'optimistic',
        amount: params.amount,
        createdAt: Date.now(),
      }

      // Add to optimistic store
      setPending(params.loanAccountId, pendingMutation)

      // Return context for rollback
      return { mutationId, loanAccountId: params.loanAccountId }
    },

    onSuccess: (data, params, context) => {
      if (!context) return

      // Update stage to confirmed
      setStage(context.loanAccountId, context.mutationId, 'confirmed')

      // Build allocation description
      const allocation = data.allocation
      const allocDesc: string[] = []
      if (allocation.allocatedToFees > 0) {
        allocDesc.push(`$${allocation.allocatedToFees.toFixed(2)} to fees`)
      }
      if (allocation.allocatedToPrincipal > 0) {
        allocDesc.push(`$${allocation.allocatedToPrincipal.toFixed(2)} to principal`)
      }

      // Show success toast
      toast.success('Repayment recorded', {
        description: allocDesc.length > 0 ? allocDesc.join(', ') : `$${params.amount.toFixed(2)} applied`,
      })

      // Invalidate transactions query to refresh list
      queryClient.invalidateQueries({
        queryKey: transactionsQueryKey(params.loanAccountId, {}),
      })

      // Also invalidate customer query to refresh balances
      queryClient.invalidateQueries({
        queryKey: ['customer'],
      })

      // Clear from store after short delay
      setTimeout(() => {
        clearPending(context.loanAccountId, context.mutationId)
      }, 2000)
    },

    onError: (error, params, context) => {
      if (!context) return

      const errorMessage = error instanceof Error ? error.message : 'Failed to record repayment'

      // Update stage to failed
      setStage(context.loanAccountId, context.mutationId, 'failed', errorMessage)

      // Show error toast with retry option
      toast.error('Failed to record repayment', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => {
            clearPending(context.loanAccountId, context.mutationId)
            mutation.mutate(params)
          },
        },
      })
    },
  })

  return {
    recordRepayment: mutation.mutate,
    recordRepaymentAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    isReadOnlyMode: readOnlyMode,
  }
}
