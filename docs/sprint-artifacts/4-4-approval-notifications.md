# Story 4.4: Approval Notifications

**Epic:** 4 - Write-Off & Approval Workflow  
**Status**: done (reviewed)  
**Started**: 2025-12-11  
**Completed**: 2025-12-11

## User Story

**As an** approver,  
**I want** to be notified when new write-off requests require my attention,  
**So that** I don't miss time-sensitive approvals.

## Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| AC1 | Toast notification appears when new request is submitted | ✅ Done |
| AC2 | Badge in header shows count of pending approvals | ✅ Done |
| AC3 | Clicking badge opens notification panel with list | ✅ Done |
| AC4 | Requestor receives notification of approval/rejection | ✅ Done (via toast on approve/reject) |

## Implementation Details

### New Files Created
| File | Purpose |
|------|---------|
| `src/hooks/queries/useApprovalNotifications.ts` | Polling hook with new item detection, localStorage tracking |
| `src/components/Notifications/NotificationBadge.tsx` | Header badge with count |
| `src/components/Notifications/NotificationPanel.tsx` | Slide-over panel with notification list |
| `src/components/Notifications/NotificationIndicator.tsx` | Fixed-position wrapper for admin |
| `src/components/Notifications/NotificationIndicatorWrapper.tsx` | Client-side user role fetcher |
| `src/components/Notifications/styles.module.css` | Component styles |
| `src/components/Notifications/index.ts` | Barrel export |
| `tests/unit/ui/notification-badge.test.tsx` | 8 tests |
| `tests/unit/ui/notification-panel.test.tsx` | 17 tests |

### Modified Files
| File | Changes |
|------|---------|
| `src/providers/index.tsx` | Added NotificationIndicatorWrapper |

### Features
- **Real-time-like Updates:** Polls every 30 seconds for new requests
- **Toast Notifications:** Shows toast when new requests arrive
- **Badge Count:** Displays total pending in fixed-position badge
- **Notification Panel:** Slide-over with recent requests, relative time, reason tags
- **Role-based Visibility:** Only shown for admin/supervisor roles
- **Mark as Read:** Individual and bulk mark-as-read functionality
- **LocalStorage Tracking:** Prevents duplicate toasts for same request
- **Senior Approval Tags:** Visual indicator for high-value requests

## Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| `notification-badge.test.tsx` | 8 | ✅ Pass |
| `notification-panel.test.tsx` | 17 | ✅ Pass |
| `useApprovalNotifications.test.ts` | 9 | ✅ Pass |
| All unit tests | 434 | ✅ Pass |

## Code Review Fixes

| Severity | Issue | Fix Applied |
|----------|-------|-------------|
| H1 | Duplicate polling queries | Shared `write-off-requests` query key prefix for cache coordination |
| H2 | Missing hook tests | Added 9 tests for `useApprovalNotifications` |
| M1 | Toast navigation | Documented as expected behavior (full reload acceptable) |
| M2 | Inconsistent currency format | Now uses `formatCurrency()` from shared lib |
| M3 | Missing focus trap | Added focus trap with Tab key cycling |
| L1 | Magic number 100 | Extracted to `MAX_STORED_NOTIFICATION_IDS` constant |
| L2 | Redundant visible prop | Removed (early return handles role check) |

## Notes

- Polling interval: 30 seconds (balance between freshness and API load)
- Badge shows count, not individual notifications
- Panel shows last 10 pending requests
- Toast only shown once per new request (tracked via localStorage)
- Fixed position badge appears in top-right of Payload admin
