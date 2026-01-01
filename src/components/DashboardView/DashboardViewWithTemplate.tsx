import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import React from 'react'
import { DashboardView } from './index'

/**
 * Dashboard view for Payload admin.
 * 
 * Uses DefaultTemplate to render with the Payload sidebar and navigation.
 * This is a server component that receives AdminViewServerProps from Payload's RootPage.
 *
 * Story 6.2: Dashboard Home Page
 */
export async function DashboardViewWithTemplate({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <DashboardView />
    </DefaultTemplate>
  )
}

export default DashboardViewWithTemplate
