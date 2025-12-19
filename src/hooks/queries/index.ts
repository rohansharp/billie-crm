// Query hooks barrel export
export { useCustomerSearch } from './useCustomerSearch'
export { useLoanAccountSearch } from './useLoanAccountSearch'
export { useCustomer } from './useCustomer'
export type { CustomerData, LoanAccountData, LiveBalanceData } from './useCustomer'
export { useTransactions, TRANSACTION_TYPES, transactionsQueryKey } from './useTransactions'
export type { Transaction, TransactionsResponse, TransactionFilters } from './useTransactions'

// Re-export types from canonical location
export type {
  CustomerSearchResult,
  CustomerSearchResponse,
  SearchResponse,
  LoanAccountSearchResult,
  LoanAccountSearchResponse,
} from '@/types/search'
