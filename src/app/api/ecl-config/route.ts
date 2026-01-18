/**
 * API Route: GET /api/ecl-config
 *
 * Get current ECL configuration (overlay multiplier, PD rates).
 */

import { NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

export async function GET() {
  try {
    const client = getLedgerClient()

    try {
      const response = await client.getECLConfig({})

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
        console.warn('Ledger service unavailable or method not implemented for ECL config')
        return NextResponse.json(
          {
            overlayMultiplier: '1.00',
            pdRates: {
              CURRENT: '0.01',
              DAYS_1_30: '0.05',
              DAYS_31_60: '0.15',
              DAYS_61_90: '0.30',
              DAYS_90_PLUS: '0.50',
            },
            lgdRate: '0.50',
            effectiveDate: new Date().toISOString().split('T')[0],
            lastUpdatedBy: null,
            lastUpdatedAt: null,
            _fallback: true,
            _message: 'Using default ECL configuration',
          },
          { status: 200 },
        )
      }
      throw grpcError
    }
  } catch (error) {
    console.error('Error fetching ECL config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ECL config', details: (error as Error).message },
      { status: 500 },
    )
  }
}
