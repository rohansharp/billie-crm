'use client'

import { useEffect } from 'react'
import { useRecentCustomersStore } from '@/stores/recentCustomers'

/**
 * Hook to track customer views for the "Recent Customers" feature.
 *
 * Adds the customer to the recent customers list when the component mounts.
 * Only tracks if customerId is a valid, non-empty string.
 *
 * @param customerId - The ID of the customer being viewed
 *
 * @example
 * ```tsx
 * export const ServicingView: React.FC<{ customerId: string }> = ({ customerId }) => {
 *   useTrackCustomerView(customerId)
 *   // ... rest of component
 * }
 * ```
 */
export function useTrackCustomerView(customerId: string | undefined): void {
  const addCustomer = useRecentCustomersStore((s) => s.addCustomer)

  useEffect(() => {
    if (customerId) {
      addCustomer(customerId)
    }
  }, [customerId, addCustomer])
}
