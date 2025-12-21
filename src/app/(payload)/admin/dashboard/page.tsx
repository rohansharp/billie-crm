import type { Metadata } from 'next'
import { DashboardView } from '@/components/DashboardView'

export const metadata: Metadata = {
  title: 'Dashboard | Billie CRM',
  description: 'Your personalized dashboard showing action items and recent customers',
}

/**
 * Dashboard page - the main landing page after login.
 *
 * Story 6.2: Dashboard Home Page
 */
export default function DashboardPage() {
  return <DashboardView />
}
