'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RECENT_CUSTOMERS_STORAGE_KEY } from '@/lib/constants'

/**
 * Represents a recently viewed customer.
 * SECURITY: Only stores customerId and viewedAt - NO PII.
 * Names, emails, and other customer data are fetched fresh from the API.
 */
interface RecentCustomer {
  customerId: string // ID only - NO PII
  viewedAt: number // Timestamp in milliseconds
}

interface RecentCustomersState {
  customers: RecentCustomer[]
  addCustomer: (customerId: string) => void
  clearHistory: () => void
}

const MAX_RECENT_CUSTOMERS = 10

/**
 * Store for tracking recently viewed customers.
 *
 * SECURITY NOTES:
 * - Only stores customer IDs and timestamps in localStorage
 * - NO PII (names, emails, phone numbers) is stored client-side
 * - Display data is fetched fresh from the API using stored IDs
 * - If XSS attack compromises localStorage, only IDs are exposed
 * - Data is CLEARED when a different user logs in (see UserSessionGuard)
 *
 * @see src/components/UserSessionGuard - clears this store on user change
 */
export const useRecentCustomersStore = create<RecentCustomersState>()(
  persist(
    (set, get) => ({
      customers: [],

      /**
       * Add a customer to the recently viewed list.
       * - Deduplicates: If customer already exists, moves to top with updated timestamp
       * - Limits: Only keeps the most recent MAX_RECENT_CUSTOMERS entries
       */
      addCustomer: (customerId: string) => {
        const now = Date.now()
        const { customers } = get()

        // Remove existing entry for this customer (if any)
        const filtered = customers.filter((c) => c.customerId !== customerId)

        // Add to front with new timestamp, limit to MAX
        const updated = [{ customerId, viewedAt: now }, ...filtered].slice(
          0,
          MAX_RECENT_CUSTOMERS,
        )

        set({ customers: updated })
      },

      /**
       * Clear all recently viewed customers from history.
       * Called by UserSessionGuard when user changes.
       */
      clearHistory: () => {
        set({ customers: [] })
      },
    }),
    {
      name: RECENT_CUSTOMERS_STORAGE_KEY,
      version: 1, // For future migrations
    },
  ),
)
