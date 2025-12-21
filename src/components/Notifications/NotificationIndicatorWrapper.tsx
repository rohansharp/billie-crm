'use client'

import React, { useState, useEffect } from 'react'
import { NotificationIndicator } from './NotificationIndicator'

type UserRole = 'admin' | 'supervisor' | 'operations' | 'readonly'

/**
 * Wrapper that fetches current user role and renders NotificationIndicator.
 * Fetches user info client-side to determine if notifications should be shown.
 */
export const NotificationIndicatorWrapper: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/users/me')
        if (res.ok) {
          const data = await res.json()
          if (data.user?.role) {
            setUserRole(data.user.role as UserRole)
          }
        }
      } catch {
        // Ignore errors - just don't show badge
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  // Don't render anything while loading or if no valid role
  if (isLoading || !userRole) return null

  return <NotificationIndicator userRole={userRole} />
}

export default NotificationIndicatorWrapper
