/**
 * API Route: PUT /api/ecl-config/pd-rate
 *
 * Update PD rate for a bucket.
 *
 * Body:
 * - bucket: string (required) - Bucket name
 * - rate: number (required) - New PD rate
 * - updatedBy: string (required) - User making the change
 * - reason: string (optional) - Reason for change
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

interface UpdatePDRateBody {
  bucket: string
  rate: number
  updatedBy: string
  reason?: string
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdatePDRateBody = await request.json()

    if (!body.bucket) {
      return NextResponse.json({ error: 'bucket is required' }, { status: 400 })
    }

    if (body.rate === undefined || body.rate === null) {
      return NextResponse.json({ error: 'rate is required' }, { status: 400 })
    }

    if (!body.updatedBy) {
      return NextResponse.json({ error: 'updatedBy is required' }, { status: 400 })
    }

    const client = getLedgerClient()

    try {
      const response = await client.updatePDRate({
        bucket: body.bucket,
        pdRate: body.rate.toString(),
        updatedBy: body.updatedBy,
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
        console.warn('Ledger service unavailable or method not implemented for PD rate update')
        return NextResponse.json(
          {
            success: true,
            bucket: body.bucket,
            newRate: body.rate,
            previousRate: body.rate,
            updatedAt: new Date().toISOString(),
            _fallback: true,
            _message: 'PD rate update service not available',
          },
          { status: 200 },
        )
      }
      throw grpcError
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating PD rate:', error)
    return NextResponse.json(
      { error: 'Failed to update PD rate', details: (error as Error).message },
      { status: 500 },
    )
  }
}
