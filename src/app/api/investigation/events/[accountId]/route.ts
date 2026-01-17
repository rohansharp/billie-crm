/**
 * API Route: GET /api/investigation/events/[accountId]
 *
 * Get full event history for an account.
 *
 * Query params:
 * - limit: Max events per page (default: 100, max: 1000)
 * - cursor: Pagination cursor for next page
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    const { accountId } = await params
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100
    const cursor = searchParams.get('cursor') || undefined

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
    }

    const client = getLedgerClient()

    try {
      const response = await client.getEventHistory({
        accountId,
        limit: Math.min(limit, 1000),
        cursor,
      })

      return NextResponse.json(response)
    } catch (grpcError: unknown) {
      const error = grpcError as { code?: number; message?: string }
      if (error.code === 14 || error.message?.includes('UNAVAILABLE')) {
        console.warn('Ledger service unavailable for event history')
        return NextResponse.json(
          { success: false, events: [], nextCursor: '', _fallback: true },
          { status: 200 },
        )
      }
      throw grpcError
    }
  } catch (error) {
    console.error('Error fetching event history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event history', details: (error as Error).message },
      { status: 500 },
    )
  }
}
