/**
 * API Route: GET /api/ecl-config
 *
 * Get current ECL configuration (overlay multiplier, PD rates).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

export async function GET(request: NextRequest) {
  try {
    const client = getLedgerClient()

    try {
      const response = await client.getECLConfig({})

      return NextResponse.json(response)
    } catch (grpcError: unknown) {
      const error = grpcError as { code?: number; message?: string }
      if (error.code === 14 || error.message?.includes('UNAVAILABLE')) {
        console.warn('Ledger service unavailable for ECL config')
        return NextResponse.json(
          { error: 'Ledger service unavailable', _fallback: true },
          { status: 503 },
        )
      }
      throw grpcError
    }
  } catch (error) {
    console.error('Error fetching ECL config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ECL config', details: (error as Error).message },
      { status: 500 },
    )
  }
}
