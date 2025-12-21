/**
 * API Route: GET /api/ledger/health
 *
 * Health check endpoint for the gRPC ledger service.
 * Returns status (connected/degraded/offline) based on response time.
 *
 * Response:
 * - status: 'connected' | 'degraded' | 'offline'
 * - latencyMs: response time in milliseconds
 * - message: human-readable status message
 * - checkedAt: ISO timestamp of the check
 */

import { NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'
import {
  HEALTH_CHECK_TEST_ACCOUNT,
  HEALTH_DEGRADED_THRESHOLD_MS,
  HEALTH_OFFLINE_THRESHOLD_MS,
} from '@/lib/constants'
import type { LedgerHealthStatus, LedgerHealthResponse } from '@/types/ledger-health'

// Re-export types for consumers who import from the route
export type { LedgerHealthStatus, LedgerHealthResponse }

/**
 * Determine health status based on latency
 */
function getStatusFromLatency(latencyMs: number): LedgerHealthStatus {
  if (latencyMs < HEALTH_DEGRADED_THRESHOLD_MS) {
    return 'connected'
  }
  if (latencyMs < HEALTH_OFFLINE_THRESHOLD_MS) {
    return 'degraded'
  }
  return 'offline'
}

/**
 * Get message for health status
 */
function getStatusMessage(status: LedgerHealthStatus): string {
  switch (status) {
    case 'connected':
      return 'Ledger Connected'
    case 'degraded':
      return 'Ledger Degraded - some operations may be slow'
    case 'offline':
      return 'Ledger Offline - read-only mode active'
  }
}

export async function GET() {
  const startTime = performance.now()
  const checkedAt = new Date().toISOString()

  try {
    const client = getLedgerClient()

    // Attempt a lightweight gRPC call to test connectivity
    // Using getBalance with a test account ID - it may return NOT_FOUND
    // but that's OK, we just want to verify the service is reachable
    await Promise.race([
      client.getBalance({ loanAccountId: HEALTH_CHECK_TEST_ACCOUNT }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), HEALTH_OFFLINE_THRESHOLD_MS)
      ),
    ])

    const latencyMs = Math.round(performance.now() - startTime)
    const status = getStatusFromLatency(latencyMs)

    const response: LedgerHealthResponse = {
      status,
      latencyMs,
      message: getStatusMessage(status),
      checkedAt,
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    const latencyMs = Math.round(performance.now() - startTime)

    // Check if it's a gRPC "not found" error - that's actually healthy
    // because it means the service responded
    const grpcError = error as { code?: number; details?: string }
    if (grpcError.code === 5) {
      // NOT_FOUND - service is healthy, just no such account
      const status = getStatusFromLatency(latencyMs)
      const response: LedgerHealthResponse = {
        status,
        latencyMs,
        message: getStatusMessage(status),
        checkedAt,
      }
      return NextResponse.json(response)
    }

    // Service is offline or unreachable - log for debugging
    const grpcErrorDetails = error as { code?: number; message?: string; details?: string }
    console.warn('[Ledger Health] Service offline or unreachable:', {
      code: grpcErrorDetails.code,
      message: grpcErrorDetails.message || grpcErrorDetails.details,
      latencyMs,
      checkedAt,
    })

    const response: LedgerHealthResponse = {
      status: 'offline',
      latencyMs,
      message: getStatusMessage('offline'),
      checkedAt,
    }

    return NextResponse.json(response)
  }
}
