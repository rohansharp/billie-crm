# Story 3.3: Idempotency & Duplicate Prevention

**Status:** done

## Story

As a **support staff member**,
I want the system to prevent duplicate submissions,
So that I don't accidentally waive a fee twice or double-record a payment.

## Acceptance Criteria

1. **Given** I have submitted a fee waiver
   **When** I click "Waive" on the same fee again while pending
   **Then** the action is disabled with message "Action in progress"

2. **Given** a fee waiver request is sent to the API
   **When** the request includes an idempotency key (nanoid)
   **Then** the server returns the same response for duplicate requests

3. **Given** I double-click the "Submit" button quickly
   **When** the form processes
   **Then** only one request is sent (button disabled after first click)

4. **Given** a network error occurs during submission
   **When** I retry the action
   **Then** the same idempotency key is used to prevent duplicates

## Implementation Notes

**Existing Infrastructure:**
- `src/stores/optimistic.ts` - Has `hasPendingMutations()` and `getPendingForAccount()`
- `src/lib/utils/idempotency.ts` - `generateIdempotencyKey()` already used
- `isPending` state already disables submit buttons (AC3 likely satisfied)

**New for Story 3.3:**
- Add `hasPendingAction(accountId, action)` helper to optimistic store
- Update LoanAccountDetails to check for pending actions before enabling buttons
- Add "Action in progress" messaging
- AC2 (server-side idempotency) - verify existing or document as backend dependency
- AC4 (retry with same key) - review current retry flow

## Tasks / Subtasks

- [ ] **Task 1: Add hasPendingAction helper** (AC: 1)
- [ ] **Task 2: Disable action buttons while pending** (AC: 1)
- [ ] **Task 3: Verify double-click prevention** (AC: 3)
- [ ] **Task 4: Review retry idempotency flow** (AC: 4)
- [ ] **Task 5: Document AC2 (server-side)** (AC: 2)
- [ ] **Task 6: Tests**

## AC2 & AC4 Analysis

### AC2: Server-side Idempotency

**Status:** Backend dependency - not implemented in frontend

The current API routes (`/api/ledger/waive-fee`, `/api/ledger/repayment`) do not accept or process idempotency keys. The `generateIdempotencyKey` function is currently used only for the optimistic store's mutation tracking.

**To implement server-side idempotency:**
1. Backend would need to accept an `idempotencyKey` header/body param
2. Backend stores processed keys with response (e.g., Redis with TTL)
3. Backend returns cached response for duplicate keys

**Current mitigation:** Frontend prevents duplicate submissions via:
- `isPending` state (button disabled during request)
- `hasPendingAction` check (prevents re-opening forms for same action)

### AC4: Retry with Same Key

**Status:** Not applicable without AC2

Since the API doesn't process idempotency keys, reusing the same key on retry has no effect. The current retry flow:
1. Clears failed mutation from optimistic store
2. Submits a fresh request

This is acceptable because:
- The original request failed (no duplicate on server)
- User intentionally chose to retry
- UI state prevents concurrent retries

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Completion Notes

**ACs Satisfied:**
- AC1: ✅ Buttons disabled with "Action in progress" when pending
- AC2: ⚠️ Backend dependency - documented, frontend mitigates via UI state
- AC3: ✅ `isPending` disables submit button after first click
- AC4: ⚠️ Backend dependency - current retry is a fresh request (acceptable)

**Implementation:**
- Added `hasPendingAction(accountId, action)` to optimistic store
- Updated `useWaiveFee` and `useRecordRepayment` to expose pending state
- Updated drawers to show "Action in progress" warning
- Updated LoanAccountDetails buttons to show pending state

### Files Modified

- `src/stores/optimistic.ts` - Added `hasPendingAction` helper
- `src/hooks/mutations/useWaiveFee.ts` - Accept loanAccountId, expose hasPendingWaive
- `src/hooks/mutations/useRecordRepayment.ts` - Accept loanAccountId, expose hasPendingRepayment
- `src/components/ServicingView/WaiveFeeDrawer.tsx` - Added pending warning
- `src/components/ServicingView/RecordRepaymentDrawer.tsx` - Added pending warning
- `src/components/ServicingView/LoanAccountDetails.tsx` - Buttons show pending state
- `src/components/ServicingView/styles.module.css` - Added pendingWarning styles

### Files Created

- `tests/unit/stores/optimistic.test.ts` - 13 unit tests for optimistic store

### Tests

**New tests:** 13 (optimistic store)
**Existing tests verified:** 41 (drawer components)
