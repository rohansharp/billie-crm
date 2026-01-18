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
        const now = new Date().toISOString()
        return NextResponse.json(
          {
            overlayMultiplier: 1.0,
            overlayUpdatedAt: now,
            overlayUpdatedBy: 'system',
            overlayUpdatedByName: 'System Default',
            pdRates: [
              { bucket: 'CURRENT', rate: 0.01, updatedAt: now, updatedBy: 'system', updatedByName: 'System Default' },
              { bucket: 'DAYS_1_30', rate: 0.05, updatedAt: now, updatedBy: 'system', updatedByName: 'System Default' },
              { bucket: 'DAYS_31_60', rate: 0.15, updatedAt: now, updatedBy: 'system', updatedByName: 'System Default' },
              { bucket: 'DAYS_61_90', rate: 0.30, updatedAt: now, updatedBy: 'system', updatedByName: 'System Default' },
              { bucket: 'DAYS_90_PLUS', rate: 0.50, updatedAt: now, updatedBy: 'system', updatedByName: 'System Default' },
            ],
            lgd: 0.50,
            lgdUpdatedAt: now,
            lgdUpdatedBy: 'system',
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
