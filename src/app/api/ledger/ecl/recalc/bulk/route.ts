/**
 * API Route: POST /api/ledger/ecl/recalc/bulk
 *
 * Trigger ECL recalculation for specific accounts.
 *
 * Body:
 * - accountIds: string[] (required) - Account IDs to recalculate (max 100)
 * - triggeredBy: string (required) - Reason for recalculation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

interface BulkRecalcBody {
  accountIds: string[]
  triggeredBy: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkRecalcBody = await request.json()

    if (!body.accountIds || body.accountIds.length === 0) {
      return NextResponse.json({ error: 'accountIds is required' }, { status: 400 })
    }

    if (!body.triggeredBy) {
      return NextResponse.json({ error: 'triggeredBy is required' }, { status: 400 })
    }

    if (body.accountIds.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 accounts per request' }, { status: 400 })
    }

    const client = getLedgerClient()

    const response = await client.triggerBulkECLRecalculation({
      accountIds: body.accountIds,
      triggeredBy: body.triggeredBy,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error triggering bulk ECL recalculation:', error)
    return NextResponse.json(
      { error: 'Failed to trigger recalculation', details: (error as Error).message },
      { status: 500 },
    )
  }
}
