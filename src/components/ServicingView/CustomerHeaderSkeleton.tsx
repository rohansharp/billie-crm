'use client'

import styles from './CustomerHeader.module.css'

/**
 * Skeleton loading state for the CustomerHeader component.
 */
export const CustomerHeaderSkeleton: React.FC = () => {
  return (
    <div className={styles.headerCard} data-testid="customer-header-skeleton">
      <div className={styles.mainRow}>
        <div className={styles.identity}>
          {/* Avatar skeleton */}
          <div 
            className={styles.avatar} 
            style={{ 
              background: 'linear-gradient(90deg, #333 25%, #444 50%, #333 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
          <div className={styles.nameBlock}>
            {/* Name skeleton */}
            <div 
              style={{ 
                width: '140px', 
                height: '20px', 
                background: '#333',
                borderRadius: '4px',
              }} 
            />
            {/* ID skeleton */}
            <div 
              style={{ 
                width: '80px', 
                height: '14px', 
                background: '#444',
                borderRadius: '4px',
                marginTop: '4px',
              }} 
            />
          </div>
        </div>

        <div className={styles.contactInfo}>
          {/* Email skeleton */}
          <div 
            style={{ 
              width: '180px', 
              height: '16px', 
              background: '#333',
              borderRadius: '4px',
            }} 
          />
          {/* Phone skeleton */}
          <div 
            style={{ 
              width: '120px', 
              height: '16px', 
              background: '#333',
              borderRadius: '4px',
            }} 
          />
        </div>

        <div className={styles.actions}>
          {/* Button skeleton */}
          <div 
            style={{ 
              width: '70px', 
              height: '28px', 
              background: '#333',
              borderRadius: '6px',
            }} 
          />
        </div>
      </div>
    </div>
  )
}
