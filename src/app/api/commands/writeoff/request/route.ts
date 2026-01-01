/**
 * API Route: POST /api/commands/writeoff/request
 *
 * Submit a new write-off request.
 * Publishes a writeoff.requested.v1 event to the Redis stream.
 *
 * Returns 202 Accepted with eventId and requestId for polling.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { WriteOffRequestCommandSchema } from '@/lib/events/schemas'
import { EVENT_TYPE_WRITEOFF_REQUESTED } from '@/lib/events/config'
import type { WriteOffRequestedPayload } from '@/lib/events/types'
import { createAndPublishEvent, EventPublishError } from '@/server/event-publisher'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayload({ config: configPromise })
    const headersList = await headers()
    const cookieHeader = headersList.get('cookie') || ''

    const { user } = await payload.auth({
      headers: new Headers({ cookie: cookieHeader }),
    })

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Please log in to continue.' } },
        { status: 401 },
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const parseResult = WriteOffRequestCommandSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 },
      )
    }

    const command = parseResult.data

    // 3. Build event payload with user info
    const eventPayload: WriteOffRequestedPayload = {
      loanAccountId: command.loanAccountId,
      customerId: command.customerId,
      customerName: command.customerName,
      accountNumber: command.accountNumber,
      amount: command.amount,
      originalBalance: command.originalBalance,
      reason: command.reason,
      notes: command.notes,
      priority: command.priority,
      requestedBy: String(user.id),
      requestedByName: user.firstName
        ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
        : user.email || 'Unknown User',
    }

    // 4. Publish event to Redis
    const result = await createAndPublishEvent({
      typ: EVENT_TYPE_WRITEOFF_REQUESTED,
      userId: String(user.id),
      payload: eventPayload,
    })

    // 5. Return 202 Accepted
    return NextResponse.json(result, { status: 202 })
  } catch (error) {
    console.error('[WriteOff Request] Error:', error)

    // Handle publish errors specifically
    if (error instanceof EventPublishError) {
      return NextResponse.json(
        {
          error: {
            code: 'EVENT_PUBLISH_FAILED',
            message: 'Failed to submit write-off request. Please try again.',
          },
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred.',
        },
      },
      { status: 500 },
    )
  }
}
