/**
 * API Route: GET /api/ledger/accrual/[accountId]
 *
 * Get accrued yield for a loan account.
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
      const response = await client.getAccruedYield({
        accountId,
      })

      return NextResponse.json(response)
    } catch (grpcError: unknown) {
      const error = grpcError as { code?: number; message?: string }
      // Handle NOT_FOUND - account has no accrual state yet
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        return NextResponse.json(
          {
            accountId,
            accruedAmount: 0,
            feeAmount: 0,
            termDays: 1,
            daysElapsed: 0,
            progress: 0,
            calculationBreakdown: null,
            _notFound: true,
          },
          { status: 200 },
        )
      }
      if (error.code === 14 || error.message?.includes('UNAVAILABLE')) {
        console.warn('Ledger service unavailable for accrual')
        return NextResponse.json(
          { error: 'Ledger service unavailable', _fallback: true },
          { status: 503 },
        )
      }
      throw grpcError
    }
  } catch (error) {
    console.error('Error fetching accrued yield:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accrued yield', details: (error as Error).message },
      { status: 500 },
    )
  }
}
