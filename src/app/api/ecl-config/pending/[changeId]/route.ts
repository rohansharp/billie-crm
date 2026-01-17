/**
 * API Route: DELETE /api/ecl-config/pending/[changeId]
 *
 * Cancel a pending config change.
 *
 * Body:
 * - cancelledBy: string (required) - User cancelling the change
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

interface CancelBody {
  cancelledBy: string
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ changeId: string }> },
) {
  try {
    const { changeId } = await params
    const body: CancelBody = await request.json()

    if (!changeId) {
      return NextResponse.json({ error: 'changeId is required' }, { status: 400 })
    }

    if (!body.cancelledBy) {
      return NextResponse.json({ error: 'cancelledBy is required' }, { status: 400 })
    }

    const client = getLedgerClient()

    const response = await client.cancelPendingConfigChange({
      changeId,
      cancelledBy: body.cancelledBy,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error cancelling config change:', error)
    return NextResponse.json(
      { error: 'Failed to cancel config change', details: (error as Error).message },
      { status: 500 },
    )
  }
}
