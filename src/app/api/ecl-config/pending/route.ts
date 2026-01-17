/**
 * API Route: GET /api/ecl-config/pending
 *
 * Get pending config changes.
 *
 * Query params:
 * - includePast: Include changes with past effective dates (default: false)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includePast = searchParams.get('includePast') === 'true'

    const client = getLedgerClient()

    try {
      const response = await client.getPendingConfigChanges({
        includePast,
      })

      return NextResponse.json(response)
    } catch (grpcError: unknown) {
      const error = grpcError as { code?: number; message?: string }
      if (error.code === 14 || error.message?.includes('UNAVAILABLE')) {
        console.warn('Ledger service unavailable for pending config changes')
        return NextResponse.json(
          { error: 'Ledger service unavailable', _fallback: true },
          { status: 503 },
        )
      }
      throw grpcError
    }
  } catch (error) {
    console.error('Error fetching pending config changes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending config changes', details: (error as Error).message },
      { status: 500 },
    )
  }
}
