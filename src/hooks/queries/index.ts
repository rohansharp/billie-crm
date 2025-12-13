// Query hooks barrel export
export { useCustomerSearch } from './useCustomerSearch'
export { useLoanAccountSearch } from './useLoanAccountSearch'

// Re-export types from canonical location
export type {
  CustomerSearchResult,
  CustomerSearchResponse,
  SearchResponse,
  LoanAccountSearchResult,
  LoanAccountSearchResponse,
} from '@/types/search'
