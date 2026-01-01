import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ApprovalsView } from '@/components/ApprovalsView'

export const metadata: Metadata = {
  title: 'Pending Approvals | Billie CRM',
  description: 'Review and process pending write-off approval requests',
}

/**
 * Get the current user from Payload session.
 * Returns the user object with role, or null if not authenticated.
 */
async function getCurrentUser() {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Get cookies from headers for authentication
    const cookieHeader = headersList.get('cookie') || ''

    // Use Payload's auth to get the current user
    const { user } = await payload.auth({
      headers: new Headers({ cookie: cookieHeader }),
    })

    return user
  } catch {
    return null
  }
}

/** Valid user roles */
const VALID_ROLES = ['admin', 'supervisor', 'operations', 'readonly'] as const
type UserRole = (typeof VALID_ROLES)[number]

/** Type guard to validate user role */
function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.includes(role as UserRole)
}

export default async function ApprovalsPage() {
  const user = await getCurrentUser()

  // Extract and validate role with proper type guard
  const userRole = isValidRole(user?.role) ? user.role : undefined

  // Extract user ID and name for segregation of duties and audit trail
  // Convert to string for consistent comparison with stored requestedBy
  const userId = user?.id ? String(user.id) : undefined
  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || undefined

  return <ApprovalsView userRole={userRole} userId={userId} userName={userName} />
}
