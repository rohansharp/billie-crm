/**
 * API Route: GET /api/ecl-config/history
 *
 * Get ECL configuration change history.
 *
 * Query params:
 * - limit: Max events to return (default: 100)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined

    const client = getLedgerClient()

    try {
      const response = await client.getECLConfigHistory({
        limit,
      })

      return NextResponse.json(response)
    } catch (grpcError: unknown) {
      const error = grpcError as { code?: number; message?: string }
      if (error.code === 14 || error.message?.includes('UNAVAILABLE')) {
        console.warn('Ledger service unavailable for ECL config history')
        return NextResponse.json(
          { error: 'Ledger service unavailable', _fallback: true },
          { status: 503 },
        )
      }
      throw grpcError
    }
  } catch (error) {
    console.error('Error fetching ECL config history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ECL config history', details: (error as Error).message },
      { status: 500 },
    )
  }
}
