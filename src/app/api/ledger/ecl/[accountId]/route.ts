/**
 * API Route: GET /api/ledger/ecl/[accountId]
 *
 * Get ECL allowance for a loan account.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    const { accountId } = await params

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
    }

    const client = getLedgerClient()

    try {
      const response = await client.getECLAllowance({
        accountId,
      })

      return NextResponse.json(response)
    } catch (grpcError: unknown) {
      const error = grpcError as { code?: number; message?: string }
      // Handle NOT_FOUND - account has no ECL state yet
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        return NextResponse.json(
          {
            accountId,
            eclAmount: 0,
            carryingAmount: 0,
            bucket: 'CURRENT',
            calculationParams: null,
            lastCalculatedAt: null,
            history: [],
            _notFound: true,
          },
          { status: 200 },
        )
      }
      if (error.code === 14 || error.message?.includes('UNAVAILABLE')) {
        console.warn('Ledger service unavailable for ECL')
        return NextResponse.json(
          { error: 'Ledger service unavailable', _fallback: true },
          { status: 503 },
        )
      }
      throw grpcError
    }
  } catch (error) {
    console.error('Error fetching ECL allowance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ECL allowance', details: (error as Error).message },
      { status: 500 },
    )
  }
}
