/**
 * API Route: GET /api/ledger/ecl/portfolio
 *
 * Get portfolio-wide ECL summary by bucket.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

export async function GET(request: NextRequest) {
  try {
    const client = getLedgerClient()

    try {
      const response = await client.getPortfolioECL({})

      return NextResponse.json(response)
    } catch (grpcError: unknown) {
      const error = grpcError as { code?: number; message?: string }
      if (error.code === 14 || error.message?.includes('UNAVAILABLE')) {
        console.warn('Ledger service unavailable for portfolio ECL')
        return NextResponse.json(
          {
            totalAccounts: 0,
            totalEcl: '0.00',
            totalCarryingAmount: '0.00',
            buckets: [],
            _fallback: true,
            _message: 'Ledger service unavailable',
          },
          { status: 200 },
        )
      }
      throw grpcError
    }
  } catch (error) {
    console.error('Error fetching portfolio ECL:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio ECL', details: (error as Error).message },
      { status: 500 },
    )
  }
}
