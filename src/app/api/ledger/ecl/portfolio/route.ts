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
      // Check if method exists on client
      if (!client.getPortfolioECL) {
        console.warn('getPortfolioECL not available on gRPC client')
        return NextResponse.json({
          totalAccounts: 0,
          totalEcl: '0.00',
          totalCarryingAmount: '0.00',
          buckets: [],
          _fallback: true,
          _message: 'Method not available',
        })
      }

      const response = await client.getPortfolioECL({})

      return NextResponse.json(response)
    } catch (grpcError: unknown) {
      const error = grpcError as { code?: number; message?: string }
      // Handle UNAVAILABLE, UNAUTHENTICATED, and method not found errors
      if (
        error.code === 14 ||
        error.code === 16 ||
        error.message?.includes('UNAVAILABLE') ||
        error.message?.includes('UNAUTHENTICATED') ||
        error.message?.includes('undefined')
      ) {
        console.warn('Ledger service unavailable/unauthenticated for portfolio ECL')
        return NextResponse.json({
          totalAccounts: 0,
          totalEcl: '0.00',
          totalCarryingAmount: '0.00',
          buckets: [],
          _fallback: true,
          _message: 'Service unavailable',
        })
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
