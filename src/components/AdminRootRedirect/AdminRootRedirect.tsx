import type { AdminViewServerProps } from 'payload'

import { redirect } from 'next/navigation'
import React from 'react'

/**
 * Root admin redirect component.
 * 
 * Intercepts the `/admin` root route and redirects:
 * - Authenticated users → `/admin/dashboard`
 * - Unauthenticated users → `/admin/login`
 * 
 * This prevents redirect loops between `/admin` and `/admin/login`.
 */
export async function AdminRootRedirect({
  initPageResult,
}: AdminViewServerProps) {
  // If authenticated, redirect to dashboard
  if (initPageResult?.req?.user) {
    redirect('/admin/dashboard')
  }

  // If not authenticated, redirect to login
  redirect('/admin/login')
}

export default AdminRootRedirect
