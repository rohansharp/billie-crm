/**
 * API Route: GET /api/system/status
 *
 * Get event processing status for monitoring.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

export async function GET(request: NextRequest) {
  try {
    const client = getLedgerClient()

    try {
      // Check if method exists on client
      if (!client.getEventProcessingStatus) {
        console.warn('getEventProcessingStatus not available on gRPC client')
        return NextResponse.json({
          success: true,
          overallStatus: 'unknown',
          totalPending: '0',
          estimatedCatchupSeconds: '0',
          streams: [],
          queriedAt: new Date().toISOString(),
          _fallback: true,
          _message: 'Method not available',
        })
      }

      const response = await client.getEventProcessingStatus({})

      return NextResponse.json(response)
    } catch (grpcError: unknown) {
      const error = grpcError as { code?: number; message?: string }
      // Handle UNAVAILABLE, UNAUTHENTICATED, and method not found errors
      if (
        error.code === 14 ||
        error.code === 16 ||
        error.message?.includes('UNAVAILABLE') ||
        error.message?.includes('UNAUTHENTICATED') ||
        error.message?.includes('undefined')
      ) {
        console.warn('Ledger service unavailable/unauthenticated for system status')
        return NextResponse.json({
          success: true,
          overallStatus: 'unknown',
          totalPending: '0',
          estimatedCatchupSeconds: '0',
          streams: [],
          queriedAt: new Date().toISOString(),
          _fallback: true,
          _message: 'Service unavailable',
        })
      }
      throw grpcError
    }
  } catch (error) {
    console.error('Error fetching system status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system status', details: (error as Error).message },
      { status: 500 },
    )
  }
}
