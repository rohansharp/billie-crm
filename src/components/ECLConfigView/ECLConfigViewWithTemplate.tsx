'use client'

import React from 'react'
import { useAuth } from '@payloadcms/ui'
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewProps } from 'payload'
import { ECLConfigView } from './ECLConfigView'

/**
 * ECL Config View wrapped in Payload admin template.
 * Registered as a custom view in payload.config.ts.
 */
export const ECLConfigViewWithTemplate: React.FC<AdminViewProps> = ({
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
      <ECLConfigView userId={user?.id?.toString()} />
    </DefaultTemplate>
  )
}

export default ECLConfigViewWithTemplate
