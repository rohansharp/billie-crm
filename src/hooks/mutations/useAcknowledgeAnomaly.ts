import { useMutation } from '@tanstack/react-query'

interface AcknowledgeRequest {
  previewId: string
  anomalyId: string
  acknowledgedBy: string
}

interface AcknowledgeResponse {
  success: boolean
  anomalyId: string
  acknowledgedAt: string
}

/**
 * Mutation hook to acknowledge an anomaly in a period close preview.
 *
 * @example
 * ```tsx
 * const { acknowledgeAnomaly, isPending } = useAcknowledgeAnomaly()
 *
 * const handleAcknowledge = async (anomalyId: string) => {
 *   await acknowledgeAnomaly({
 *     previewId,
 *     anomalyId,
 *     acknowledgedBy: userId
 *   })
 * }
 * ```
 */
export function useAcknowledgeAnomaly() {
  const mutation = useMutation<AcknowledgeResponse, Error, AcknowledgeRequest>({
    mutationFn: async (request) => {
      const res = await fetch('/api/period-close/acknowledge-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to acknowledge anomaly')
      }
      return res.json()
    },
  })

  return {
    acknowledgeAnomaly: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}

export default useAcknowledgeAnomaly
