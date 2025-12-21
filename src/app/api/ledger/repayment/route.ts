/**
 * API Route: POST /api/ledger/repayment
 *
 * Record a repayment on a loan account.
 *
 * Request body:
 * - loanAccountId (required): Loan account ID
 * - amount (required): Payment amount as string (for precision)
 * - paymentId (required): External payment reference
 * - paymentMethod (optional): e.g., "direct_debit", "card"
 * - paymentReference (optional): Additional reference
 * - expectedVersion (optional): Expected updatedAt for version conflict detection
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getLedgerClient,
  timestampToDate,
  getTransactionTypeLabel,
} from '@/server/grpc-client'
import { checkVersion, createVersionConflictResponse } from '@/lib/utils/version-check'

interface RecordRepaymentBody {
  loanAccountId: string
  amount: string
  paymentId: string
  paymentMethod?: string
  paymentReference?: string
  expectedVersion?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RecordRepaymentBody = await request.json()

    // Validation
    if (!body.loanAccountId) {
      return NextResponse.json({ error: 'loanAccountId is required' }, { status: 400 })
    }
    if (!body.amount) {
      return NextResponse.json({ error: 'amount is required' }, { status: 400 })
    }
    if (!body.paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
    }

    // Version conflict check (if expectedVersion provided)
    const versionResult = await checkVersion(body.loanAccountId, body.expectedVersion)
    if (!versionResult.isValid) {
      return NextResponse.json(createVersionConflictResponse(versionResult), { status: 409 })
    }

    const client = getLedgerClient()
    const response = await client.recordRepayment({
      loanAccountId: body.loanAccountId,
      amount: body.amount,
      paymentId: body.paymentId,
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference,
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
        principalDelta: parseFloat(tx.principalDelta),
        feeDelta: parseFloat(tx.feeDelta),
        totalDelta: parseFloat(tx.totalDelta),
        principalAfter: parseFloat(tx.principalAfter),
        feeAfter: parseFloat(tx.feeAfter),
        totalAfter: parseFloat(tx.totalAfter),
        description: tx.description,
      },
      eventId: response.eventId,
      allocation: {
        allocatedToFees: response.allocatedToFees ? parseFloat(response.allocatedToFees) : 0,
        allocatedToPrincipal: response.allocatedToPrincipal
          ? parseFloat(response.allocatedToPrincipal)
          : 0,
        overpayment: response.overpayment ? parseFloat(response.overpayment) : 0,
      },
    })
  } catch (error) {
    console.error('Error recording repayment:', error)
    return NextResponse.json(
      { error: 'Failed to record repayment', details: (error as Error).message },
      { status: 500 },
    )
  }
}

