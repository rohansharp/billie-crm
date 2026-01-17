/**
 * API Route: PUT /api/ecl-config/pd-rate
 *
 * Update PD rate for a bucket.
 *
 * Body:
 * - bucket: string (required) - Bucket name
 * - pdRate: string (required) - New PD rate
 * - updatedBy: string (required) - User making the change
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

interface UpdatePDRateBody {
  bucket: string
  pdRate: string
  updatedBy: string
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdatePDRateBody = await request.json()

    if (!body.bucket) {
      return NextResponse.json({ error: 'bucket is required' }, { status: 400 })
    }

    if (!body.pdRate) {
      return NextResponse.json({ error: 'pdRate is required' }, { status: 400 })
    }

    if (!body.updatedBy) {
      return NextResponse.json({ error: 'updatedBy is required' }, { status: 400 })
    }

    const client = getLedgerClient()

    const response = await client.updatePDRate({
      bucket: body.bucket,
      pdRate: body.pdRate,
      updatedBy: body.updatedBy,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating PD rate:', error)
    return NextResponse.json(
      { error: 'Failed to update PD rate', details: (error as Error).message },
      { status: 500 },
    )
  }
}
