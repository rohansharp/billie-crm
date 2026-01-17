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

    const response = await client.triggerPortfolioECLRecalculation({
      triggeredBy: body.triggeredBy,
      batchSize: body.batchSize,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error triggering portfolio ECL recalculation:', error)
    return NextResponse.json(
      { error: 'Failed to trigger recalculation', details: (error as Error).message },
      { status: 500 },
    )
  }
}
