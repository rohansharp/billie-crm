# Ledger Frontend Integration - Stories

**Project:** billie-crm  
**Feature Set:** Ledger Frontend Integration  
**Date:** 2026-01-17  
**Related:** [epics.md](./epics.md) | [UX Design](../../docs/ux-design/ledger-integration-ux.md)

---

## Story Format

Each story follows this format:
- **ID:** `E{epic}-S{story}` (e.g., E0-S1 = Epic 0, Story 1)
- **Title:** Brief description
- **User Story:** As a [role], I want [goal], so that [benefit]
- **Acceptance Criteria:** Specific, testable criteria
- **Technical Notes:** Implementation guidance
- **Dependencies:** Other stories that must be completed first
- **Estimate:** Story points (1, 2, 3, 5, 8, 13)

---

## Epic 0: gRPC Client & API Foundation

### E0-S1: Update Proto File with New Service Methods

**Title:** Sync proto file with billie-platform-services

**User Story:**  
As a developer, I want the proto file updated with all new RPC methods, so that I can generate typed client code.

**Acceptance Criteria:**
- [ ] Copy `accounting_ledger.proto` from billie-platform-services to `proto/`
- [ ] Proto file includes all 35 new RPC methods
- [ ] Proto file compiles without errors
- [ ] Existing RPC methods preserved (no breaking changes)

**Technical Notes:**
- Source: `/Users/rohansharp/workspace/billie-platform-services/proto/accounting_ledger.proto`
- Target: `/Users/rohansharp/workspace/billie-crm/proto/accounting_ledger.proto`
- Run `pnpm build` to verify proto loads correctly

**Dependencies:** None

**Estimate:** 1 point

---

### E0-S2: Extend gRPC Client - Schedule & Aging Methods

**Title:** Add schedule and aging gRPC methods to client

**User Story:**  
As a developer, I want typed methods for schedule and aging queries, so that I can fetch instalment status and aging data.

**Acceptance Criteria:**
- [ ] Add `getScheduleWithStatus(request)` method
- [ ] Add `getAccountAging(request)` method
- [ ] Add `getOverdueAccounts(request)` method
- [ ] All methods return typed responses
- [ ] Methods handle gRPC errors with proper error types

**Technical Notes:**
```typescript
// src/server/grpc-client.ts additions
interface GetScheduleWithStatusRequest { ... }
interface ScheduleWithStatusResponse { ... }
interface GetAccountAgingRequest { ... }
interface AccountAgingResponse { ... }
interface GetOverdueAccountsRequest { ... }
interface OverdueAccountsResponse { ... }

async getScheduleWithStatus(request: GetScheduleWithStatusRequest): Promise<ScheduleWithStatusResponse>
async getAccountAging(request: GetAccountAgingRequest): Promise<AccountAgingResponse>
async getOverdueAccounts(request: GetOverdueAccountsRequest): Promise<OverdueAccountsResponse>
```

**Dependencies:** E0-S1

**Estimate:** 3 points

---

### E0-S3: Extend gRPC Client - Revenue Recognition Methods

**Title:** Add accrual/yield gRPC methods to client

**User Story:**  
As a developer, I want typed methods for revenue recognition queries, so that I can fetch accrued yield data.

**Acceptance Criteria:**
- [ ] Add `getAccruedYield(request)` method
- [ ] Add `getAccrualEventHistory(request)` method
- [ ] All methods return typed responses
- [ ] Methods handle gRPC errors with proper error types

**Technical Notes:**
```typescript
interface GetAccruedYieldRequest { accountId: string }
interface AccruedYieldResponse { ... }
interface GetAccrualEventHistoryRequest { accountId: string; limit?: number }
interface AccrualEventHistoryResponse { ... }
```

**Dependencies:** E0-S1

**Estimate:** 2 points

---

### E0-S4: Extend gRPC Client - ECL Methods

**Title:** Add ECL query and action gRPC methods to client

**User Story:**  
As a developer, I want typed methods for ECL operations, so that I can query and manage ECL data.

**Acceptance Criteria:**
- [ ] Add `getECLAllowance(request)` method
- [ ] Add `getPortfolioECL(request)` method
- [ ] Add `triggerPortfolioECLRecalculation(request)` method
- [ ] Add `triggerBulkECLRecalculation(request)` method
- [ ] Add `getEventProcessingStatus(request)` method
- [ ] All methods return typed responses

**Technical Notes:**
- Portfolio ECL returns bucket breakdown
- Recalculation methods return progress/results
- Event processing status returns stream health

**Dependencies:** E0-S1

**Estimate:** 3 points

---

### E0-S5: Extend gRPC Client - ECL Configuration Methods

**Title:** Add ECL configuration gRPC methods to client

**User Story:**  
As a developer, I want typed methods for ECL configuration, so that I can manage PD rates and overlay multiplier.

**Acceptance Criteria:**
- [ ] Add `getECLConfig(request)` method
- [ ] Add `updateOverlayMultiplier(request)` method
- [ ] Add `updatePDRate(request)` method
- [ ] Add `getECLConfigHistory(request)` method
- [ ] Add `scheduleECLConfigChange(request)` method
- [ ] Add `getPendingConfigChanges(request)` method
- [ ] Add `cancelPendingConfigChange(request)` method
- [ ] Add `applyPendingConfigChanges(request)` method

**Technical Notes:**
- All write methods require `updated_by` parameter
- Schedule changes require `effective_date` in future

**Dependencies:** E0-S1

**Estimate:** 5 points

---

### E0-S6: Extend gRPC Client - Period Close Methods

**Title:** Add period close gRPC methods to client

**User Story:**  
As a developer, I want typed methods for period close operations, so that I can implement the close wizard.

**Acceptance Criteria:**
- [ ] Add `previewPeriodClose(request)` method
- [ ] Add `finalizePeriodClose(request)` method
- [ ] Add `getPeriodClose(request)` method
- [ ] Add `getClosedPeriods(request)` method
- [ ] Add `acknowledgeAnomaly(request)` method

**Technical Notes:**
- Preview returns `preview_id` for subsequent operations
- Preview has 4-hour TTL
- Finalize requires all anomalies acknowledged

**Dependencies:** E0-S1

**Estimate:** 3 points

---

### E0-S7: Extend gRPC Client - Export Methods

**Title:** Add export gRPC methods to client

**User Story:**  
As a developer, I want typed methods for export operations, so that I can implement the export center.

**Acceptance Criteria:**
- [ ] Add `createExportJob(request)` method
- [ ] Add `getExportStatus(request)` method
- [ ] Add `getExportResult(request)` method
- [ ] Add `retryExport(request)` method
- [ ] Add `listExportJobs(request)` method

**Technical Notes:**
- Export jobs are async - poll status
- Result contains data string (CSV or JSON)
- Retry only for failed jobs

**Dependencies:** E0-S1

**Estimate:** 3 points

---

### E0-S8: Extend gRPC Client - Investigation Methods

**Title:** Add investigation gRPC methods to client

**User Story:**  
As a developer, I want typed methods for investigation operations, so that I can implement traceability tools.

**Acceptance Criteria:**
- [ ] Add `getEventHistory(request)` method
- [ ] Add `traceECLToSource(request)` method
- [ ] Add `traceAccruedYieldToSource(request)` method
- [ ] Add `searchAccounts(request)` method
- [ ] Add `batchAccountQuery(request)` method
- [ ] Add `generateRandomSample(request)` method
- [ ] Add `getCarryingAmountBreakdown(request)` method

**Technical Notes:**
- Event history uses cursor-based pagination
- Batch query supports up to 100 accounts
- Random sample requires `allow_full_scan: true` for unfiltered

**Dependencies:** E0-S1

**Estimate:** 5 points

---

### E0-S9: Create API Routes - Schedule & Aging

**Title:** Add API routes for schedule and aging endpoints

**User Story:**  
As a frontend developer, I want Next.js API routes for schedule/aging, so that I can call them from React components.

**Acceptance Criteria:**
- [ ] `GET /api/ledger/schedule/[accountId]` → returns schedule with status
- [ ] `GET /api/ledger/aging/[accountId]` → returns account aging
- [ ] `GET /api/ledger/aging/overdue` → returns paginated overdue accounts
- [ ] All routes handle errors gracefully
- [ ] All routes return typed JSON responses

**Technical Notes:**
```typescript
// src/app/api/ledger/schedule/[accountId]/route.ts
// src/app/api/ledger/aging/[accountId]/route.ts
// src/app/api/ledger/aging/overdue/route.ts
```

**Dependencies:** E0-S2

**Estimate:** 3 points

---

### E0-S10: Create API Routes - Revenue Recognition

**Title:** Add API routes for accrual endpoints

**User Story:**  
As a frontend developer, I want Next.js API routes for accruals, so that I can display yield data.

**Acceptance Criteria:**
- [ ] `GET /api/ledger/accrual/[accountId]` → returns accrued yield
- [ ] `GET /api/ledger/accrual/[accountId]/history` → returns accrual events
- [ ] Routes handle errors gracefully

**Technical Notes:**
- History endpoint supports `?limit=N` query param

**Dependencies:** E0-S3

**Estimate:** 2 points

---

### E0-S11: Create API Routes - ECL

**Title:** Add API routes for ECL query and action endpoints

**User Story:**  
As a frontend developer, I want Next.js API routes for ECL operations.

**Acceptance Criteria:**
- [ ] `GET /api/ledger/ecl/[accountId]` → returns ECL allowance
- [ ] `GET /api/ledger/ecl/portfolio` → returns portfolio ECL summary
- [ ] `POST /api/ledger/ecl/recalc/portfolio` → triggers portfolio recalc
- [ ] `POST /api/ledger/ecl/recalc/bulk` → triggers bulk recalc
- [ ] `GET /api/system/status` → returns event processing status

**Technical Notes:**
- Recalc endpoints require Finance role

**Dependencies:** E0-S4

**Estimate:** 3 points

---

### E0-S12: Create API Routes - ECL Configuration

**Title:** Add API routes for ECL configuration endpoints

**User Story:**  
As a frontend developer, I want Next.js API routes for ECL config management.

**Acceptance Criteria:**
- [ ] `GET /api/ecl-config` → returns current config
- [ ] `PUT /api/ecl-config/overlay` → updates overlay multiplier
- [ ] `PUT /api/ecl-config/pd-rate` → updates PD rate for bucket
- [ ] `GET /api/ecl-config/history` → returns config change history
- [ ] `POST /api/ecl-config/schedule` → schedules future change
- [ ] `GET /api/ecl-config/pending` → returns pending changes
- [ ] `DELETE /api/ecl-config/pending/[changeId]` → cancels pending change
- [ ] `POST /api/ecl-config/apply-pending` → applies due changes

**Technical Notes:**
- All write endpoints require Finance Admin role
- All write endpoints require `updated_by` in body

**Dependencies:** E0-S5

**Estimate:** 5 points

---

### E0-S13: Create API Routes - Period Close

**Title:** Add API routes for period close endpoints

**User Story:**  
As a frontend developer, I want Next.js API routes for period close operations.

**Acceptance Criteria:**
- [ ] `POST /api/period-close/preview` → generates preview
- [ ] `POST /api/period-close/finalize` → finalizes period
- [ ] `GET /api/period-close/[periodDate]` → returns period close data
- [ ] `GET /api/period-close/history` → returns closed periods list
- [ ] `POST /api/period-close/acknowledge-anomaly` → acknowledges anomaly

**Technical Notes:**
- Preview requires `period_date` and `requested_by`
- Finalize requires `preview_id` and `finalized_by`
- Finalize blocked if anomalies not acknowledged

**Dependencies:** E0-S6

**Estimate:** 3 points

---

### E0-S14: Create API Routes - Export

**Title:** Add API routes for export endpoints

**User Story:**  
As a frontend developer, I want Next.js API routes for export operations.

**Acceptance Criteria:**
- [ ] `POST /api/export/jobs` → creates export job
- [ ] `GET /api/export/jobs/[jobId]` → returns job status
- [ ] `GET /api/export/jobs/[jobId]/result` → returns export data
- [ ] `POST /api/export/jobs/[jobId]/retry` → retries failed job
- [ ] `GET /api/export/jobs` → returns user's export jobs

**Technical Notes:**
- Jobs list filtered by current user
- Result endpoint returns file download

**Dependencies:** E0-S7

**Estimate:** 3 points

---

### E0-S15: Create API Routes - Investigation

**Title:** Add API routes for investigation endpoints

**User Story:**  
As a frontend developer, I want Next.js API routes for investigation operations.

**Acceptance Criteria:**
- [ ] `GET /api/investigation/events/[accountId]` → returns event history
- [ ] `GET /api/investigation/trace/ecl/[accountId]` → returns ECL trace
- [ ] `GET /api/investigation/trace/accrual/[accountId]` → returns accrual trace
- [ ] `GET /api/investigation/search` → searches accounts
- [ ] `POST /api/investigation/batch-query` → batch account query
- [ ] `POST /api/investigation/sample` → generates random sample
- [ ] `GET /api/investigation/carrying-amount/[accountId]` → returns breakdown

**Technical Notes:**
- Event history uses cursor pagination
- Batch query body contains array of account IDs
- Sample body contains filter criteria

**Dependencies:** E0-S8

**Estimate:** 5 points

---

## Epic 1: Portfolio Dashboard & Collections Queue

### E1-S1: Create Collections Queue View Shell

**Title:** Add Collections Queue view with navigation

**User Story:**  
As a collections staff member, I want a dedicated Collections Queue view, so that I can focus on overdue accounts.

**Acceptance Criteria:**
- [ ] New view at `/admin/collections`
- [ ] View registered in `payload.config.ts`
- [ ] Navigation link added to sidebar under OPERATIONS section
- [ ] View displays loading state while fetching data
- [ ] View follows existing layout patterns (WithTemplate wrapper)

**Technical Notes:**
```typescript
// payload.config.ts
collections: {
  Component: '@/components/CollectionsView/CollectionsViewWithTemplate',
  path: '/collections',
}
```

**Dependencies:** None (can start parallel with E0)

**Estimate:** 2 points

---

### E1-S2: Create useOverdueAccounts Query Hook

**Title:** Add React Query hook for overdue accounts

**User Story:**  
As a developer, I want a React Query hook for overdue accounts, so that I can fetch and cache the data.

**Acceptance Criteria:**
- [ ] `useOverdueAccounts(filters)` hook created
- [ ] Supports filter parameters: bucket, minDpd, maxDpd, pageSize, pageToken
- [ ] Returns typed `OverdueAccountsResponse`
- [ ] Handles loading, error, and data states
- [ ] Supports pagination via `pageToken`

**Technical Notes:**
```typescript
// src/hooks/queries/useOverdueAccounts.ts
export function useOverdueAccounts(filters: OverdueFilters) {
  return useQuery({
    queryKey: ['overdue-accounts', filters],
    queryFn: () => fetchOverdueAccounts(filters),
  })
}
```

**Dependencies:** E0-S9

**Estimate:** 2 points

---

### E1-S3: Implement OverdueQueue Component

**Title:** Build the overdue accounts list component

**User Story:**  
As a collections staff member, I want to see a filterable list of overdue accounts, so that I can prioritize my work.

**Acceptance Criteria:**
- [ ] Displays overdue accounts in sortable table
- [ ] Columns: Account, Customer, DPD, Bucket, Amount, Action
- [ ] Supports filtering by bucket (dropdown)
- [ ] Supports filtering by DPD range (min/max inputs)
- [ ] Shows total count and sum of overdue amounts
- [ ] Pagination controls at bottom
- [ ] Click row navigates to servicing view

**Technical Notes:**
- Use existing `SortableTable` component pattern
- Follow wireframe in UX design doc section 2

**Dependencies:** E1-S1, E1-S2

**Estimate:** 5 points

---

### E1-S4: Add Export to CSV for Collections Queue

**Title:** Allow exporting filtered overdue accounts to CSV

**User Story:**  
As a collections manager, I want to export the overdue list to CSV, so that I can share it with my team.

**Acceptance Criteria:**
- [ ] Export button in Collections Queue header
- [ ] Exports currently filtered/sorted data
- [ ] CSV includes all visible columns
- [ ] File named `overdue-accounts-{date}.csv`
- [ ] Toast notification on export success

**Technical Notes:**
- Client-side CSV generation (no server round-trip)
- Use existing CSV export patterns if available

**Dependencies:** E1-S3

**Estimate:** 2 points

---

### E1-S5: Create usePortfolioECL Query Hook

**Title:** Add React Query hook for portfolio ECL summary

**User Story:**  
As a developer, I want a hook for portfolio ECL data, so that I can display it on the dashboard.

**Acceptance Criteria:**
- [ ] `usePortfolioECL()` hook created
- [ ] Returns typed `PortfolioECLResponse` with bucket breakdown
- [ ] Auto-refreshes every 60 seconds
- [ ] Handles loading and error states

**Dependencies:** E0-S11

**Estimate:** 2 points

---

### E1-S6: Create useEventProcessingStatus Query Hook

**Title:** Add React Query hook for system status

**User Story:**  
As a developer, I want a hook for event processing status, so that I can display system health.

**Acceptance Criteria:**
- [ ] `useEventProcessingStatus()` hook created
- [ ] Returns typed `EventProcessingStatusResponse`
- [ ] Auto-refreshes every 10 seconds
- [ ] Handles loading and error states

**Dependencies:** E0-S11

**Estimate:** 2 points

---

### E1-S7: Add Portfolio Health Widget to Dashboard

**Title:** Add portfolio summary widget to existing dashboard

**User Story:**  
As a finance manager, I want to see portfolio health at a glance on the dashboard, so that I can monitor overall status.

**Acceptance Criteria:**
- [ ] Widget shows: Active accounts, Total receivables, Overdue count
- [ ] Widget placed in dashboard grid (top row)
- [ ] Click navigates to Collections Queue
- [ ] Loading state shows skeleton
- [ ] Error state shows retry option

**Technical Notes:**
- Integrate into existing `DashboardView` component
- Data from existing portfolio summary API

**Dependencies:** None (uses existing API)

**Estimate:** 3 points

---

### E1-S8: Add ECL Summary Widget to Dashboard

**Title:** Add ECL summary widget to existing dashboard

**User Story:**  
As a finance manager, I want to see ECL summary on the dashboard, so that I can monitor provisioning.

**Acceptance Criteria:**
- [ ] Widget shows: Total ECL, ECL as % of portfolio
- [ ] Mini bar chart showing ECL by bucket
- [ ] "View Details" link to ECL Config (when implemented)
- [ ] Loading/error states

**Dependencies:** E1-S5

**Estimate:** 3 points

---

### E1-S9: Add System Status Widget to Dashboard

**Title:** Add system health indicator to dashboard

**User Story:**  
As an operations user, I want to see system health on the dashboard, so that I know if processing is working.

**Acceptance Criteria:**
- [ ] Widget shows: Overall status (Healthy/Degraded/Critical)
- [ ] Shows pending message count
- [ ] Shows "Last sync" timestamp
- [ ] Click navigates to System Status view (when implemented)
- [ ] Auto-refreshes every 10 seconds

**Dependencies:** E1-S6

**Estimate:** 2 points

---

### E1-S10: Create System Status View

**Title:** Add dedicated System Status view

**User Story:**  
As an engineering/admin user, I want a detailed system status view, so that I can monitor event processing.

**Acceptance Criteria:**
- [ ] New view at `/admin/system-status`
- [ ] Shows stream-by-stream status table
- [ ] Shows pending count, lag, consumer count per stream
- [ ] Status indicators: OK (green), LAGGING (yellow), STALLED (red)
- [ ] Shows recent errors section (if any)
- [ ] Auto-refreshes every 10 seconds
- [ ] Role-gated: Admin/Engineering only

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A4

**Dependencies:** E1-S6, E0-S11

**Estimate:** 5 points

---

## Epic 2: Enhanced Account Detail (Aging, Yield, ECL)

### E2-S1: Create useAccountAging Query Hook

**Title:** Add React Query hook for account aging

**User Story:**  
As a developer, I want a hook for account aging data, so that I can display DPD and bucket info.

**Acceptance Criteria:**
- [ ] `useAccountAging(accountId)` hook created
- [ ] Returns typed `AccountAgingResponse`
- [ ] Handles loading and error states

**Dependencies:** E0-S9

**Estimate:** 2 points

---

### E2-S2: Create useAccruedYield Query Hook

**Title:** Add React Query hook for accrued yield

**User Story:**  
As a developer, I want a hook for accrued yield data, so that I can display revenue recognition info.

**Acceptance Criteria:**
- [ ] `useAccruedYield(accountId)` hook created
- [ ] Returns typed `AccruedYieldResponse`
- [ ] Handles loading and error states

**Dependencies:** E0-S10

**Estimate:** 2 points

---

### E2-S3: Create useECLAllowance Query Hook

**Title:** Add React Query hook for ECL allowance

**User Story:**  
As a developer, I want a hook for ECL allowance data, so that I can display ECL info.

**Acceptance Criteria:**
- [ ] `useECLAllowance(accountId)` hook created
- [ ] Returns typed `ECLAllowanceResponse`
- [ ] Handles loading and error states

**Dependencies:** E0-S11

**Estimate:** 2 points

---

### E2-S4: Add Aging Status to Account Header

**Title:** Display aging info in account header

**User Story:**  
As a support staff member, I want to see aging status in the account header, so that I know the account's risk level at a glance.

**Acceptance Criteria:**
- [ ] Header shows: Bucket badge (color-coded), DPD count
- [ ] Badge colors: Current=green, Bucket1=yellow, Bucket2=orange, Bucket3/4=red
- [ ] Tooltip shows full aging details
- [ ] Integrates with existing `AccountHeader.tsx`

**Dependencies:** E2-S1

**Estimate:** 3 points

---

### E2-S5: Implement Accruals Tab Component

**Title:** Build the Accruals tab for account detail

**User Story:**  
As a finance user, I want to see accrued yield details in an Accruals tab, so that I can understand revenue recognition.

**Acceptance Criteria:**
- [ ] New "Accruals" tab added to AccountPanel tabs
- [ ] Shows cumulative accrued amount and remaining
- [ ] Shows progress bar (days accrued / term days)
- [ ] Shows calculation breakdown (fee, term, daily rate)
- [ ] Shows recent accrual events table (last 5)
- [ ] "View Full History" link to Investigation view

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A5
- Use existing tab pattern from AccountTabs.tsx

**Dependencies:** E2-S2

**Estimate:** 5 points

---

### E2-S6: Implement ECL Tab Component

**Title:** Build the ECL tab for account detail

**User Story:**  
As a finance user, I want to see ECL details in an ECL tab, so that I can understand provisioning for this account.

**Acceptance Criteria:**
- [ ] New "ECL" tab added to AccountPanel tabs
- [ ] Shows current ECL amount and delta from prior
- [ ] Shows carrying amount breakdown (principal + accrued)
- [ ] Shows calculation section (bucket, PD rate, overlay, formula)
- [ ] Shows trigger information (when, why, event ID)
- [ ] Shows ECL history table (last 5-6 calculations)
- [ ] "Trace to Source Events" link to Investigation view

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A6
- Highlight if ECL has changed significantly

**Dependencies:** E2-S3

**Estimate:** 5 points

---

### E2-S7: Create useScheduleWithStatus Query Hook

**Title:** Add React Query hook for schedule with instalment status

**User Story:**  
As a developer, I want a hook for schedule data with status, so that I can enhance the schedule display.

**Acceptance Criteria:**
- [ ] `useScheduleWithStatus(accountId)` hook created
- [ ] Returns typed `ScheduleWithStatusResponse`
- [ ] Includes instalment statuses and summary

**Dependencies:** E0-S9

**Estimate:** 2 points

---

### E2-S8: Enhance RepaymentScheduleList with Status

**Title:** Add instalment status badges to schedule list

**User Story:**  
As a support staff member, I want to see instalment status on each schedule row, so that I know which payments are overdue.

**Acceptance Criteria:**
- [ ] Each instalment row shows status badge: PENDING (gray), PARTIAL (yellow), PAID (green), OVERDUE (red)
- [ ] Summary shows: paid count, partial count, overdue count
- [ ] Next due date and amount highlighted
- [ ] Uses new `GetScheduleWithStatus` API

**Dependencies:** E2-S7

**Estimate:** 3 points

---

### E2-S9: Create useCarryingAmountBreakdown Query Hook

**Title:** Add React Query hook for carrying amount breakdown

**User Story:**  
As a developer, I want a hook for carrying amount details, so that auditors can verify calculations.

**Acceptance Criteria:**
- [ ] `useCarryingAmountBreakdown(accountId)` hook created
- [ ] Returns full breakdown with all calculation inputs

**Dependencies:** E0-S15

**Estimate:** 2 points

---

### E2-S10: Add Carrying Amount Detail Modal

**Title:** Add modal to show full carrying amount breakdown

**User Story:**  
As an auditor, I want to see the full carrying amount calculation, so that I can verify it's correct.

**Acceptance Criteria:**
- [ ] Accessible from ECL tab via "View Breakdown" link
- [ ] Shows all inputs: principal, accrued yield, days, term, rate
- [ ] Shows calculation timestamp
- [ ] Can copy values to clipboard

**Dependencies:** E2-S9

**Estimate:** 3 points

---

## Epic 3: Period-End Close Wizard

### E3-S1: Create Period Close View Shell

**Title:** Add Period Close view with navigation

**User Story:**  
As a finance user, I want a Period Close view, so that I can perform month-end close.

**Acceptance Criteria:**
- [ ] New view at `/admin/period-close`
- [ ] View registered in `payload.config.ts`
- [ ] Navigation link added under FINANCE section
- [ ] Role-gated: Finance/Operations only
- [ ] View shows wizard progress indicator

**Dependencies:** None

**Estimate:** 2 points

---

### E3-S2: Create usePeriodClosePreview Mutation Hook

**Title:** Add mutation hook for generating preview

**User Story:**  
As a developer, I want a mutation hook to generate period close preview.

**Acceptance Criteria:**
- [ ] `usePeriodClosePreview()` mutation hook created
- [ ] Accepts period date and requested_by
- [ ] Returns preview data with ID
- [ ] Handles loading and error states

**Dependencies:** E0-S13

**Estimate:** 2 points

---

### E3-S3: Create useClosedPeriods Query Hook

**Title:** Add hook for closed periods history

**User Story:**  
As a developer, I want a hook for closed periods list.

**Acceptance Criteria:**
- [ ] `useClosedPeriods()` hook created
- [ ] Returns list of closed period dates

**Dependencies:** E0-S13

**Estimate:** 2 points

---

### E3-S4: Implement Wizard Step 1 - Select Period

**Title:** Build period selection step

**User Story:**  
As a finance user, I want to select a period date, so that I can generate a preview.

**Acceptance Criteria:**
- [ ] Date picker for period end date
- [ ] Validation: must be end of month, not future, not already closed
- [ ] Shows last closed period info
- [ ] Shows recent closed periods table
- [ ] "Generate Preview" button triggers API call
- [ ] Loading state during preview generation

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A1, Step 1

**Dependencies:** E3-S1, E3-S2, E3-S3

**Estimate:** 5 points

---

### E3-S5: Implement Wizard Step 2 - Preview Summary

**Title:** Build preview summary step

**User Story:**  
As a finance user, I want to see the preview summary, so that I can verify totals before proceeding.

**Acceptance Criteria:**
- [ ] Shows: Total accounts, Accrued yield, ECL allowance, Carrying amount
- [ ] Shows ECL by bucket table
- [ ] Shows anomaly count with warning if > 0
- [ ] Shows reconciliation status
- [ ] Shows preview expiry countdown
- [ ] Back/Continue navigation

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A1, Step 2

**Dependencies:** E3-S4

**Estimate:** 5 points

---

### E3-S6: Implement Wizard Step 3 - Movement Analysis

**Title:** Build ECL movement analysis step

**User Story:**  
As a finance user, I want to see ECL movement analysis, so that I can understand changes from prior period.

**Acceptance Criteria:**
- [ ] Shows prior vs current ECL comparison
- [ ] Shows net change amount and percentage
- [ ] Shows movement by cause chart/table
- [ ] Shows movement by bucket table with in/out counts
- [ ] Handles first close (no prior period)

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A1, Step 3
- Use bar chart for movement visualization

**Dependencies:** E3-S5

**Estimate:** 5 points

---

### E3-S7: Create useAcknowledgeAnomaly Mutation Hook

**Title:** Add mutation hook for acknowledging anomalies

**User Story:**  
As a developer, I want a mutation hook to acknowledge anomalies.

**Acceptance Criteria:**
- [ ] `useAcknowledgeAnomaly()` mutation hook created
- [ ] Accepts preview_id, anomaly_id, acknowledged_by
- [ ] Returns updated acknowledgment status

**Dependencies:** E0-S13

**Estimate:** 2 points

---

### E3-S8: Implement Wizard Step 4 - Anomaly Review

**Title:** Build anomaly review step

**User Story:**  
As a finance user, I want to review and acknowledge anomalies, so that I can proceed to finalization.

**Acceptance Criteria:**
- [ ] Lists all anomalies with severity indicator
- [ ] Each anomaly shows: type, account, description, severity
- [ ] "View Account" link opens in new tab
- [ ] "Acknowledge" button per anomaly
- [ ] Progress counter: "Acknowledged: X of Y"
- [ ] Continue button disabled until all acknowledged

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A1, Step 4

**Dependencies:** E3-S6, E3-S7

**Estimate:** 5 points

---

### E3-S9: Create useFinalizePeriodClose Mutation Hook

**Title:** Add mutation hook for finalizing period close

**User Story:**  
As a developer, I want a mutation hook to finalize period close.

**Acceptance Criteria:**
- [ ] `useFinalizePeriodClose()` mutation hook created
- [ ] Accepts preview_id and finalized_by
- [ ] Returns finalization result with journal entries

**Dependencies:** E0-S13

**Estimate:** 2 points

---

### E3-S10: Implement Wizard Step 5 - Finalize

**Title:** Build finalization step

**User Story:**  
As a finance user, I want to finalize the period close, so that journals are generated.

**Acceptance Criteria:**
- [ ] Shows checklist of completed steps
- [ ] Shows summary table (same as Step 2)
- [ ] Shows journal entries to be generated
- [ ] Type-to-confirm safety ("CLOSE JAN 2026")
- [ ] Finalize button disabled until typed
- [ ] Success state shows generated journals
- [ ] "View in History" link

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A1, Step 5

**Dependencies:** E3-S8, E3-S9

**Estimate:** 5 points

---

### E3-S11: Implement Close History View

**Title:** Build period close history list

**User Story:**  
As a finance user, I want to see past period closes, so that I can review historical data.

**Acceptance Criteria:**
- [ ] "History" button in Period Close view header
- [ ] Table showing: Period, Closed Date, Closed By, Total ECL
- [ ] Click row shows detail drawer/modal
- [ ] Detail shows: totals, bucket breakdown, journal entries

**Dependencies:** E3-S3

**Estimate:** 3 points

---

## Epic 4: ECL Configuration Management

### E4-S1: Create ECL Config View Shell

**Title:** Add ECL Configuration view with navigation

**User Story:**  
As a finance admin, I want an ECL Configuration view, so that I can manage ECL parameters.

**Acceptance Criteria:**
- [ ] New view at `/admin/ecl-config`
- [ ] View registered in `payload.config.ts`
- [ ] Navigation link under FINANCE section
- [ ] Role-gated: Finance Admin only

**Dependencies:** None

**Estimate:** 2 points

---

### E4-S2: Create useECLConfig Query Hook

**Title:** Add hook for ECL configuration

**User Story:**  
As a developer, I want a hook for ECL config data.

**Acceptance Criteria:**
- [ ] `useECLConfig()` hook created
- [ ] Returns overlay multiplier and PD rates

**Dependencies:** E0-S12

**Estimate:** 2 points

---

### E4-S3: Implement Current Config Display

**Title:** Build current configuration display

**User Story:**  
As a finance admin, I want to see current ECL config, so that I know the active parameters.

**Acceptance Criteria:**
- [ ] Shows overlay multiplier with slider visualization
- [ ] Shows PD rates table by bucket
- [ ] Shows last updated timestamp and user for each
- [ ] Edit buttons for each parameter

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A2

**Dependencies:** E4-S1, E4-S2

**Estimate:** 3 points

---

### E4-S4: Create useUpdateOverlay Mutation Hook

**Title:** Add mutation hook for overlay update

**User Story:**  
As a developer, I want a mutation hook to update overlay multiplier.

**Acceptance Criteria:**
- [ ] `useUpdateOverlay()` mutation created
- [ ] Accepts new value and updated_by
- [ ] Invalidates ECL config query on success

**Dependencies:** E0-S12

**Estimate:** 2 points

---

### E4-S5: Create useUpdatePDRate Mutation Hook

**Title:** Add mutation hook for PD rate update

**User Story:**  
As a developer, I want a mutation hook to update PD rates.

**Acceptance Criteria:**
- [ ] `useUpdatePDRate()` mutation created
- [ ] Accepts bucket, new rate, and updated_by
- [ ] Invalidates ECL config query on success

**Dependencies:** E0-S12

**Estimate:** 2 points

---

### E4-S6: Implement Edit Parameter Modal

**Title:** Build modal for editing config parameters

**User Story:**  
As a finance admin, I want to edit ECL parameters in a modal, so that I can see impact before saving.

**Acceptance Criteria:**
- [ ] Modal for editing overlay or PD rate
- [ ] Shows current value and input for new value
- [ ] Requires reason for change
- [ ] Shows impact preview (estimated ECL change)
- [ ] "Apply Immediately" and "Schedule for Later" options
- [ ] Confirmation before apply

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A2

**Dependencies:** E4-S3, E4-S4, E4-S5

**Estimate:** 5 points

---

### E4-S7: Create useScheduleConfigChange Mutation Hook

**Title:** Add mutation hook for scheduling config changes

**User Story:**  
As a developer, I want a mutation hook to schedule future config changes.

**Acceptance Criteria:**
- [ ] `useScheduleConfigChange()` mutation created
- [ ] Accepts field, value, effective date, created_by

**Dependencies:** E0-S12

**Estimate:** 2 points

---

### E4-S8: Create usePendingConfigChanges Query Hook

**Title:** Add hook for pending config changes

**User Story:**  
As a developer, I want a hook for pending config changes.

**Acceptance Criteria:**
- [ ] `usePendingConfigChanges()` hook created
- [ ] Returns list of pending changes

**Dependencies:** E0-S12

**Estimate:** 2 points

---

### E4-S9: Implement Scheduled Changes Section

**Title:** Build scheduled changes display and management

**User Story:**  
As a finance admin, I want to see and manage scheduled changes, so that I can plan parameter updates.

**Acceptance Criteria:**
- [ ] Shows table of pending changes
- [ ] Columns: Effective Date, Parameter, Current, New, Actions
- [ ] Cancel button per change
- [ ] "Schedule New Change" button opens scheduler
- [ ] Scheduler has: parameter select, new value, effective date picker

**Dependencies:** E4-S7, E4-S8

**Estimate:** 5 points

---

### E4-S10: Create useECLConfigHistory Query Hook

**Title:** Add hook for config change history

**User Story:**  
As a developer, I want a hook for config change history.

**Acceptance Criteria:**
- [ ] `useECLConfigHistory()` hook created
- [ ] Returns list of historical changes

**Dependencies:** E0-S12

**Estimate:** 2 points

---

### E4-S11: Implement Config History View

**Title:** Build configuration history display

**User Story:**  
As a finance admin, I want to see config change history, so that I have an audit trail.

**Acceptance Criteria:**
- [ ] "History" button in ECL Config view header
- [ ] Table showing: Timestamp, Parameter, Old Value, New Value, Changed By
- [ ] Filterable by parameter and user
- [ ] Paginated

**Dependencies:** E4-S10

**Estimate:** 3 points

---

### E4-S12: Create useTriggerPortfolioRecalc Mutation Hook

**Title:** Add mutation hook for portfolio recalculation

**User Story:**  
As a developer, I want a mutation hook to trigger portfolio ECL recalc.

**Acceptance Criteria:**
- [ ] `useTriggerPortfolioRecalc()` mutation created
- [ ] Returns progress/result information

**Dependencies:** E0-S11

**Estimate:** 2 points

---

### E4-S13: Implement Recalculation Actions

**Title:** Build portfolio recalculation UI

**User Story:**  
As a finance admin, I want to trigger ECL recalculation, so that changes take effect.

**Acceptance Criteria:**
- [ ] "Recalculate Portfolio ECL" button
- [ ] Confirmation modal with warning about time
- [ ] Progress indicator during recalc
- [ ] Success/failure toast notification
- [ ] "Recalculate Selected" option for bulk accounts

**Dependencies:** E4-S12

**Estimate:** 3 points

---

## Epic 5: Export Center

### E5-S1: Create Export Center View Shell

**Title:** Add Export Center view with navigation

**User Story:**  
As a finance user, I want an Export Center view, so that I can export data.

**Acceptance Criteria:**
- [ ] New view at `/admin/exports`
- [ ] View registered in `payload.config.ts`
- [ ] Navigation link under FINANCE section
- [ ] Role-gated: Finance/Engineering

**Dependencies:** None

**Estimate:** 2 points

---

### E5-S2: Create useExportJobs Query Hook

**Title:** Add hook for export jobs list

**User Story:**  
As a developer, I want a hook for the user's export jobs.

**Acceptance Criteria:**
- [ ] `useExportJobs()` hook created
- [ ] Returns list of user's export jobs
- [ ] Auto-refreshes for pending jobs

**Dependencies:** E0-S14

**Estimate:** 2 points

---

### E5-S3: Create useCreateExportJob Mutation Hook

**Title:** Add mutation hook for creating exports

**User Story:**  
As a developer, I want a mutation hook to create export jobs.

**Acceptance Criteria:**
- [ ] `useCreateExportJob()` mutation created
- [ ] Accepts export type, format, and options

**Dependencies:** E0-S14

**Estimate:** 2 points

---

### E5-S4: Implement Export Type Cards

**Title:** Build export type selection cards

**User Story:**  
As a finance user, I want to choose an export type, so that I can get the right data.

**Acceptance Criteria:**
- [ ] Three cards: Journal Entries, Audit Trail, Methodology
- [ ] Each card shows: icon, title, description
- [ ] "Create" button on each card
- [ ] Click opens export wizard for that type

**Technical Notes:**
- Follow wireframe in UX design doc section 6

**Dependencies:** E5-S1

**Estimate:** 3 points

---

### E5-S5: Implement Export Wizard - Journal Entries

**Title:** Build wizard for journal entry exports

**User Story:**  
As a finance user, I want to export journal entries for a period, so that I can import to Xero.

**Acceptance Criteria:**
- [ ] Step 1: Select period date
- [ ] Step 2: Select format (CSV, JSON)
- [ ] Step 3: Confirm and create job
- [ ] Shows job ID and redirects to jobs list

**Dependencies:** E5-S3, E5-S4

**Estimate:** 3 points

---

### E5-S6: Implement Export Wizard - Audit Trail

**Title:** Build wizard for audit trail exports

**User Story:**  
As an auditor, I want to export audit trail for accounts, so that I can review calculations.

**Acceptance Criteria:**
- [ ] Step 1: Select accounts (search, paste IDs, or date range)
- [ ] Step 2: Select format and options (include calculation breakdown)
- [ ] Step 3: Confirm and create job

**Dependencies:** E5-S3, E5-S4

**Estimate:** 3 points

---

### E5-S7: Implement Recent Exports List

**Title:** Build recent exports table

**User Story:**  
As a finance user, I want to see my recent exports, so that I can download or retry them.

**Acceptance Criteria:**
- [ ] Table showing: Type, Created, Status, Size, Action
- [ ] Status badges: Pending (blue), Processing (yellow), Ready (green), Failed (red)
- [ ] Download button for completed
- [ ] Retry button for failed
- [ ] Auto-refreshes for pending jobs

**Dependencies:** E5-S2

**Estimate:** 5 points

---

### E5-S8: Implement Export Download

**Title:** Build export download functionality

**User Story:**  
As a finance user, I want to download completed exports.

**Acceptance Criteria:**
- [ ] Download button triggers file download
- [ ] File named appropriately (e.g., `journals-2026-01-31.csv`)
- [ ] Large files show progress indicator
- [ ] Toast notification on download complete

**Dependencies:** E5-S7

**Estimate:** 3 points

---

## Epic 6: Investigation & Traceability Tools

### E6-S1: Create Investigation View Shell

**Title:** Add Investigation view with navigation

**User Story:**  
As an engineering user, I want an Investigation view, so that I can trace events.

**Acceptance Criteria:**
- [ ] New view at `/admin/investigation`
- [ ] View registered in `payload.config.ts`
- [ ] Navigation link under ADMIN section
- [ ] Role-gated: Engineering/Auditor/Admin

**Dependencies:** None

**Estimate:** 2 points

---

### E6-S2: Create useEventHistory Query Hook

**Title:** Add hook for event history

**User Story:**  
As a developer, I want a hook for account event history.

**Acceptance Criteria:**
- [ ] `useEventHistory(accountId, cursor, limit)` hook created
- [ ] Supports cursor-based pagination
- [ ] Returns events with next cursor

**Dependencies:** E0-S15

**Estimate:** 2 points

---

### E6-S3: Implement Account Lookup Section

**Title:** Build account lookup UI

**User Story:**  
As an engineer, I want to search for an account, so that I can investigate it.

**Acceptance Criteria:**
- [ ] Search input for account ID/number/customer
- [ ] "Batch Query" button opens batch modal
- [ ] "Random Sample" button opens sample modal
- [ ] Search results show account summary

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A3

**Dependencies:** E6-S1

**Estimate:** 3 points

---

### E6-S4: Implement Event Timeline Tab

**Title:** Build event timeline component

**User Story:**  
As an engineer, I want to see all events for an account, so that I can trace issues.

**Acceptance Criteria:**
- [ ] Tab shows chronological event list
- [ ] Columns: Time, Stream, Event Type, Actions
- [ ] Click event shows detail panel with JSON
- [ ] Filter by stream/event type
- [ ] Pagination (cursor-based)
- [ ] Export button

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A3

**Dependencies:** E6-S2, E6-S3

**Estimate:** 5 points

---

### E6-S5: Create useTraceECL Query Hook

**Title:** Add hook for ECL trace

**User Story:**  
As a developer, I want a hook for ECL trace data.

**Acceptance Criteria:**
- [ ] `useTraceECL(accountId)` hook created
- [ ] Returns trace result with trigger chain

**Dependencies:** E0-S15

**Estimate:** 2 points

---

### E6-S6: Implement ECL Trace Tab

**Title:** Build ECL trace component

**User Story:**  
As an auditor, I want to trace ECL back to source events, so that I can verify calculations.

**Acceptance Criteria:**
- [ ] Shows current ECL state
- [ ] Shows triggered-by event
- [ ] Shows all calculation inputs with sources
- [ ] Shows formula with values
- [ ] Visual trace diagram

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A3

**Dependencies:** E6-S5, E6-S3

**Estimate:** 5 points

---

### E6-S7: Create useTraceAccrual Query Hook

**Title:** Add hook for accrual trace

**User Story:**  
As a developer, I want a hook for accrual trace data.

**Acceptance Criteria:**
- [ ] `useTraceAccrual(accountId)` hook created
- [ ] Returns trace result with disbursement chain

**Dependencies:** E0-S15

**Estimate:** 2 points

---

### E6-S8: Implement Accrual Trace Tab

**Title:** Build accrual trace component

**User Story:**  
As an auditor, I want to trace accrued yield back to source, so that I can verify calculations.

**Acceptance Criteria:**
- [ ] Shows current accrual state
- [ ] Shows fee amount and term from disbursement
- [ ] Shows daily rate calculation
- [ ] Shows accrual event count

**Dependencies:** E6-S7, E6-S3

**Estimate:** 3 points

---

### E6-S9: Implement Batch Query Modal

**Title:** Build batch account query modal

**User Story:**  
As an auditor, I want to query multiple accounts at once, so that I can efficiently review samples.

**Acceptance Criteria:**
- [ ] Modal with textarea for pasting account IDs
- [ ] Detects and counts IDs (max 100)
- [ ] Checkboxes for data to include
- [ ] "Query & Export CSV" button
- [ ] Progress indicator during query

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A3

**Dependencies:** E6-S3

**Estimate:** 5 points

---

### E6-S10: Implement Random Sample Modal

**Title:** Build random sample generator modal

**User Story:**  
As an auditor, I want to generate random samples, so that I can do statistical verification.

**Acceptance Criteria:**
- [ ] Filter inputs: bucket, ECL range, carrying amount range
- [ ] Sample size input (max 500)
- [ ] Optional seed for reproducibility
- [ ] Shows count of matching accounts
- [ ] "Generate Sample" returns account IDs
- [ ] Can export or query the sample

**Technical Notes:**
- Follow wireframe in UX design doc Appendix A3

**Dependencies:** E6-S3

**Estimate:** 5 points

---

## Story Summary

| Epic | Stories | Total Points |
|------|---------|--------------|
| Epic 0: Foundation | 15 | 47 |
| Epic 1: Dashboard & Collections | 10 | 31 |
| Epic 2: Account Detail | 10 | 32 |
| Epic 3: Period Close | 11 | 43 |
| Epic 4: ECL Config | 13 | 37 |
| Epic 5: Export Center | 8 | 23 |
| Epic 6: Investigation | 10 | 34 |
| **Total** | **77** | **247** |

---

## Implementation Order

### Sprint 1: Foundation (E0)
- E0-S1 through E0-S15 (all foundation stories)
- Target: Complete gRPC client and all API routes

### Sprint 2: Core UI - Part 1 (E1, E2)
- E1-S1 through E1-S10 (Dashboard & Collections)
- E2-S1 through E2-S4 (Account Detail hooks + header)

### Sprint 3: Core UI - Part 2 (E2 continued)
- E2-S5 through E2-S10 (Account Detail tabs)

### Sprint 4: Period Close (E3)
- E3-S1 through E3-S11 (entire Period Close wizard)

### Sprint 5: ECL Config (E4)
- E4-S1 through E4-S13 (entire ECL Config)

### Sprint 6: Export & Investigation (E5, E6)
- E5-S1 through E5-S8 (Export Center)
- E6-S1 through E6-S10 (Investigation Tools)

---

*Generated: 2026-01-17*
