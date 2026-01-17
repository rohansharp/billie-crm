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
      const response = await client.getEventProcessingStatus({})

      return NextResponse.json(response)
    } catch (grpcError: unknown) {
      const error = grpcError as { code?: number; message?: string }
      if (error.code === 14 || error.message?.includes('UNAVAILABLE')) {
        console.warn('Ledger service unavailable for system status')
        return NextResponse.json({
          success: false,
          overallStatus: 'unknown',
          totalPending: '0',
          estimatedCatchupSeconds: '0',
          streams: [],
          queriedAt: new Date().toISOString(),
          warning: 'Ledger service unavailable',
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
