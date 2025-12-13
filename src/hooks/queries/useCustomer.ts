'use client'

import { useQuery } from '@tanstack/react-query'

/**
 * Subset of customer data returned by the API.
 * Matches the shape used by ServicingView.
 */
export interface CustomerData {
  id: string
  customerId: string
  fullName: string | null
  firstName: string | null
  lastName: string | null
  preferredName: string | null
  emailAddress: string | null
  mobilePhoneNumber: string | null
  dateOfBirth: string | null
  identityVerified: boolean | null
  staffFlag: boolean | null
  investorFlag: boolean | null
  founderFlag: boolean | null
  vulnerableFlag: boolean | null
  residentialAddress: {
    fullAddress?: string | null
    street?: string | null
    suburb?: string | null
    state?: string | null
    postcode?: string | null
  } | null
  loanAccounts?: Array<{ id: string }> | null
}

async function fetchCustomer(customerId: string): Promise<CustomerData> {
  const res = await fetch(`/api/customer/${customerId}`)
  
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Customer not found')
    }
    throw new Error('Failed to fetch customer')
  }
  
  return res.json()
}

/**
 * Hook to fetch a single customer by customerId.
 * 
 * @param customerId - The customer's unique ID
 * @returns TanStack Query result with customer data
 */
export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => fetchCustomer(customerId),
    enabled: !!customerId,
    staleTime: 60_000, // 1 minute - customer data doesn't change often
    retry: false, // Don't retry on 404
  })
}
