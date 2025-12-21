/**
 * API Route: POST /api/ledger/waive-fee
 *
 * Waive fees on a loan account.
 *
 * Request body:
 * - loanAccountId (required): Loan account ID
 * - waiverAmount (required): Amount to waive as string
 * - reason (required): Reason for waiver
 * - approvedBy (required): Approver ID
 * - expectedVersion (optional): Expected updatedAt for version conflict detection
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getLedgerClient,
  timestampToDate,
  getTransactionTypeLabel,
} from '@/server/grpc-client'
import { checkVersion, createVersionConflictResponse } from '@/lib/utils/version-check'

interface WaiveFeeBody {
  loanAccountId: string
  waiverAmount: string
  reason: string
  approvedBy: string
  expectedVersion?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: WaiveFeeBody = await request.json()

    // Validation
    if (!body.loanAccountId) {
      return NextResponse.json({ error: 'loanAccountId is required' }, { status: 400 })
    }
    if (!body.waiverAmount) {
      return NextResponse.json({ error: 'waiverAmount is required' }, { status: 400 })
    }
    if (!body.reason) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 })
    }
    if (!body.approvedBy) {
      return NextResponse.json({ error: 'approvedBy is required' }, { status: 400 })
    }

    // Version conflict check (if expectedVersion provided)
    const versionResult = await checkVersion(body.loanAccountId, body.expectedVersion)
    if (!versionResult.isValid) {
      return NextResponse.json(createVersionConflictResponse(versionResult), { status: 409 })
    }

    const client = getLedgerClient()
    const response = await client.waiveFee({
      loanAccountId: body.loanAccountId,
      waiverAmount: body.waiverAmount,
      reason: body.reason,
      approvedBy: body.approvedBy,
    })

    const tx = response.transaction

    return NextResponse.json({
      success: true,
      transaction: {
        id: tx.transactionId,
        accountId: tx.loanAccountId,
        type: tx.type,
        typeLabel: getTransactionTypeLabel(tx.type),
        date: timestampToDate(tx.transactionDate).toISOString(),
        feeDelta: parseFloat(tx.feeDelta),
        feeAfter: parseFloat(tx.feeAfter),
        totalAfter: parseFloat(tx.totalAfter),
        description: tx.description,
      },
      eventId: response.eventId,
    })
  } catch (error) {
    console.error('Error waiving fee:', error)
    return NextResponse.json(
      { error: 'Failed to waive fee', details: (error as Error).message },
      { status: 500 },
    )
  }
}

