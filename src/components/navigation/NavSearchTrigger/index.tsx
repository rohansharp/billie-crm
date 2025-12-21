'use client'

import React, { useEffect, useState } from 'react'
import { useUIStore } from '@/stores/ui'
import styles from './styles.module.css'

/**
 * Navigation button that opens the Command Palette (Cmd+K / Ctrl+K).
 * Registered in Payload's beforeNavLinks to appear at the top of the sidebar.
 */
export function NavSearchTrigger() {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const [isMac, setIsMac] = useState(true) // Default to Mac for SSR

  // Detect platform on client
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'))
  }, [])

  const handleClick = () => {
    setCommandPaletteOpen(true)
  }

  const shortcutLabel = isMac ? '⌘K' : 'Ctrl+K'

  return (
    <button
      type="button"
      className={styles.searchTrigger}
      onClick={handleClick}
      aria-label={`Open search (${shortcutLabel})`}
    >
      <span className={styles.icon} aria-hidden="true">
        🔍
      </span>
      <span className={styles.label}>Search</span>
      <kbd className={styles.shortcut}>{shortcutLabel}</kbd>
    </button>
  )
}

// Default export for Payload component registration
export default NavSearchTrigger
