// Hooks barrel export
export { useGlobalHotkeys, useCommandPaletteHotkeys } from './useGlobalHotkeys'
export { useCustomerSearch } from './queries/useCustomerSearch'
export { useLoanAccountSearch } from './queries/useLoanAccountSearch'

// Re-export types from canonical location
export type {
  CustomerSearchResult,
  CustomerSearchResponse,
  SearchResponse,
  LoanAccountSearchResult,
  LoanAccountSearchResponse,
} from '@/types/search'
