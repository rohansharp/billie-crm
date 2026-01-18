/**
 * API Route: POST /api/ledger/ecl/recalc/portfolio
 *
 * Trigger portfolio-wide ECL recalculation.
 *
 * Body:
 * - triggeredBy: string (required) - Reason for recalculation
 * - batchSize: number (optional) - Accounts per batch
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

interface RecalcBody {
  triggeredBy: string
  batchSize?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: RecalcBody = await request.json()

    if (!body.triggeredBy) {
      return NextResponse.json({ error: 'triggeredBy is required' }, { status: 400 })
    }

    const client = getLedgerClient()

    try {
      const response = await client.triggerPortfolioECLRecalculation({
        triggeredBy: body.triggeredBy,
        batchSize: body.batchSize,
      })

      return NextResponse.json(response)
    } catch (grpcError: unknown) {
      const error = grpcError as { code?: number; message?: string }
      // Handle UNAVAILABLE (14), UNIMPLEMENTED (12), or missing client method
      if (
        error.code === 14 ||
        error.code === 12 ||
        error.message?.includes('UNAVAILABLE') ||
        error.message?.includes('not implemented') ||
        error.message?.includes('call')
      ) {
        console.warn('Ledger service unavailable or method not implemented for portfolio recalc')
        return NextResponse.json(
          {
            error: 'Recalculation service not available',
            message: 'The portfolio ECL recalculation service is not currently available. Please try again later.',
          },
          { status: 503 },
        )
      }
      throw grpcError
    }
  } catch (error) {
    console.error('Error triggering portfolio ECL recalculation:', error)
    return NextResponse.json(
      { error: 'Failed to trigger recalculation', details: (error as Error).message },
      { status: 500 },
    )
  }
}
