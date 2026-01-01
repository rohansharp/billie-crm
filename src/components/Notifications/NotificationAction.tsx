'use client'

import React from 'react'
import { NotificationBadge } from './NotificationBadge'

/**
 * Notification action component for Payload's header actions slot.
 * Renders inline with other header actions (like the user profile button).
 * 
 * This is the proper Payload integration - not a fixed-position overlay.
 */
export function NotificationAction() {
  return <NotificationBadge />
}

export default NotificationAction
