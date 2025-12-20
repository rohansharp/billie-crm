'use client'

import { useState, useCallback } from 'react'
import styles from './CopyButton.module.css'

export interface CopyButtonProps {
  /** The text to copy to clipboard */
  value: string
  /** Optional label for accessibility */
  label?: string
  /** Size variant */
  size?: 'sm' | 'md'
}

/**
 * CopyButton - Small icon button to copy text to clipboard.
 * Shows a checkmark briefly after successful copy.
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  label,
  size = 'sm',
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [value])

  return (
    <button
      type="button"
      className={`${styles.copyButton} ${styles[size]}`}
      onClick={handleCopy}
      aria-label={label || `Copy ${value}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      data-testid="copy-button"
    >
      {copied ? (
        <svg
          className={styles.copyIcon}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3.5 9 6.5 12 12.5 4" />
        </svg>
      ) : (
        <svg
          className={styles.copyIcon}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Back rectangle */}
          <rect x="5" y="5" width="9" height="9" rx="1.5" />
          {/* Front rectangle (offset) */}
          <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" />
        </svg>
      )}
    </button>
  )
}
