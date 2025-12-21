# Story 5.2: Read-Only Mode Activation

**Epic:** 5 - System Health & Resilience  
**Status**: done (reviewed)  
**Started**: 2025-12-11  
**Completed**: 2025-12-11

## User Story

**As a** support staff member,  
**I want** write actions to be gracefully disabled when the ledger is offline,  
**So that** I don't submit actions that will fail.

## Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| AC1 | Banner appears when ledger offline | ✅ Done |
| AC2 | Action buttons disabled with tooltip | ✅ Done (existing) |
| AC3 | Read operations continue to work | ✅ Done |
| AC4 | Banner dismisses when system restored | ✅ Done |
| AC5 | Toast shows "System restored" on recovery | ✅ Done |

## Implementation Details

### New Files Created
| File | Purpose |
|------|---------|
| `src/hooks/useReadOnlyMode.ts` | Syncs ledger health with read-only mode |
| `src/components/ReadOnlyBanner/ReadOnlyBanner.tsx` | Persistent banner component |
| `src/components/ReadOnlyBanner/styles.module.css` | Banner styles |
| `src/components/ReadOnlyBanner/index.ts` | Barrel exports |
| `tests/unit/hooks/useReadOnlyMode.test.ts` | Hook tests (9 tests) |
| `tests/unit/ui/read-only-banner.test.tsx` | Component tests (11 tests) |

### Modified Files
| File | Changes |
|------|---------|
| `src/providers/index.tsx` | Added ReadOnlyModeSync and ReadOnlyBanner |
| `src/lib/constants.ts` | Added TOAST_ID_SYSTEM_RESTORED |
| `src/components/LoanAccountServicing/index.tsx` | Added readOnlyMode check to all buttons |

### Features
- **Auto-sync:** Ledger health status automatically updates read-only mode
- **Persistent Banner:** Red banner at top when offline
- **Recovery Toast:** "System restored" notification when back online
- **No Toast on Initial Load:** Prevents confusing toasts on page refresh
- **Optional Degraded Mode:** Option to treat "degraded" as offline

### Hook Options
- `showRecoveryToast` (default: true) - Show toast on recovery
- `treatDegradedAsOffline` (default: false) - Consider degraded as offline

### Existing Button Integration
Action buttons in these components already respect `readOnlyMode`:
- `ActionsTab.tsx` - Record Payment, Waive Fee, Request Write-Off
- `LoanAccountDetails.tsx` - Record Payment, Waive Fee
- `FeeList.tsx` - Waive Fee per item

## Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| `useReadOnlyMode.test.ts` | 11 | ✅ Pass |
| `read-only-banner.test.tsx` | 11 | ✅ Pass |
| All unit tests | 544 | ✅ Pass |

## Notes

- UI store already had `readOnlyMode` state from earlier work
- Action buttons were pre-wired to disable when `readOnlyMode` is true
- Banner uses `role="alert"` and `aria-live="assertive"` for accessibility
- Toast has unique ID to prevent duplicates

## Code Review Fixes

| Issue | Severity | Fix Applied |
|-------|----------|-------------|
| H1: Missing recovery toast transition test | High | Added test for offline→connected transition toast |
| M1: Missing isLoading test | Medium | Added test for isLoading return value |
| M2: Magic string for toast ID | Medium | Extracted `TOAST_ID_SYSTEM_RESTORED` to constants.ts |
| M3: LoanAccountServicing missing readOnlyMode | Medium | Added readOnlyMode check to all action buttons |
| L1: Unused CSS classes | Low | Added documentation comment explaining future use |
| L2: Missing barrel export | Low | Skipped - no hooks/index.ts pattern established |
