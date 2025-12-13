/**
 * Shared types for search APIs and hooks.
 * Single source of truth to prevent type drift.
 */

// === Customer Search ===

export interface CustomerSearchResult {
  id: string
  customerId: string
  fullName: string | null
  emailAddress: string | null
  identityVerified: boolean
  accountCount: number
}

export interface CustomerSearchResponse {
  results: CustomerSearchResult[]
  total: number
}

// Legacy alias for backwards compatibility
export type SearchResponse = CustomerSearchResponse

// === Loan Account Search ===

export interface LoanAccountSearchResult {
  id: string
  loanAccountId: string
  accountNumber: string
  customerName: string | null
  customerIdString: string | null
  accountStatus: 'active' | 'paid_off' | 'in_arrears' | 'written_off'
  totalOutstanding: number
}

export interface LoanAccountSearchResponse {
  results: LoanAccountSearchResult[]
  total: number
}
