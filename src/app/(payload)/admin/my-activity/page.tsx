import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { MyActivityView } from '@/components/MyActivityView'

export const metadata: Metadata = {
  title: 'My Activity | Billie CRM',
  description: 'View your write-off request activity',
}

/**
 * Get the current user from Payload session.
 */
async function getCurrentUser() {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const cookieHeader = headersList.get('cookie') || ''

    const { user } = await payload.auth({
      headers: new Headers({ cookie: cookieHeader }),
    })

    return user
  } catch {
    return null
  }
}

/**
 * My Activity page - shows write-off requests submitted or decided by current user.
 *
 * Story 6.6: User Menu Enhancements
 */
export default async function MyActivityPage() {
  const user = await getCurrentUser()

  return <MyActivityView userId={user?.id} />
}
