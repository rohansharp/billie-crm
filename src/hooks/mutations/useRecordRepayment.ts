import { useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useOptimisticStore } from '@/stores/optimistic'
import { useUIStore } from '@/stores/ui'
import { useFailedActionsStore } from '@/stores/failed-actions'
import { useVersionStore } from '@/stores/version'
import { generateIdempotencyKey } from '@/lib/utils/idempotency'
import { transactionsQueryKey } from '@/hooks/queries/useTransactions'
import { VERSION_CONFLICT_ERROR_CODE } from '@/lib/constants'
import type { PendingMutation } from '@/types/mutation'

/** Custom event detail for retry action */
interface RetryEventDetail {
  id: string
  type: string
  accountId: string
  params: Record<string, unknown>
}

export interface RecordRepaymentParams {
  loanAccountId: string
  amount: number
  paymentReference: string
  paymentMethod: string
  notes?: string
  /** Expected version for conflict detection (optional for backward compatibility) */
  expectedVersion?: string
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
      expectedVersion: params.expectedVersion,
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to record repayment' }))
    // Preserve error code for version conflict detection
    if (error.error === VERSION_CONFLICT_ERROR_CODE) {
      const err = new Error(error.message || 'Version conflict detected')
      ;(err as any).code = VERSION_CONFLICT_ERROR_CODE
      ;(err as any).currentVersion = error.currentVersion
      ;(err as any).expectedVersion = error.expectedVersion
      throw err
    }
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
 * 
 * Also listens for `billie-retry-action` custom events to retry failed actions
 * from the Failed Actions Notification Center.
 */
export function useRecordRepayment(loanAccountId?: string, accountLabel?: string) {
  const queryClient = useQueryClient()
  const { setPending, setStage, clearPending, hasPendingAction } = useOptimisticStore()
  const readOnlyMode = useUIStore((state) => state.readOnlyMode)
  const addFailedAction = useFailedActionsStore((state) => state.addFailedAction)
  const removeAction = useFailedActionsStore((state) => state.removeAction)
  const getExpectedVersion = useVersionStore((state) => state.getExpectedVersion)
  const hasPendingRepayment = loanAccountId ? hasPendingAction(loanAccountId, 'record-repayment') : false

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
      const errorCode = (error as any)?.code

      // Update stage to failed
      setStage(context.loanAccountId, context.mutationId, 'failed', errorMessage)

      // Check if this is a version conflict (handled separately via callback)
      if (errorCode === VERSION_CONFLICT_ERROR_CODE) {
        // Version conflicts are not added to failed actions - they need user intervention
        toast.error('Data has changed', {
          description: 'This record was modified. Please refresh and try again.',
        })
        return
      }

      // Check if this is a system error (not validation)
      // NOTE: This regex-based detection is a heuristic. It may incorrectly categorize
      // errors that happen to contain these words (e.g., "Connection to validation service failed").
      // Consider using error codes from the API for more robust detection.
      const isSystemError = !/(validation|invalid|required|must be|cannot be)/i.test(errorMessage)

      // Add to failed actions queue for retry later (only system errors)
      if (isSystemError) {
        addFailedAction(
          'record-repayment',
          params.loanAccountId,
          {
            amount: params.amount,
            paymentReference: params.paymentReference,
            paymentMethod: params.paymentMethod,
            notes: params.notes,
          },
          errorMessage,
          accountLabel
        )
      }

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

  /**
   * Handle retry events from the Failed Actions Notification Center.
   * When a retry event for 'record-repayment' is received, execute the mutation
   * and remove the action from the store on success.
   */
  const handleRetryEvent = useCallback(
    (event: Event) => {
      const customEvent = event as CustomEvent<RetryEventDetail>
      const { id, type, accountId, params } = customEvent.detail

      // Only handle record-repayment retry events
      if (type !== 'record-repayment') return

      // Extract params with current version for conflict detection
      const repaymentParams: RecordRepaymentParams = {
        loanAccountId: accountId,
        amount: params.amount as number,
        paymentReference: params.paymentReference as string,
        paymentMethod: params.paymentMethod as string,
        notes: params.notes as string | undefined,
        expectedVersion: getExpectedVersion(accountId),
      }

      // Execute the mutation and remove from failed actions on success
      mutation.mutateAsync(repaymentParams)
        .then(() => {
          // Successfully retried - remove from failed actions
          removeAction(id)
        })
        .catch(() => {
          // Error will be handled by onError callback
          // The action stays in the queue for another retry attempt
        })
    },
    [mutation, removeAction, getExpectedVersion]
  )

  // Listen for retry events
  useEffect(() => {
    window.addEventListener('billie-retry-action', handleRetryEvent)
    return () => {
      window.removeEventListener('billie-retry-action', handleRetryEvent)
    }
  }, [handleRetryEvent])

  /**
   * Wrapper that automatically includes expectedVersion from the version store.
   */
  const recordRepaymentWithVersion = useCallback(
    (params: Omit<RecordRepaymentParams, 'expectedVersion'>) => {
      const expectedVersion = getExpectedVersion(params.loanAccountId)
      mutation.mutate({ ...params, expectedVersion })
    },
    [mutation, getExpectedVersion]
  )

  const recordRepaymentAsyncWithVersion = useCallback(
    async (params: Omit<RecordRepaymentParams, 'expectedVersion'>) => {
      const expectedVersion = getExpectedVersion(params.loanAccountId)
      return mutation.mutateAsync({ ...params, expectedVersion })
    },
    [mutation, getExpectedVersion]
  )

  return {
    recordRepayment: recordRepaymentWithVersion,
    recordRepaymentAsync: recordRepaymentAsyncWithVersion,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    isReadOnlyMode: readOnlyMode,
    hasPendingRepayment,
    /** Check if last error was a version conflict */
    isVersionConflict: (mutation.error as any)?.code === VERSION_CONFLICT_ERROR_CODE,
  }
}
