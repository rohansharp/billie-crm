// Hooks barrel export
export { useGlobalHotkeys, useCommandPaletteHotkeys } from './useGlobalHotkeys'
export { useTrackCustomerView } from './useTrackCustomerView'
export { useCustomerSearch } from './queries/useCustomerSearch'
export { useLoanAccountSearch } from './queries/useLoanAccountSearch'
export { useCustomer } from './queries/useCustomer'
export type { CustomerData } from './queries/useCustomer'

// Mutations
export { useWaiveFee } from './mutations/useWaiveFee'
export type { WaiveFeeParams, WaiveFeeResponse } from './mutations/useWaiveFee'
export { useRecordRepayment } from './mutations/useRecordRepayment'
export type {
  RecordRepaymentParams,
  RecordRepaymentResponse,
  RepaymentAllocation,
} from './mutations/useRecordRepayment'

// Re-export types from canonical location
export type {
  CustomerSearchResult,
  CustomerSearchResponse,
  SearchResponse,
  LoanAccountSearchResult,
  LoanAccountSearchResponse,
} from '@/types/search'
