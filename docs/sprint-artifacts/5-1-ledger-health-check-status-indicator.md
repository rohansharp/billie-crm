# Story 5.1: Ledger Health Check & Status Indicator

**Epic:** 5 - System Health & Resilience  
**Status**: done (reviewed)  
**Started**: 2025-12-11  
**Completed**: 2025-12-11

## User Story

**As a** support staff member,  
**I want** to see the system connection status at a glance,  
**So that** I know if my actions will succeed before I attempt them.

## Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| AC1 | Status indicator in admin header showing connectivity | ✅ Done |
| AC2 | Green "Connected" when ledger healthy | ✅ Done |
| AC3 | Yellow "Degraded" when high latency (>1s) | ✅ Done |
| AC4 | Red "Offline" when ledger unreachable | ✅ Done |
| AC5 | Polls /api/ledger/health every 30 seconds | ✅ Done |

## Implementation Details

### New Files Created
| File | Purpose |
|------|---------|
| `src/app/api/ledger/health/route.ts` | Health check API endpoint |
| `src/hooks/queries/useLedgerHealth.ts` | Polling hook with status |
| `src/components/LedgerStatus/LedgerStatusIndicator.tsx` | Status indicator UI |
| `src/components/LedgerStatus/styles.module.css` | Component styles |
| `src/components/LedgerStatus/index.ts` | Barrel exports |
| `tests/unit/hooks/useLedgerHealth.test.ts` | Hook tests (10 tests) |
| `tests/unit/ui/ledger-status-indicator.test.tsx` | Component tests (12 tests) |

### Modified Files
| File | Changes |
|------|---------|
| `src/providers/index.tsx` | Added LedgerStatusIndicator |
| `src/lib/constants.ts` | Added health check constants |

### Features
- **Status Dot:** Colored indicator (green/yellow/red) with pulse animation
- **Status Text:** "Connected", "Degraded", or "Offline"
- **Latency Badge:** Shows response time when degraded/offline
- **Tooltip:** Detailed message on hover
- **Refresh Button:** Manual health check trigger
- **Auto-minimize:** Becomes less prominent when connected
- **30s Polling:** Automatic health checks via TanStack Query

### Health States
| State | Color | Condition | Message |
|-------|-------|-----------|---------|
| connected | 🟢 Green | <1s latency | "Ledger Connected" |
| degraded | 🟡 Yellow | 1-5s latency | "Ledger Degraded - some operations may be slow" |
| offline | 🔴 Red | >5s or error | "Ledger Offline - read-only mode active" |

### Constants Added
- `HEALTH_CHECK_INTERVAL_MS = 30_000` (30 seconds)
- `HEALTH_DEGRADED_THRESHOLD_MS = 1_000` (1 second)
- `HEALTH_OFFLINE_THRESHOLD_MS = 5_000` (5 seconds)
- `HEALTH_CHECK_TEST_ACCOUNT = 'health-check-ping'`

## Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| `useLedgerHealth.test.ts` | 10 | ✅ Pass |
| `ledger-status-indicator.test.tsx` | 12 | ✅ Pass |
| `ledger-health.test.ts` (API) | 14 | ✅ Pass |
| All unit tests | 522 | ✅ Pass |

## Code Review Fixes

| # | Issue | Fix |
|---|-------|-----|
| H1 | Duplicate type definitions | Created `src/types/ledger-health.ts` shared types |
| M1 | Missing screen reader announcements | Added `aria-live="polite"` to status text |
| M2 | No tests for API endpoint | Added 14 tests for API logic |
| M3 | Magic number for latency threshold | Extracted `LATENCY_DISPLAY_THRESHOLD_MS` constant |
| L1 | Tooltip not keyboard accessible | Added `:focus-within` CSS rule |
| L2 | Missing console logging | Added `console.warn` for offline status |

## Notes

- Health check uses gRPC getBalance with test account ID
- NOT_FOUND errors from gRPC are treated as healthy (service responded)
- Fixed position: bottom-left of admin UI
- Minimizes when connected to reduce visual noise
- Includes manual refresh button for on-demand checks
