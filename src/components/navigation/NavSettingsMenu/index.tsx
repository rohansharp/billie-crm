'use client'

import React from 'react'
import { PopupList } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

/**
 * Custom settings menu component that adds "My Activity" link.
 *
 * This component is injected into Payload's settings menu
 * (accessible via gear icon in the sidebar).
 *
 * Story 6.6: User Menu Enhancements
 */
export function NavSettingsMenu() {
  const router = useRouter()

  const handleMyActivityClick = () => {
    router.push('/admin/my-activity')
  }

  return (
    <PopupList.ButtonGroup>
      <PopupList.Button
        onClick={handleMyActivityClick}
        data-testid="settings-my-activity"
      >
        📋 My Activity
      </PopupList.Button>
    </PopupList.ButtonGroup>
  )
}

export default NavSettingsMenu
