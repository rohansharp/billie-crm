# Story 1.4: Loan Account & Transaction Search

**Status:** done

## Story

As a **support staff member**,
I want to search by Account Number or Loan Account ID,
So that I can find accounts directly without knowing the customer.

## Acceptance Criteria

1. **Given** I search with a pattern matching Account Number format
   **When** results return
   **Then** loan account results appear with: Account Number, Customer Name, Balance, Status

2. **Given** search results include multiple types (customers and accounts)
   **When** displayed in the palette
   **Then** results are grouped by type with section headers ("Customers", "Loan Accounts")

3. **Given** I select a loan account from results
   **When** ServicingView (Epic 2) is not yet implemented
   **Then** a toast displays "Account servicing coming in Epic 2" and the palette closes

4. **Given** no accounts match my search
   **When** results are empty
   **Then** display appropriate message (customers may still appear if they match)

## Implementation Notes

**Transaction Search Deferred:** Transaction IDs are stored in the gRPC Ledger service, not Payload.
Searching transactions would require either:
- A transaction index collection (event-sourced)
- Iterating all accounts and querying gRPC (expensive)

This is deferred to a future story. For now, users can find transactions by:
1. Search for customer → Open ServicingView → View transaction history
2. Search for account → Open ServicingView → View transaction history

## Tasks / Subtasks

- [x] **Task 1: Create loan account search API route** (AC: 1, 4)
  - [x] Create `src/app/api/loan-accounts/search/route.ts`
  - [x] Implement GET handler with `?q=` query parameter
  - [x] Search loan accounts by: accountNumber, loanAccountId, customerName
  - [x] Limit results to 10, return subset of fields
  - [x] Include balance and status in response

- [x] **Task 2: Create TanStack Query hook for account search** (AC: 1)
  - [x] Create `src/hooks/queries/useLoanAccountSearch.ts`
  - [x] Use query key `['loan-account-search', query]`
  - [x] Set `staleTime: 30_000` (cache results for 30s)

- [x] **Task 3: Create LoanAccountSearchResult component** (AC: 1)
  - [x] Create `src/components/ui/CommandPalette/LoanAccountSearchResult.tsx`
  - [x] Display: Account Number, Customer Name, Balance, Status badge
  - [x] Use `Command.Item` from cmdk for keyboard navigation

- [x] **Task 4: Add grouped results to CommandPalette** (AC: 2, 3, 4)
  - [x] Update `GlobalCommandPalette` in `src/providers/index.tsx`
  - [x] Call both `useCustomerSearch` and `useLoanAccountSearch`
  - [x] Group results with `Command.Group` and section headers
  - [x] On account select: show toast, close palette

- [x] **Task 5: Tests** (AC: 1, 2, 3, 4)
  - [x] `tests/unit/hooks/useLoanAccountSearch.test.ts`
  - [x] `tests/unit/ui/loan-account-search-result.test.tsx`
  - [x] `tests/int/loan-account-search.int.spec.ts`

## Dev Notes

### API Route Pattern

```typescript
// src/app/api/loan-accounts/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { LoanAccountSearchResult, LoanAccountSearchResponse } from '@/types/search'

export async function GET(request: NextRequest): Promise<NextResponse<LoanAccountSearchResponse>> {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.trim() || ''

  if (query.length < 3) {
    return NextResponse.json({ results: [], total: 0 })
  }

  const payload = await getPayload({ config: configPromise })

  const results = await payload.find({
    collection: 'loan-accounts',
    where: {
      or: [
        { accountNumber: { contains: query } },
        { loanAccountId: { contains: query } },
        { customerName: { contains: query } },
      ],
    },
    limit: 10,
  })

  return NextResponse.json({
    results: results.docs.map((account) => ({
      id: account.id,
      loanAccountId: account.loanAccountId,
      accountNumber: account.accountNumber,
      customerName: account.customerName ?? null,
      customerIdString: account.customerIdString ?? null,
      accountStatus: account.accountStatus,
      totalOutstanding: account.balances?.totalOutstanding ?? 0,
    })),
    total: results.totalDocs,
  })
}
```

### Grouped Results Pattern

```typescript
// In GlobalCommandPalette
import { Command } from 'cmdk'

<CommandPalette ...>
  {/* Customer Results */}
  {customerData?.results.length > 0 && (
    <Command.Group heading="Customers">
      {customerData.results.map((customer) => (
        <CustomerSearchResult key={customer.id} customer={customer} ... />
      ))}
    </Command.Group>
  )}

  {/* Loan Account Results */}
  {accountData?.results.length > 0 && (
    <Command.Group heading="Loan Accounts">
      {accountData.results.map((account) => (
        <LoanAccountSearchResult key={account.id} account={account} ... />
      ))}
    </Command.Group>
  )}
</CommandPalette>
```

### Shared Types

Add to `src/types/search.ts`:

```typescript
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
```

### References

- [Source: docs/epics.md#Story 1.4]
- [Source: docs/project_context.md] (TanStack Query patterns)
- [Source: Story 1.3] (Customer search pattern to follow)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (Anthropic)

### Debug Log References

- None (clean implementation)

### Completion Notes

- All 4 acceptance criteria satisfied
- 26 new tests added (8 hook tests, 11 component tests, 7 integration tests)
- All 185 tests pass
- Next.js build compiles successfully with `/api/loan-accounts/search` route
- ESLint passes (with pre-existing warnings)
- Results grouped by type using `Command.Group` ("Customers", "Loan Accounts")
- Status badges color-coded (Active=blue, Paid Off=green, In Arrears=orange, Written Off=red)
- Balance displayed in AUD currency format
- Transaction search deferred (requires gRPC per-account calls)

### Files Created

1. `src/app/api/loan-accounts/search/route.ts` - Search API endpoint
2. `src/hooks/queries/useLoanAccountSearch.ts` - TanStack Query search hook
3. `src/components/ui/CommandPalette/LoanAccountSearchResult.tsx` - Result component
4. `tests/unit/hooks/useLoanAccountSearch.test.ts` - 8 hook unit tests
5. `tests/unit/ui/loan-account-search-result.test.tsx` - 11 component unit tests
6. `tests/int/loan-account-search.int.spec.ts` - 7 API integration tests

### Files Modified

1. `src/types/search.ts` - Added LoanAccountSearchResult, LoanAccountSearchResponse
2. `src/types/index.ts` - Export new types
3. `src/providers/index.tsx` - Added grouped results with both search hooks
4. `src/components/ui/CommandPalette/styles.module.css` - Added status badge styles
5. `src/components/ui/CommandPalette/index.ts` - Export LoanAccountSearchResult
6. `src/components/ui/index.ts` - Export LoanAccountSearchResult
7. `src/hooks/queries/index.ts` - Export useLoanAccountSearch
8. `src/hooks/index.ts` - Export useLoanAccountSearch

### Change Log

- 2025-12-11: Initial implementation of Story 1.4 - Loan Account Search
- 2025-12-11: Code review fixes applied (error toast useEffect, Intl.NumberFormat hoisting)

---

## Senior Developer Review (AI)

### Review Date: 2025-12-11

### Findings Summary

| Severity | Issue | Resolution |
|----------|-------|------------|
| MEDIUM | Error toast triggers on every render | ✅ Fixed: Moved to useEffect |
| LOW | Intl.NumberFormat created on every render | ✅ Fixed: Hoisted to module scope |
| LOW | Hook tests are structural only | Accepted for MVP |
| INFO | CSS badge duplication | Noted for future refactor |

### Fixes Applied

1. **Error toast pattern** - Moved error check from render body to `useEffect` in `providers/index.tsx`
2. **Currency formatter** - Hoisted `Intl.NumberFormat` to module scope in `LoanAccountSearchResult.tsx`

### Verification

- All 185 tests pass
- ESLint clean (pre-existing warnings only)
- Build compiles successfully

### Approval

✅ **APPROVED** - Story 1.4 complete. Epic 1 fully implemented.
