'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QueryClientProvider } from './query-client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster, toast } from 'sonner'
import {
  CommandPalette,
  Command,
  CustomerSearchResult,
  LoanAccountSearchResult,
} from '@/components/ui/CommandPalette'
import { useUIStore } from '@/stores/ui'
import { useCommandPaletteHotkeys } from '@/hooks/useGlobalHotkeys'
import { useCustomerSearch } from '@/hooks/queries/useCustomerSearch'
import { useLoanAccountSearch } from '@/hooks/queries/useLoanAccountSearch'

/**
 * Global command palette wrapper that connects to UI store.
 * Registered inside Providers to appear on all Payload admin pages.
 */
const GlobalCommandPalette: React.FC = () => {
  const router = useRouter()
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    commandPaletteQuery,
    setCommandPaletteQuery,
  } = useUIStore()

  // Register global hotkeys (Cmd+K, Ctrl+K, F7, Escape)
  useCommandPaletteHotkeys(commandPaletteOpen, setCommandPaletteOpen)

  // Customer search (Story 1.3)
  const customerSearch = useCustomerSearch(commandPaletteQuery)

  // Loan account search (Story 1.4)
  const accountSearch = useLoanAccountSearch(commandPaletteQuery)

  // Combined loading state
  const isSearching =
    customerSearch.isLoading ||
    customerSearch.isFetching ||
    accountSearch.isLoading ||
    accountSearch.isFetching

  // Navigate to ServicingView when customer is selected (Story 2.1)
  const handleSelectCustomer = useCallback((customerId: string) => {
    setCommandPaletteOpen(false)
    router.push(`/admin/servicing/${customerId}`)
  }, [setCommandPaletteOpen, router])

  // Navigate to customer's ServicingView when account is selected
  const handleSelectAccount = useCallback((customerIdString: string | null) => {
    setCommandPaletteOpen(false)
    if (customerIdString) {
      router.push(`/admin/servicing/${customerIdString}`)
    }
  }, [setCommandPaletteOpen, router])

  // Show error toast if search fails (in useEffect to avoid render-time side effects)
  const hasError = customerSearch.isError || accountSearch.isError
  useEffect(() => {
    if (hasError && commandPaletteQuery.length >= 3) {
      toast.error('Search failed', { id: 'search-error' })
    }
  }, [hasError, commandPaletteQuery])

  // Check if we have any results
  const hasCustomers = (customerSearch.data?.results.length ?? 0) > 0
  const hasAccounts = (accountSearch.data?.results.length ?? 0) > 0

  return (
    <CommandPalette
      isOpen={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      query={commandPaletteQuery}
      onQueryChange={setCommandPaletteQuery}
      isSearching={isSearching}
    >
      {/* Customer Results Group */}
      {hasCustomers && (
        <Command.Group heading="Customers">
          {customerSearch.data?.results.map((customer) => (
            <CustomerSearchResult
              key={customer.id}
              customer={customer}
              onSelect={() => handleSelectCustomer(customer.customerId)}
            />
          ))}
        </Command.Group>
      )}

      {/* Loan Account Results Group */}
      {hasAccounts && (
        <Command.Group heading="Loan Accounts">
          {accountSearch.data?.results.map((account) => (
            <LoanAccountSearchResult
              key={account.id}
              account={account}
              onSelect={() => handleSelectAccount(account.customerIdString)}
            />
          ))}
        </Command.Group>
      )}
    </CommandPalette>
  )
}

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <QueryClientProvider>
      {children}
      <Toaster position="top-right" richColors />
      <GlobalCommandPalette />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

// Default export is required for Payload's provider registration (import map expects '@/providers#default').
export default Providers
