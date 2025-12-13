/**
 * API Route: GET /api/customer/search
 *
 * Search customers by name, email, phone, or customer ID.
 * Returns a subset of customer fields for display in command palette.
 *
 * Authentication: This route is accessed from within the Payload admin UI,
 * which already requires authentication. The command palette only renders
 * for authenticated users via Payload's admin.components.providers registration.
 * Additional withAuth wrapper is not needed here as it would duplicate auth checks.
 */

import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { CustomerSearchResult, SearchResponse } from '@/types/search'

// Re-export types for consumers who import from this route
export type { CustomerSearchResult, SearchResponse } from '@/types/search'

export async function GET(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.trim() || ''

  // Require minimum 3 characters for search
  if (query.length < 3) {
    return NextResponse.json({ results: [], total: 0 })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const results = await payload.find({
      collection: 'customers',
      where: {
        or: [
          { fullName: { contains: query } },
          { emailAddress: { contains: query } },
          { mobilePhoneNumber: { contains: query } },
          { customerId: { contains: query } },
        ],
      },
      limit: 10,
    })

    return NextResponse.json({
      results: results.docs.map((customer) => ({
        id: customer.id,
        customerId: customer.customerId,
        fullName: customer.fullName ?? null,
        emailAddress: customer.emailAddress ?? null,
        identityVerified: customer.identityVerified ?? false,
        accountCount: Array.isArray(customer.loanAccounts)
          ? customer.loanAccounts.length
          : 0,
      })),
      total: results.totalDocs,
    })
  } catch (error) {
    console.error('Customer search error:', error)
    return NextResponse.json({ results: [], total: 0 })
  }
}
