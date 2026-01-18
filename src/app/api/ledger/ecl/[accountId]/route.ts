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
        console.warn(`No ECL allowance found for account ${accountId}. Returning default.`)
        return NextResponse.json(
          {
            accountId,
            eclAmount: '0.00',
            eclChange: '0.00',
            changeDirection: 'unchanged',
            carryingAmount: '0.00',
            bucket: 'CURRENT',
            pdRate: '0.00',
            overlayMultiplier: '1.00',
            lgdRate: '0.00',
            calculatedAt: new Date().toISOString(),
            history: [],
          },
          { status: 200 },
        )
      }
      // Handle UNAVAILABLE (14), UNIMPLEMENTED (12), or missing client method
      if (
        error.code === 14 ||
        error.code === 12 ||
        error.message?.includes('UNAVAILABLE') ||
        error.message?.includes('not implemented') ||
        error.message?.includes('call')
      ) {
        console.warn('Ledger service unavailable or method not implemented for ECL allowance')
        return NextResponse.json(
          {
            accountId,
            eclAmount: '0.00',
            eclChange: '0.00',
            changeDirection: 'unchanged',
            carryingAmount: '0.00',
            bucket: 'CURRENT',
            pdRate: '0.00',
            overlayMultiplier: '1.00',
            lgdRate: '0.00',
            calculatedAt: new Date().toISOString(),
            history: [],
            _fallback: true,
            _message: 'ECL allowance service not available',
          },
          { status: 200 },
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
