/**
 * API Route: PUT /api/ecl-config/overlay
 *
 * Update overlay multiplier.
 *
 * Body:
 * - overlayMultiplier: string (required) - New overlay value
 * - updatedBy: string (required) - User making the change
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

interface UpdateOverlayBody {
  overlayMultiplier: string
  updatedBy: string
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateOverlayBody = await request.json()

    if (!body.overlayMultiplier) {
      return NextResponse.json({ error: 'overlayMultiplier is required' }, { status: 400 })
    }

    if (!body.updatedBy) {
      return NextResponse.json({ error: 'updatedBy is required' }, { status: 400 })
    }

    const client = getLedgerClient()

    const response = await client.updateOverlayMultiplier({
      overlayMultiplier: body.overlayMultiplier,
      updatedBy: body.updatedBy,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating overlay multiplier:', error)
    return NextResponse.json(
      { error: 'Failed to update overlay multiplier', details: (error as Error).message },
      { status: 500 },
    )
  }
}
