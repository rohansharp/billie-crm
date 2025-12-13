'use client'

import styles from './styles.module.css'

export interface SkeletonProps {
  /** Width of the skeleton (CSS value) */
  width?: string | number
  /** Height of the skeleton (CSS value) */
  height?: string | number
  /** Shape variant */
  variant?: 'text' | 'rectangular' | 'circular'
  /** Additional CSS class */
  className?: string
}

/**
 * Skeleton loader component for content placeholders.
 * Renders an animated placeholder that indicates loading state.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'text',
  className = '',
}) => {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  const variantClass = styles[variant] || styles.text

  return (
    <div
      className={`${styles.skeleton} ${variantClass} ${className}`}
      style={style}
      aria-hidden="true"
      data-testid="skeleton"
    />
  )
}

/**
 * Skeleton text line for paragraph placeholders.
 */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = '',
}) => {
  return (
    <div className={`${styles.textBlock} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'}
          height={16}
        />
      ))}
    </div>
  )
}
