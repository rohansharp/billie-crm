/**
 * API Routes: POST/GET /api/export/jobs
 *
 * POST: Create an export job
 * GET: List user's export jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLedgerClient, ExportType, ExportFormat } from '@/server/grpc-client'

interface CreateExportBody {
  exportType: ExportType
  exportFormat?: ExportFormat
  createdBy: string
  periodDate?: string
  accountIds?: string[]
  dateRangeStart?: string
  dateRangeEnd?: string
  includeCalculationBreakdown?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateExportBody = await request.json()

    if (!body.exportType) {
      return NextResponse.json({ error: 'exportType is required' }, { status: 400 })
    }

    if (!body.createdBy) {
      return NextResponse.json({ error: 'createdBy is required' }, { status: 400 })
    }

    const client = getLedgerClient()

    const response = await client.createExportJob({
      exportType: body.exportType,
      exportFormat: body.exportFormat,
      createdBy: body.createdBy,
      periodDate: body.periodDate,
      accountIds: body.accountIds,
      dateRangeStart: body.dateRangeStart,
      dateRangeEnd: body.dateRangeEnd,
      includeCalculationBreakdown: body.includeCalculationBreakdown,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating export job:', error)
    return NextResponse.json(
      { error: 'Failed to create export job', details: (error as Error).message },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined
    const includeCompleted = searchParams.get('includeCompleted') !== 'false'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const client = getLedgerClient()

    try {
      const response = await client.listExportJobs({
        userId,
        limit,
        includeCompleted,
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
        console.warn('Ledger service unavailable or method not implemented for export jobs')
        return NextResponse.json(
          {
            jobs: [],
            totalCount: 0,
            _fallback: true,
            _message: 'Export jobs service not available',
          },
          { status: 200 },
        )
      }
      throw grpcError
    }
  } catch (error) {
    console.error('Error listing export jobs:', error)
    return NextResponse.json(
      { error: 'Failed to list export jobs', details: (error as Error).message },
      { status: 500 },
    )
  }
}
