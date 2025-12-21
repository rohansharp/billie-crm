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

export interface WaiveFeeParams {
  loanAccountId: string
  waiverAmount: number
  reason: string
  approvedBy: string
  /** Expected version for conflict detection (optional for backward compatibility) */
  expectedVersion?: string
}

export interface WaiveFeeResponse {
  success: boolean
  transaction: {
    id: string
    accountId: string
    type: string
    typeLabel: string
    date: string
    feeDelta: number
    feeAfter: number
    totalAfter: number
    description: string
  }
  eventId: string
}

async function waiveFee(params: WaiveFeeParams): Promise<WaiveFeeResponse> {
  const res = await fetch('/api/ledger/waive-fee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loanAccountId: params.loanAccountId,
      waiverAmount: params.waiverAmount.toString(),
      reason: params.reason,
      approvedBy: params.approvedBy,
      expectedVersion: params.expectedVersion,
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to waive fee' }))
    // Preserve error code for version conflict detection
    if (error.error === VERSION_CONFLICT_ERROR_CODE) {
      const err = new Error(error.message || 'Version conflict detected')
      ;(err as any).code = VERSION_CONFLICT_ERROR_CODE
      ;(err as any).currentVersion = error.currentVersion
      ;(err as any).expectedVersion = error.expectedVersion
      throw err
    }
    throw new Error(error.error || error.details || 'Failed to waive fee')
  }

  return res.json()
}

/**
 * Mutation hook for waiving fees with optimistic UI updates.
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
export function useWaiveFee(loanAccountId?: string, accountLabel?: string) {
  const queryClient = useQueryClient()
  const { setPending, setStage, clearPending, hasPendingAction } = useOptimisticStore()
  const readOnlyMode = useUIStore((state) => state.readOnlyMode)
  const addFailedAction = useFailedActionsStore((state) => state.addFailedAction)
  const removeAction = useFailedActionsStore((state) => state.removeAction)
  const getExpectedVersion = useVersionStore((state) => state.getExpectedVersion)
  const hasPendingWaive = loanAccountId ? hasPendingAction(loanAccountId, 'waive-fee') : false

  const mutation = useMutation({
    mutationFn: waiveFee,

    onMutate: async (params) => {
      // Generate idempotency key
      const mutationId = generateIdempotencyKey(
        params.loanAccountId,
        'waive-fee'
      )

      // Create pending mutation
      const pendingMutation: PendingMutation = {
        id: mutationId,
        accountId: params.loanAccountId,
        action: 'waive-fee',
        stage: 'optimistic',
        amount: params.waiverAmount,
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

      // Show success toast
      toast.success('Fee waived successfully', {
        description: `$${params.waiverAmount.toFixed(2)} waived from account`,
      })

      // Invalidate transactions query to refresh list
      queryClient.invalidateQueries({
        queryKey: transactionsQueryKey(params.loanAccountId, {}),
      })

      // Invalidate customer query to refresh account data and update version store
      // This ensures the version store has the latest updatedAt for subsequent mutations
      queryClient.invalidateQueries({
        queryKey: ['customer'],
      })

      // Clear from store after short delay (allow UI to show confirmed state)
      setTimeout(() => {
        clearPending(context.loanAccountId, context.mutationId)
      }, 2000)
    },

    onError: (error, params, context) => {
      if (!context) return

      const errorMessage = error instanceof Error ? error.message : 'Failed to waive fee'
      const errorCode = (error as any)?.code

      // Update stage to failed
      setStage(context.loanAccountId, context.mutationId, 'failed', errorMessage)

      // Check if this is a version conflict (handled separately via callback)
      if (errorCode === VERSION_CONFLICT_ERROR_CODE) {
        // Version conflicts are not added to failed actions - they need user intervention
        // The onVersionConflict callback will be invoked by the calling component
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
          'waive-fee',
          params.loanAccountId,
          {
            waiverAmount: params.waiverAmount,
            reason: params.reason,
            approvedBy: params.approvedBy,
          },
          errorMessage,
          accountLabel
        )
      }

      // Show error toast with retry option
      toast.error('Failed to waive fee', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => {
            // Clear the failed mutation first
            clearPending(context.loanAccountId, context.mutationId)
            // Retry
            mutation.mutate(params)
          },
        },
      })
    },
  })

  /**
   * Handle retry events from the Failed Actions Notification Center.
   * When a retry event for 'waive-fee' is received, execute the mutation
   * and remove the action from the store on success.
   */
  const handleRetryEvent = useCallback(
    (event: Event) => {
      const customEvent = event as CustomEvent<RetryEventDetail>
      const { id, type, accountId, params } = customEvent.detail

      // Only handle waive-fee retry events
      if (type !== 'waive-fee') return

      // Extract params with current version for conflict detection
      const waiveParams: WaiveFeeParams = {
        loanAccountId: accountId,
        waiverAmount: params.waiverAmount as number,
        reason: params.reason as string,
        approvedBy: params.approvedBy as string,
        expectedVersion: getExpectedVersion(accountId),
      }

      // Execute the mutation and remove from failed actions on success
      mutation.mutateAsync(waiveParams)
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
  const waiveFeeWithVersion = useCallback(
    (params: Omit<WaiveFeeParams, 'expectedVersion'>) => {
      const expectedVersion = getExpectedVersion(params.loanAccountId)
      mutation.mutate({ ...params, expectedVersion })
    },
    [mutation, getExpectedVersion]
  )

  const waiveFeeAsyncWithVersion = useCallback(
    async (params: Omit<WaiveFeeParams, 'expectedVersion'>) => {
      const expectedVersion = getExpectedVersion(params.loanAccountId)
      return mutation.mutateAsync({ ...params, expectedVersion })
    },
    [mutation, getExpectedVersion]
  )

  return {
    waiveFee: waiveFeeWithVersion,
    waiveFeeAsync: waiveFeeAsyncWithVersion,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    isReadOnlyMode: readOnlyMode,
    hasPendingWaive,
    /** Check if last error was a version conflict */
    isVersionConflict: (mutation.error as any)?.code === VERSION_CONFLICT_ERROR_CODE,
  }
}
