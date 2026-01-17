/**
 * API Route: GET /api/ledger/aging/overdue
 *
 * Get paginated list of overdue accounts with filtering.
 *
 * Query params:
 * - bucket: Filter by aging bucket (e.g., "bucket_1")
 * - minDpd: Minimum days past due (default: 1)
 * - maxDpd: Maximum days past due
 * - pageSize: Results per page (default: 100, max: 1000)
 * - pageToken: Pagination token for next page
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bucket = searchParams.get('bucket') || undefined
    const minDpd = searchParams.get('minDpd') ? parseInt(searchParams.get('minDpd')!, 10) : undefined
    const maxDpd = searchParams.get('maxDpd') ? parseInt(searchParams.get('maxDpd')!, 10) : undefined
    const pageSize = parseInt(searchParams.get('pageSize') || '100', 10)
    const pageToken = searchParams.get('pageToken') || undefined

    const client = getLedgerClient()

    try {
      const response = await client.getOverdueAccounts({
        bucketFilter: bucket,
        minDpd,
        maxDpd,
        pageSize: Math.min(pageSize, 1000),
        pageToken,
      })

      return NextResponse.json(response)
    } catch (grpcError: unknown) {
      const error = grpcError as { code?: number; message?: string }
      if (error.code === 14 || error.message?.includes('UNAVAILABLE')) {
        console.warn('Ledger service unavailable for overdue accounts')
        return NextResponse.json(
          {
            accounts: [],
            totalCount: 0,
            _fallback: true,
            _message: 'Ledger service unavailable',
          },
          { status: 200 },
        )
      }
      throw grpcError
    }
  } catch (error) {
    console.error('Error fetching overdue accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overdue accounts', details: (error as Error).message },
      { status: 500 },
    )
  }
}
