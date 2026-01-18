// Query hooks barrel export
export { useCustomerSearch } from './useCustomerSearch'
export { useLoanAccountSearch } from './useLoanAccountSearch'
export { useCustomer } from './useCustomer'
export type { CustomerData, LoanAccountData, LiveBalanceData } from './useCustomer'
export { useTransactions, TRANSACTION_TYPES, transactionsQueryKey } from './useTransactions'
export type { Transaction, TransactionsResponse, TransactionFilters } from './useTransactions'

// Ledger integration hooks
export { useOverdueAccounts, overdueAccountsQueryKey } from './useOverdueAccounts'
export type {
  OverdueAccount,
  OverdueAccountsResponse,
  OverdueAccountsFilters,
  UseOverdueAccountsOptions,
} from './useOverdueAccounts'

export { usePortfolioECL, portfolioECLQueryKey } from './usePortfolioECL'
export type {
  ECLBucketSummary,
  PortfolioECLResponse,
  UsePortfolioECLOptions,
} from './usePortfolioECL'

export { useEventProcessingStatus, eventProcessingStatusQueryKey } from './useEventProcessingStatus'
export type {
  StreamProcessingStatus,
  EventProcessingStatusResponse,
  UseEventProcessingStatusOptions,
} from './useEventProcessingStatus'

// Account detail hooks (Epic 2)
export { useAccountAging, accountAgingQueryKey } from './useAccountAging'
export type {
  AccountAgingResponse,
  BucketTransition,
  UseAccountAgingOptions,
} from './useAccountAging'

export { useAccruedYield, useAccrualHistory, accruedYieldQueryKey, accrualHistoryQueryKey } from './useAccruedYield'
export type {
  AccruedYieldResponse,
  AccrualCalculationBreakdown,
  AccrualEvent,
  AccrualHistoryResponse,
  UseAccruedYieldOptions,
  UseAccrualHistoryOptions,
} from './useAccruedYield'

export { useECLAllowance, eclAllowanceQueryKey } from './useECLAllowance'
export type {
  ECLAllowanceResponse,
  ECLTrigger,
  ECLHistoryEntry,
  ECLCalculationBreakdown,
  UseECLAllowanceOptions,
} from './useECLAllowance'

// Re-export types from canonical location
export type {
  CustomerSearchResult,
  CustomerSearchResponse,
  SearchResponse,
  LoanAccountSearchResult,
  LoanAccountSearchResponse,
} from '@/types/search'
