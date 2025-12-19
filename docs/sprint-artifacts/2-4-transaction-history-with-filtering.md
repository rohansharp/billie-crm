# Story 2.4: Transaction History with Filtering

**Status:** done

## Story

As a **support staff member**,
I want to view transaction history for an account with filtering options,
So that I can investigate specific activity.

## Acceptance Criteria

1. **Given** I am viewing a loan account's details
   **When** the transactions section loads
   **Then** display a table with: Date, Type, Amount, Reference, Balance After

2. **Given** the transaction list
   **When** I select a filter (Type: Fees, Repayments, etc.)
   **Then** the list updates to show only matching transactions

3. **Given** the transaction list
   **When** I select a date range filter
   **Then** the list updates to show only transactions within that range

4. **Given** more than 20 transactions exist
   **When** scrolling to the bottom
   **Then** additional transactions load (infinite scroll or pagination)

5. **Given** I am on mobile/tablet
   **When** viewing transactions
   **Then** table transforms to card layout (responsive design)

## Implementation Notes

**Existing Infrastructure:**
- `/api/ledger/transactions` - API route with type, date range, limit params
- `src/components/LoanAccountServicing/TransactionList.tsx` - Reference implementation
- gRPC client handles ledger unavailability gracefully

**New for Story 2.4:**
- Create `useTransactions` TanStack Query hook
- Create `TransactionHistory` component for ServicingView
- Add date range filter (from/to date pickers)
- Add responsive card layout for mobile
- Replace `TransactionsPlaceholder` in ServicingView

## Tasks / Subtasks

- [x] **Task 1: Create useTransactions hook** (AC: 1, 2, 3, 4)
  - [x] TanStack Query hook with type and date filters
  - [x] Pagination support with limit param

- [x] **Task 2: Create TransactionHistory component** (AC: 1, 2, 3, 5)
  - [x] Table with Date, Type, Amount, Reference, Balance After
  - [x] Type filter dropdown (9 transaction types)
  - [x] Date range filter inputs (from/to)
  - [x] Responsive card layout for mobile (@media max-width: 768px)

- [x] **Task 3: Add pagination/load more** (AC: 4)
  - [x] "Load more" button with count display

- [x] **Task 4: Integrate into ServicingView** (AC: 1)
  - [x] Wire to selectedAccount from drawer state
  - [x] Replace TransactionsPlaceholder

- [x] **Task 5: Tests** (AC: 1, 2, 3, 4, 5)
  - [x] `tests/unit/ui/transaction-history.test.tsx` - 12 tests
  - [x] `tests/unit/hooks/useTransactions.test.ts` - 7 tests

## Dev Notes

### Transaction Types

| Type | Label | Color |
|------|-------|-------|
| DISBURSEMENT | Disbursement | Blue |
| ESTABLISHMENT_FEE | Establishment Fee | Purple |
| REPAYMENT | Repayment | Green |
| LATE_FEE | Late Fee | Red |
| DISHONOUR_FEE | Dishonour Fee | Red |
| FEE_WAIVER | Fee Waiver | Teal |
| ADJUSTMENT | Adjustment | Gray |
| WRITE_OFF | Write Off | Gray |

### API Params

```
GET /api/ledger/transactions
  ?loanAccountId=xxx
  &type=REPAYMENT
  &fromDate=2024-01-01
  &toDate=2024-06-30
  &limit=20
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (Anthropic)

### Completion Notes

- All 5 acceptance criteria satisfied
- 19 new tests added (12 for TransactionHistory, 7 for useTransactions)
- All 179 unit tests pass
- ESLint passes (with pre-existing warnings)
- Next.js build compiles successfully
- Type filter with 9 transaction types
- Date range filters with from/to inputs
- Responsive: table on desktop, cards on mobile
- Load more button for pagination
- Graceful handling of ledger unavailability

### Files Created

1. `src/hooks/queries/useTransactions.ts` - TanStack Query hook
2. `src/components/ServicingView/TransactionHistory.tsx` - Main component
3. `tests/unit/hooks/useTransactions.test.ts` - 7 tests
4. `tests/unit/ui/transaction-history.test.tsx` - 12 tests

### Files Modified

1. `src/components/ServicingView/ServicingView.tsx` - Integrated TransactionHistory
2. `src/components/ServicingView/styles.module.css` - Added 200+ lines of transaction styles
3. `src/components/ServicingView/index.ts` - Export TransactionHistory
4. `src/hooks/queries/index.ts` - Export useTransactions and types

### Change Log

- 2025-12-11: Initial implementation of Story 2.4 - Transaction History with Filtering

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5  
**Date:** 2025-12-11  
**Verdict:** ✅ APPROVED

### Findings

| Priority | Issue | Resolution |
|----------|-------|------------|
| LOW | Duplicate totalDelta calculation in Row/Card | Accepted - minimal complexity for extraction |

### Notes

- All 5 acceptance criteria satisfied
- Graceful fallback verified with live testing (ledger unavailable scenario)
- Performance optimizations in place (hoisted formatters, memoized filters)
- Responsive design tested (table/cards swap at 768px)
- 179 unit tests pass

