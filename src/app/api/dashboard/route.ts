/**
 * API Route: GET /api/dashboard
 *
 * Dashboard data aggregation endpoint.
 * Returns user context, action items, recent customers summary, and system status.
 *
 * Story 6.2: Dashboard Home Page
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { hasApprovalAuthority } from '@/lib/access'
import {
  DashboardResponseSchema,
  DashboardQuerySchema,
  type DashboardResponse,
} from '@/lib/schemas/dashboard'

/** Valid user roles */
const VALID_ROLES = ['admin', 'supervisor', 'operations', 'readonly'] as const
type UserRole = (typeof VALID_ROLES)[number]

/** Type guard to validate user role */
function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.includes(role as UserRole)
}

/**
 * Format a number as Australian currency.
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount)
}

/**
 * Fetch ledger health status from internal API.
 */
async function fetchLedgerHealth(
  baseUrl: string,
): Promise<{ status: 'online' | 'degraded' | 'offline'; latencyMs: number }> {
  try {
    const response = await fetch(`${baseUrl}/api/ledger/health`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return { status: 'offline', latencyMs: 0 }
    }

    const data = await response.json()
    return {
      status: data.status === 'connected' ? 'online' : data.status === 'degraded' ? 'degraded' : 'offline',
      latencyMs: data.latencyMs ?? 0,
    }
  } catch {
    return { status: 'offline', latencyMs: 0 }
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const headersList = await headers()
    const cookieHeader = headersList.get('cookie') || ''

    // 1. Authenticate user
    const { user } = await payload.auth({
      headers: new Headers({ cookie: cookieHeader }),
    })

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Please log in to continue.' } },
        { status: 401 },
      )
    }

    // 2. Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const { recentCustomerIds } = DashboardQuerySchema.parse(searchParams)

    // 3. Determine if user can see approvals count
    const canSeeApprovals = hasApprovalAuthority(user)

    // 4. Get base URL for internal API calls
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    // 5. Parallel fetch all data
    const [approvalsResult, ledgerHealth, customersResult] = await Promise.all([
      // Only query approvals if user has permission
      canSeeApprovals
        ? payload.find({
            collection: 'write-off-requests',
            where: { status: { equals: 'pending' } },
            limit: 0, // Count only
          })
        : Promise.resolve({ totalDocs: 0 }),

      // Check ledger health
      fetchLedgerHealth(baseUrl),

      // Fetch recent customers if IDs provided
      recentCustomerIds.length > 0
        ? payload.find({
            collection: 'customers',
            where: { customerId: { in: recentCustomerIds } },
            limit: 10,
          })
        : Promise.resolve({ docs: [] }),
    ])

    // 6. Get loan account data for all customers in a single batch query
    const allCustomerIds = customersResult.docs.map((c) => c.customerId).filter(Boolean)
    const accountsResult =
      allCustomerIds.length > 0
        ? await payload.find({
            collection: 'loan-accounts',
            where: { customerIdString: { in: allCustomerIds } },
            limit: 500, // Reasonable upper bound
          })
        : { docs: [] }

    // Group accounts by customer ID for efficient lookup
    const accountsByCustomer = new Map<string, typeof accountsResult.docs>()
    for (const account of accountsResult.docs) {
      const custId = account.customerIdString ?? ''
      if (!accountsByCustomer.has(custId)) {
        accountsByCustomer.set(custId, [])
      }
      accountsByCustomer.get(custId)!.push(account)
    }

    // Build customer summaries
    const customersWithAccounts = customersResult.docs.map((customer) => {
      const accounts = accountsByCustomer.get(customer.customerId ?? '') ?? []
      const totalOutstanding = accounts.reduce((sum, acc) => {
        return sum + (acc.balances?.totalOutstanding ?? 0)
      }, 0)

      return {
        customerId: customer.customerId ?? '',
        name: customer.fullName ?? 'Unknown',
        accountCount: accounts.length,
        totalOutstanding: formatCurrency(totalOutstanding),
      }
    })

    // 7. Build response
    const userRole = isValidRole(user.role) ? user.role : 'operations'
    const response: DashboardResponse = {
      user: {
        firstName: user.firstName || (user.email?.split('@')[0] ?? 'User'),
        role: userRole,
      },
      actionItems: {
        pendingApprovalsCount: approvalsResult.totalDocs,
        failedActionsCount: 0, // Client tracks this via localStorage
      },
      recentCustomersSummary: customersWithAccounts,
      systemStatus: {
        ledger: ledgerHealth.status,
        latencyMs: ledgerHealth.latencyMs,
        lastChecked: new Date().toISOString(),
      },
    }

    // 8. Validate and return
    const validated = DashboardResponseSchema.parse(response)
    return NextResponse.json(validated)
  } catch (error) {
    console.error('[Dashboard API] Error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to load dashboard data.' } },
      { status: 500 },
    )
  }
}
