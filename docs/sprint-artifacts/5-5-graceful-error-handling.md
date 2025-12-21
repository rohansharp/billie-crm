# Story 5.5: Graceful Error Handling

**Epic:** 5 - System Health & Resilience  
**Status**: done (reviewed)  
**Created**: 2025-12-11  
**Completed**: 2025-12-11

## User Story

**As a** support staff member,  
**I want** system errors to display helpful messages,  
**So that** I understand what went wrong and what to do next.

## Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| AC1 | Known error codes display user-friendly message from `ERROR_MESSAGES` | ✅ Done |
| AC2 | Unknown errors show generic message with error ID for support | ✅ Done |
| AC3 | Network timeouts show specific message with Retry button | ✅ Done |
| AC4 | "Copy error details" link included for support tickets | ✅ Done |

## Implementation Summary

### New Files Created

| File | Purpose |
|------|---------|
| `src/lib/errors/codes.ts` | Error code constants and helper functions |
| `src/lib/utils/error.ts` | AppError class, parseApiError, toAppError utilities |
| `src/lib/utils/error-toast.ts` | showErrorToast, copyErrorDetails utilities |
| `src/lib/utils/fetch-with-timeout.ts` | Fetch wrapper with configurable timeout |
| `src/lib/utils/api-error.ts` | Server-side API error response utilities |
| `tests/unit/lib/error.test.ts` | AppError and utility tests (30 tests) |
| `tests/unit/lib/error-toast.test.ts` | Toast utility tests (15 tests) |
| `tests/unit/lib/fetch-with-timeout.test.ts` | Timeout tests (7 tests) |
| `tests/unit/lib/error-codes.test.ts` | Error code tests (9 tests) |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/errors/messages.ts` | Added `NETWORK_TIMEOUT` message |
| `src/lib/constants.ts` | Added `NETWORK_TIMEOUT_MS`, `ERROR_ID_PREFIX` |
| `src/lib/utils/index.ts` | Export new error utilities |
| `src/hooks/mutations/useWaiveFee.ts` | Use AppError, parseApiError, fetchWithTimeout |
| `src/hooks/mutations/useRecordRepayment.ts` | Use AppError, parseApiError, fetchWithTimeout |
| `src/hooks/mutations/useApproveWriteOff.ts` | Use showErrorToast |
| `src/hooks/mutations/useRejectWriteOff.ts` | Use showErrorToast |
| `src/app/api/ledger/waive-fee/route.ts` | Structured error responses with codes |
| `src/app/api/ledger/repayment/route.ts` | Structured error responses with codes |

## Tasks/Subtasks

### Task 1: Create Error Utilities
- [x] 1.1 Create `src/lib/utils/error.ts` with `AppError` class
- [x] 1.2 Add `parseApiError()` function to normalize API error responses
- [x] 1.3 Add `generateErrorId()` function (short unique ID like `ERR-abc123`)
- [x] 1.4 Add `isNetworkTimeout()` helper function
- [x] 1.5 Add `getErrorMessage()` to map codes to ERROR_MESSAGES
- [x] 1.6 Write unit tests in `tests/unit/lib/error.test.ts`

### Task 2: Create Error Toast Utility
- [x] 2.1 Create `src/lib/utils/error-toast.ts` with `showErrorToast()` function
- [x] 2.2 Include "Copy error details" action in toast
- [x] 2.3 Include "Retry" action when `onRetry` callback provided
- [x] 2.4 Format error details as JSON for clipboard
- [x] 2.5 Write unit tests in `tests/unit/lib/error-toast.test.ts`

### Task 3: Add Error Codes to API Routes
- [x] 3.1 Create `ERROR_CODES` constant mapping in `src/lib/errors/codes.ts`
- [x] 3.2 Update `/api/ledger/waive-fee` to return structured error codes
- [x] 3.3 Update `/api/ledger/repayment` to return structured error codes
- [x] 3.4 Ensure all API errors include `errorId` in response

### Task 4: Update Mutation Hooks
- [x] 4.1 Update `useWaiveFee` to use `parseApiError()` and error utilities
- [x] 4.2 Update `useRecordRepayment` to use new error utilities
- [x] 4.3 Update `useApproveWriteOff` and `useRejectWriteOff`
- [x] 4.4 Remove brittle regex-based error detection
- [x] 4.5 Ensure error ID is captured and displayed

### Task 5: Add Network Timeout Handling
- [x] 5.1 Add `NETWORK_TIMEOUT_MS` constant (default: 30 seconds)
- [x] 5.2 Create `fetchWithTimeout()` wrapper utility
- [x] 5.3 Update fetch calls in mutation hooks to use timeout
- [x] 5.4 Show specific timeout message with Retry button

### Task 6: Documentation and Cleanup
- [x] 6.1 Update story documentation with implementation details
- [x] 6.2 Run full test suite and verify no regressions
- [x] 6.3 Update ERROR_MESSAGES with any new messages needed

## Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| `error.test.ts` | 32 | ✅ Pass |
| `error-toast.test.ts` | 15 | ✅ Pass |
| `fetch-with-timeout.test.ts` | 7 | ✅ Pass |
| `error-codes.test.ts` | 9 | ✅ Pass |
| All unit tests | 807 | ✅ Pass |

## Architecture

### Error Flow

```
API Response ──▶ parseApiError() ──▶ AppError ──▶ showErrorToast()
                                        │
                                        ├── code (ERROR_CODES)
                                        ├── message (user-friendly)
                                        ├── errorId (ERR-xxxxxxxx)
                                        ├── timestamp (ISO)
                                        └── details (optional)
```

### Error Categories

| Code | HTTP | Retryable | Toast Action |
|------|------|-----------|--------------|
| VALIDATION_ERROR | 400 | No | Copy details |
| INSUFFICIENT_PRIVILEGES | 403 | No | Copy details |
| ACCOUNT_NOT_FOUND | 404 | No | Copy details |
| NETWORK_TIMEOUT | 408 | Yes | Retry |
| VERSION_CONFLICT | 409 | No | Refresh (modal) |
| LEDGER_UNAVAILABLE | 503 | Yes | Retry |
| NETWORK_ERROR | N/A | Yes | Retry |
| UNKNOWN_ERROR | 500 | No | Copy details |

### Key Improvements Over Previous Implementation

1. **Error Codes vs Regex**: Replaced brittle regex-based system error detection with proper error code checking via `appError.isSystemError()` and `appError.isRetryable()`

2. **Structured API Errors**: API routes now return consistent error format:
   ```json
   {
     "error": "LEDGER_UNAVAILABLE",
     "message": "The ledger service is currently unavailable.",
     "errorId": "ERR-abc12345",
     "timestamp": "2025-12-11T06:00:00.000Z"
   }
   ```

3. **Error ID for Support**: Unknown errors display error ID for easy reference in support tickets

4. **Clipboard Support**: One-click copy of error details as formatted JSON

5. **Network Timeout Handling**: `fetchWithTimeout()` wrapper automatically handles timeouts and throws appropriate `AppError`

## Change Log

| Date | Change |
|------|--------|
| 2025-12-11 | Story created with comprehensive dev context |
| 2025-12-11 | Implementation completed - all tasks done |
| 2025-12-11 | Code review completed - 6 issues fixed |

## Dev Agent Record

### Implementation Plan

1. Created error utility infrastructure (AppError, codes, messages)
2. Built toast utilities with copy-to-clipboard support
3. Updated API routes with structured error responses
4. Migrated mutation hooks from regex-based to code-based error detection
5. Added network timeout handling via fetchWithTimeout
6. Comprehensive test coverage (61 new tests)

### Completion Notes

- All 807 tests passing
- Backward compatible with existing error handling
- Error codes properly distinguish retryable vs non-retryable errors
- Copy details button provides JSON format suitable for support tickets
- Network timeout (30s default) with configurable value
- API routes use `handleApiError()` for consistent error mapping

## Code Review Fixes

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| H1 | High | `toAppError(mutation.error)` creates new error when null | Added null check before calling `toAppError` |
| M1 | Medium | Pattern matching "service" too generic | Changed to "service error" or "grpc" for LEDGER_UNAVAILABLE |
| M2 | Medium | `request.clone().json()` in catch block | Capture body before try block |
| M3 | Medium | Missing test for null/undefined input | Added 2 tests for null/undefined handling |
| L1 | Low | Duplicate `generateApiErrorId` function | Removed, now imports `generateErrorId` from `./error` |
| L2 | Low | Unused `beforeEach` import | Removed from imports |
