'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useLedgerHealth } from '@/hooks/queries/useLedgerHealth'
import { useUIStore } from '@/stores/ui'
import { TOAST_ID_SYSTEM_RESTORED } from '@/lib/constants'
import type { LedgerHealthStatus } from '@/types/ledger-health'

/**
 * Options for the useReadOnlyMode hook
 */
export interface UseReadOnlyModeOptions {
  /** Show toast when system recovers (default: true) */
  showRecoveryToast?: boolean
  /** Treat 'degraded' as offline (default: false) */
  treatDegradedAsOffline?: boolean
}

/**
 * Hook to sync ledger health status with read-only mode.
 *
 * Automatically sets `readOnlyMode` in the UI store based on ledger health:
 * - Ledger offline → readOnlyMode = true
 * - Ledger connected → readOnlyMode = false
 *
 * Also shows a toast notification when the system recovers.
 *
 * @example
 * ```tsx
 * // Use in a top-level component (e.g., providers)
 * function ReadOnlyModeSync() {
 *   useReadOnlyMode()
 *   return null
 * }
 * ```
 */
export function useReadOnlyMode(options: UseReadOnlyModeOptions = {}) {
  const { showRecoveryToast = true, treatDegradedAsOffline = false } = options

  const { status, isLoading } = useLedgerHealth()
  const setReadOnlyMode = useUIStore((state) => state.setReadOnlyMode)
  const readOnlyMode = useUIStore((state) => state.readOnlyMode)

  // Track previous status to detect recovery
  const previousStatusRef = useRef<LedgerHealthStatus | null>(null)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    // Don't update during initial load
    if (isLoading) return

    // Determine if current status should trigger read-only mode
    const shouldBeReadOnly =
      status === 'offline' || (treatDegradedAsOffline && status === 'degraded')

    // Check for recovery (was offline, now connected)
    const wasOffline =
      previousStatusRef.current === 'offline' ||
      (treatDegradedAsOffline && previousStatusRef.current === 'degraded')
    const isNowOnline = !shouldBeReadOnly

    // Update read-only mode in store
    setReadOnlyMode(shouldBeReadOnly)

    // Show recovery toast (but not on initial load)
    if (hasInitializedRef.current && wasOffline && isNowOnline && showRecoveryToast) {
      toast.success('System restored', {
        description: 'Ledger connection restored. All actions are now available.',
        id: TOAST_ID_SYSTEM_RESTORED,
      })
    }

    // Update previous status ref
    previousStatusRef.current = status
    hasInitializedRef.current = true
  }, [status, isLoading, setReadOnlyMode, showRecoveryToast, treatDegradedAsOffline])

  return {
    /** Whether read-only mode is active */
    isReadOnly: readOnlyMode,
    /** Current ledger health status */
    status,
    /** Whether we're still checking initial status */
    isLoading,
  }
}
