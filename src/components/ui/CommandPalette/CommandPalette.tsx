'use client'

import { Command } from 'cmdk'
import { useEffect, useRef } from 'react'
import styles from './styles.module.css'

export interface CommandPaletteProps {
  /** Whether the command palette is currently open */
  isOpen: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Current search query */
  query: string
  /** Callback when search query changes */
  onQueryChange: (next: string) => void
  /** Whether a search is in progress */
  isSearching: boolean
  /** Results list rows injected by parent (Story 1.3+) */
  children?: React.ReactNode
}

/**
 * Global command palette component built on cmdk.
 * Provides the UI shell for search functionality.
 * Search results are injected via children prop (Story 1.3).
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onOpenChange,
  query,
  onQueryChange,
  isSearching,
  children,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready after animation starts
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 10)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onOpenChange(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={styles.overlay}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
        data-testid="command-palette-overlay"
      />

      {/* Command palette container */}
      <div className={styles.container} role="dialog" aria-modal="true" aria-label="Command palette">
        <Command
          className={styles.command}
          onKeyDown={handleKeyDown}
          shouldFilter={false} // Filtering handled by API in Story 1.3
        >
          <Command.Input
            ref={inputRef}
            className={styles.input}
            placeholder="Search customers, loans, transactions..."
            value={query}
            onValueChange={onQueryChange}
            data-testid="command-palette-input"
          />

          <Command.List className={styles.list}>
            {/* Loading state */}
            {isSearching && (
              <div className={styles.loading} data-testid="command-palette-loading">
                <span className={styles.spinner} aria-hidden="true" />
                <span>Searching...</span>
              </div>
            )}

            {/* Empty state - shown when no children and not searching */}
            {!isSearching && !children && query.length === 0 && (
              <Command.Empty className={styles.empty}>
                Start typing to search...
              </Command.Empty>
            )}

            {/* No results state */}
            {!isSearching && !children && query.length > 0 && (
              <Command.Empty className={styles.empty}>
                No results found for &quot;{query}&quot;
              </Command.Empty>
            )}

            {/* Results injected by parent */}
            {children}
          </Command.List>

          {/* Footer with keyboard hints */}
          <div className={styles.footer}>
            <span className={styles.footerHint}>
              <kbd className={styles.kbd}>↑↓</kbd> to navigate
            </span>
            <span className={styles.footerHint}>
              <kbd className={styles.kbd}>Enter</kbd> to select
            </span>
            <span className={styles.footerHint}>
              <kbd className={styles.kbd}>Esc</kbd> to close
            </span>
          </div>
        </Command>
      </div>
    </>
  )
}

// Re-export Command components for use in result items (Story 1.3)
export { Command }
