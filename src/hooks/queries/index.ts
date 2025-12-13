// Query hooks barrel export
export { useCustomerSearch } from './useCustomerSearch'
export { useLoanAccountSearch } from './useLoanAccountSearch'
export { useCustomer } from './useCustomer'
export type { CustomerData } from './useCustomer'

// Re-export types from canonical location
export type {
  CustomerSearchResult,
  CustomerSearchResponse,
  SearchResponse,
  LoanAccountSearchResult,
  LoanAccountSearchResponse,
} from '@/types/search'
