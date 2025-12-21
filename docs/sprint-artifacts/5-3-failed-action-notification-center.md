# Story 5.3: Failed Action Notification Center

**Epic:** 5 - System Health & Resilience  
**Status**: done (reviewed)  
**Started**: 2025-12-11  
**Completed**: 2025-12-11

## User Story

**As a** support staff member,  
**I want** to see a persistent list of my failed actions,  
**So that** I can retry them when the system recovers.

## Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| AC1 | Failed actions added to notification center | ✅ Done |
| AC2 | Badge shows count in admin header | ✅ Done |
| AC3 | Retry button works when online | ✅ Done |
| AC4 | Actions removed on success/dismiss | ✅ Done |
| AC5 | Persist in localStorage with TTL | ✅ Done |

## Implementation Details

### New Files Created
| File | Purpose |
|------|---------|
| `src/stores/failed-actions.ts` | Zustand store with localStorage persistence |
| `src/components/FailedActions/FailedActionsBadge.tsx` | Badge showing failed action count |
| `src/components/FailedActions/FailedActionsPanel.tsx` | Slide-over panel with list |
| `src/components/FailedActions/styles.module.css` | Component styles |
| `src/components/FailedActions/index.ts` | Barrel exports |
| `tests/unit/stores/failed-actions.test.ts` | Store tests (18 tests) |
| `tests/unit/ui/failed-actions-badge.test.tsx` | Badge tests (8 tests) |
| `tests/unit/ui/failed-actions-panel.test.tsx` | Panel tests (26 tests) |

### Modified Files
| File | Changes |
|------|---------|
| `src/providers/index.tsx` | Added FailedActionsBadge |
| `src/hooks/mutations/useWaiveFee.ts` | Capture system errors, retry event listener |
| `src/hooks/mutations/useRecordRepayment.ts` | Capture system errors, retry event listener |
| `src/lib/constants.ts` | Added `MAX_RETRY_ATTEMPTS` and failed actions constants |
| `src/lib/formatters.ts` | Added shared `formatRelativeTime` function |
| `src/components/Notifications/NotificationPanel.tsx` | Uses shared `formatRelativeTime` |

### Features
- **Zustand Store:** Manages failed action queue with TTL (24h)
- **localStorage Persistence:** Actions survive page refresh
- **System Error Detection:** Only captures network/gRPC errors, not validation
- **Badge:** Fixed position with count, opens panel on click
- **Panel:** Shows action type, account, error, retry/dismiss buttons
- **Retry:** Dispatches event for mutation hooks, increments retry count
- **Dismiss:** Removes action from queue
- **Clear All:** Bulk remove all failed actions
- **Focus Trap:** Keyboard accessible panel

### Constants Added
- `FAILED_ACTIONS_STORAGE_KEY` - localStorage key
- `FAILED_ACTIONS_TTL_MS` - 24 hour TTL
- `MAX_FAILED_ACTIONS` - 50 max items

## Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| `failed-actions.test.ts` | 18 | ✅ Pass |
| `failed-actions-badge.test.tsx` | 8 | ✅ Pass |
| `failed-actions-panel.test.tsx` | 26 | ✅ Pass |
| All unit tests | 699 | ✅ Pass |

## Code Review Fixes

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| H1 | High | Retry event not connected to mutation hooks | Added event listeners in `useWaiveFee.ts` and `useRecordRepayment.ts` |
| H2 | High | `removeAction` imported but never used | Now called on successful retry from event handler |
| M1 | Medium | Missing test for retry event dispatch | Added 3 tests for retry event and increment |
| M2 | Medium | Duplicate `formatRelativeTime` function | Extracted to `src/lib/formatters.ts`, updated both panels |
| M3 | Medium | Brittle system error detection regex | Added documentation comment about limitation |
| L1 | Low | No maximum retry limit | Added `MAX_RETRY_ATTEMPTS = 5` constant, disabled button at limit |
| L2 | Low | No duplicate action prevention | Added check in `addFailedAction`, updates existing instead of adding |

## Notes

- Only system errors (not validation) are captured
- Retry button disabled in read-only mode or after 5 attempts
- Panel has focus trap for accessibility
- TTL filter runs on load to remove expired items
- Retry count tracked per action
- Duplicate actions (same type + accountId) update existing instead of creating new
