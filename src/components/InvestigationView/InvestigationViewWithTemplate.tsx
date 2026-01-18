'use client'

import React from 'react'
import { useAuth } from '@payloadcms/ui'
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewProps } from 'payload'
import { InvestigationView } from './InvestigationView'

/**
 * Investigation View wrapped in Payload admin template.
 * Registered as a custom view in payload.config.ts.
 */
export const InvestigationViewWithTemplate: React.FC<AdminViewProps> = ({
  initPageResult,
  params: _params,
  searchParams: _searchParams,
}) => {
  const { user } = useAuth()

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={initPageResult.params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={initPageResult.searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <InvestigationView userId={user?.id?.toString()} />
    </DefaultTemplate>
  )
}

export default InvestigationViewWithTemplate
