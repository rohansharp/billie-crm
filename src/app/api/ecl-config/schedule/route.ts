/**
 * API Route: POST /api/ecl-config/schedule
 *
 * Schedule a future config change.
 *
 * Body:
 * - fieldName: string (required) - Field to change
 * - newValue: string (required) - New value
 * - effectiveDate: string (required) - When change takes effect (YYYY-MM-DD)
 * - createdBy: string (required) - User scheduling the change
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient } from '@/server/grpc-client'

interface ScheduleChangeBody {
  fieldName: string
  newValue: string
  effectiveDate: string
  createdBy: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleChangeBody = await request.json()

    if (!body.fieldName || !body.newValue || !body.effectiveDate || !body.createdBy) {
      return NextResponse.json(
        { error: 'fieldName, newValue, effectiveDate, and createdBy are required' },
        { status: 400 },
      )
    }

    const client = getLedgerClient()

    const response = await client.scheduleECLConfigChange({
      fieldName: body.fieldName,
      newValue: body.newValue,
      effectiveDate: body.effectiveDate,
      createdBy: body.createdBy,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error scheduling config change:', error)
    return NextResponse.json(
      { error: 'Failed to schedule config change', details: (error as Error).message },
      { status: 500 },
    )
  }
}
