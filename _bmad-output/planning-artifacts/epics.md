---
stepsCompleted: [1]
status: 'in-progress'
inputDocuments:
  - billie-platform-services/docs/USER_MANUAL.md
  - billie-platform-services/docs/PLATFORM_SERVICES_DOCUMENTATION.md
  - billie-platform-services/proto/accounting_ledger.proto
  - billie-platform-services/_bmad-output/planning-artifacts/epics.md
  - billie-crm/docs/architecture-billie-crm-web.md
  - billie-crm/docs/ux-design-specification.md
documentCounts:
  prd: 1
  architecture: 2
  ux: 1
  apiSpecs: 1
  backendEpics: 1
workflowType: 'epics'
projectName: 'billie-crm'
featureSet: 'Ledger Frontend Integration'
date: '2026-01-17'
gapAnalysisCompleted: true
---

# Ledger Frontend Integration - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for **Ledger Frontend Integration** in billie-crm. This feature set adds comprehensive UI components to interact with the new Revenue Recognition & ECL backend services (billie-platform-services).

## Gap Analysis Summary

### ✅ Existing Implementation (No New Work Required)

The following features are **already fully implemented** in billie-crm:

| Category | Status | Components |
|----------|--------|------------|
| Account Detail View | ✅ COMPLETE | `AccountPanel.tsx`, `AccountHeader.tsx`, `OverviewTab.tsx` |
| Balance Display | ✅ COMPLETE | `BalanceCard.tsx`, live balance integration |
| Transaction List | ✅ COMPLETE | `TransactionsTab.tsx`, `TransactionHistory.tsx` |
| Schedule View (Basic) | ✅ COMPLETE | `RepaymentScheduleList.tsx` |
| Fees Tab | ✅ COMPLETE | `FeesTab.tsx`, `FeeList.tsx` |
| Record Payment | ✅ COMPLETE | `RecordRepaymentDrawer.tsx`, `RecordPaymentModal.tsx` |
| Fee Waiver | ✅ COMPLETE | `WaiveFeeDrawer.tsx`, `WaiveFeeModal.tsx`, `BulkWaiveFeeDrawer.tsx` |
| Write-off Request | ✅ COMPLETE | `WriteOffRequestDrawer.tsx`, `WriteOffModal.tsx` |
| Adjustment Entry | ✅ COMPLETE | `AdjustmentModal.tsx` |
| Late Fee Application | ✅ COMPLETE | `ApplyLateFeeModal.tsx` |
| Approval Workflow | ✅ COMPLETE | `ApprovalsView/*` (10 files) |
| Basic Dashboard | ✅ COMPLETE | `DashboardView` (needs enhancement) |

**Existing API Routes:**
- `/api/ledger/adjustment` ✅
- `/api/ledger/balance` ✅
- `/api/ledger/health` ✅
- `/api/ledger/late-fee` ✅
- `/api/ledger/record` ✅
- `/api/ledger/repayment` ✅
- `/api/ledger/statement` ✅
- `/api/ledger/transactions` ✅
- `/api/ledger/waive-fee` ✅
- `/api/ledger/write-off` ✅

**Existing gRPC Client Methods:**
- `getTransactions`, `getBalance`, `getLedgerRecord`, `getStatement`
- `watchTransactions`, `recordRepayment`, `applyLateFee`, `waiveFee`
- `writeOff`, `makeAdjustment`

### 🔧 Enhancement Required (Existing + New Features)

| Feature | Existing | New Additions |
|---------|----------|---------------|
| Schedule View | Basic schedule display | Add instalment status (PENDING/PARTIAL/PAID/OVERDUE) via `GetScheduleWithStatus` |
| Dashboard | Basic greeting, recent customers | Add Portfolio ECL widget, Aging summary, System health |
| Account Search | Basic search | Enhanced search via `SearchAccounts` with more filters |

### 🆕 New Modules Required (35 New gRPC Endpoints)

| Module | New gRPC Methods | New Components Needed |
|--------|-----------------|----------------------|
| **Schedule/Aging** | `GetScheduleWithStatus`, `GetAccountAging`, `GetOverdueAccounts` | 3 |
| **Revenue Recognition** | `GetAccruedYield`, `GetAccrualEventHistory` | 2 |
| **ECL Management** | `GetECLAllowance`, `GetPortfolioECL`, `TriggerPortfolioECLRecalculation`, `TriggerBulkECLRecalculation` | 4 |
| **ECL Configuration** | `GetECLConfig`, `UpdateOverlayMultiplier`, `UpdatePDRate`, `GetECLConfigHistory`, `ScheduleECLConfigChange`, `GetPendingConfigChanges`, `CancelPendingConfigChange`, `ApplyPendingConfigChanges` | 8 |
| **Period Close** | `PreviewPeriodClose`, `FinalizePeriodClose`, `GetPeriodClose`, `GetClosedPeriods`, `AcknowledgeAnomaly` | 5 |
| **Export** | `CreateExportJob`, `GetExportStatus`, `GetExportResult`, `RetryExport`, `ListExportJobs` | 5 |
| **Investigation** | `GetEventHistory`, `TraceECLToSource`, `TraceAccruedYieldToSource`, `BatchAccountQuery`, `GenerateRandomSample`, `GetCarryingAmountBreakdown` | 6 |
| **System Monitoring** | `GetEventProcessingStatus` | 1 |

---

## Requirements Inventory

### Functional Requirements - EXISTING (No Stories Needed)

**Account Management UI - ✅ ALREADY IMPLEMENTED**
- ~~FR-UI-1: Account Detail View~~ → `AccountPanel.tsx` ✅
- ~~FR-UI-2: Balance Display~~ → `OverviewTab.tsx`, `BalanceCard.tsx` ✅
- ~~FR-UI-3: Transaction List~~ → `TransactionsTab.tsx`, `TransactionHistory.tsx` ✅
- ~~FR-UI-4: Statement Generation~~ → `/api/ledger/statement` ✅

**Transaction Processing UI - ✅ ALREADY IMPLEMENTED**
- ~~FR-UI-8: Payment Entry~~ → `RecordRepaymentDrawer.tsx`, `RecordPaymentModal.tsx` ✅
- ~~FR-UI-9: Late Fee Application~~ → `ApplyLateFeeModal.tsx` ✅
- ~~FR-UI-10: Fee Waiver~~ → `WaiveFeeDrawer.tsx`, `WaiveFeeModal.tsx` ✅
- ~~FR-UI-11: Write-off Processing~~ → `WriteOffRequestDrawer.tsx`, `WriteOffModal.tsx` ✅
- ~~FR-UI-12: Adjustment Entry~~ → `AdjustmentModal.tsx` ✅

### Functional Requirements - ENHANCEMENT (Stories Required)

**Account Management UI - 🔧 ENHANCEMENTS**
- FR-UI-5: Enhanced Schedule View with instalment status (PENDING, PARTIAL, PAID, OVERDUE)
- FR-UI-6: Enhanced account search via `SearchAccounts` RPC
- FR-UI-7: Bulk account lookups via `BatchAccountQuery` RPC

### Functional Requirements - NEW (Full Stories Required)

**Account Aging & Collections UI (4 FRs) - 🆕 ALL NEW**
- FR-UI-13: Aging Status Card showing DPD, bucket, and days until overdue
- FR-UI-14: Overdue Queue with filtering by bucket and DPD range
- FR-UI-15: Sort and filter overdue accounts by amount, DPD, and bucket
- FR-UI-16: Quick navigation from overdue queue to account detail

**Revenue Recognition UI (4 FRs) - 🆕 ALL NEW**
- FR-UI-17: Yield Summary showing cumulative accrued yield per account
- FR-UI-18: Accrual Timeline showing daily accrual events
- FR-UI-19: Query accrued yield as of a specific date
- FR-UI-20: Accrual calculation breakdown (fee amount, term days, daily rate)

**Expected Credit Loss (ECL) UI (10 FRs) - 🆕 ALL NEW**
- FR-UI-21: ECL Detail View showing current allowance per account
- FR-UI-22: Portfolio Dashboard with ECL aggregated by bucket
- FR-UI-23: ECL Config Panel (overlay multiplier, PD rates)
- FR-UI-24: ECL Config History/Audit Trail
- FR-UI-25: Schedule future ECL parameter changes
- FR-UI-26: View and manage pending config changes
- FR-UI-27: Cancel scheduled config changes
- FR-UI-28: Trigger portfolio-wide ECL recalculation
- FR-UI-29: Trigger selective ECL recalculation for specific accounts
- FR-UI-30: ECL movement analysis (prior vs current period)

**Period-End Close UI (7 FRs) - 🆕 ALL NEW**
- FR-UI-31: Initiate Period Close Preview for a specific date
- FR-UI-32: Preview Dashboard with totals and breakdown
- FR-UI-33: Review and acknowledge Anomalies before finalization
- FR-UI-34: ECL Movement analysis in preview
- FR-UI-35: Finalize Period Close (with confirmation)
- FR-UI-36: Close History for past periods
- FR-UI-37: Generated Journal Entries from close

**Export & Integration UI (6 FRs) - 🆕 ALL NEW**
- FR-UI-38: Export Wizard (journal entries, audit trail, methodology)
- FR-UI-39: Export format selection (CSV, JSON)
- FR-UI-40: Export Job Status and progress
- FR-UI-41: Download completed exports
- FR-UI-42: Retry failed exports
- FR-UI-43: Export History

**Investigation & Traceability UI (9 FRs) - 🆕 ALL NEW**
- FR-UI-44: Full Event Timeline for an account
- FR-UI-45: ECL Drilldown trace to source aging event
- FR-UI-46: Yield Drilldown trace to source accrual events
- FR-UI-47: Enhanced search with filters
- FR-UI-48: Batch Account Query for multiple accounts
- FR-UI-49: Random Samples by criteria (bucket, ECL range, etc.)
- FR-UI-50: Carrying Amount Breakdown for verification
- FR-UI-51: System Status Dashboard (event processing health)
- FR-UI-52: Per-stream processing status and backlog metrics

### Non-Functional Requirements (Frontend)

**Performance (4 NFRs)**
- NFR-UI-P1: UI must show optimistic updates within 100ms of user action
- NFR-UI-P2: Account detail views must load within 1.5 seconds (FCP)
- NFR-UI-P3: Lists (overdue accounts, transactions) must support pagination/virtualization for 10K+ items
- NFR-UI-P4: Real-time data must refresh every 10 seconds with immediate revalidation on mutations

**Usability (5 NFRs)**
- NFR-UI-U1: All primary actions must be keyboard accessible
- NFR-UI-U2: Error states must provide clear recovery actions (retry, refresh)
- NFR-UI-U3: Forms must validate inputs and show errors inline
- NFR-UI-U4: Financial values must use consistent formatting (2 decimal places, currency symbol)
- NFR-UI-U5: Status badges must be visually distinct (color + icon)

**Consistency (3 NFRs)**
- NFR-UI-C1: New components must follow existing Payload CMS design patterns
- NFR-UI-C2: New views must use existing navigation and layout patterns
- NFR-UI-C3: New modals/drawers must follow existing interaction patterns (esc to close, focus trap)

**Accessibility (3 NFRs)**
- NFR-UI-A1: All interactive elements must have visible focus states
- NFR-UI-A2: Status changes must be announced to screen readers (aria-live)
- NFR-UI-A3: Color must not be the only indicator of state (use icons/text)

### Additional Requirements from Architecture

**From billie-crm Architecture:**
- All new views inject into Payload Admin UI via `components.views`
- New API routes follow existing patterns in `src/app/api/`
- gRPC client calls via existing `src/server/grpc-client.ts`
- State management using existing React Query patterns in `src/hooks/`
- Optimistic UI updates using existing mutation patterns

**From Platform Services Documentation:**
- All write operations support idempotency keys
- All read operations return data from projections (eventually consistent)
- Event processing status can be monitored via GetEventProcessingStatus RPC
- Export jobs are asynchronous - poll for status

**From Existing UX Patterns:**
- Slide-over drawers for detail views (maintain list context)
- Modals for write actions (focused attention)
- Toast notifications for action feedback
- Skeleton loaders during data fetch
- Command palette (Cmd+K) for navigation

---

## FR Coverage Map

### Already Implemented (No New API/Components)

| Frontend FR | Status | Existing Component |
|-------------|--------|-------------------|
| FR-UI-1 | ✅ DONE | `AccountPanel.tsx` |
| FR-UI-2 | ✅ DONE | `OverviewTab.tsx`, `BalanceCard.tsx` |
| FR-UI-3 | ✅ DONE | `TransactionsTab.tsx`, `TransactionHistory.tsx` |
| FR-UI-4 | ✅ DONE | `/api/ledger/statement` |
| FR-UI-8 | ✅ DONE | `RecordRepaymentDrawer.tsx`, `RecordPaymentModal.tsx` |
| FR-UI-9 | ✅ DONE | `ApplyLateFeeModal.tsx` |
| FR-UI-10 | ✅ DONE | `WaiveFeeDrawer.tsx`, `WaiveFeeModal.tsx` |
| FR-UI-11 | ✅ DONE | `WriteOffRequestDrawer.tsx`, `WriteOffModal.tsx` |
| FR-UI-12 | ✅ DONE | `AdjustmentModal.tsx` |

### Enhancement Required (Extend Existing)

| Frontend FR | Backend API | Existing | New Work |
|-------------|-------------|----------|----------|
| FR-UI-5 | `GetScheduleWithStatus` | `RepaymentScheduleList.tsx` | Add instalment status badges |
| FR-UI-6 | `SearchAccounts` | CommandPalette search | Add new gRPC endpoint |
| FR-UI-7 | `BatchAccountQuery` | None | Add batch lookup panel |

### New Components Required

| Frontend FR | Backend API | UI Component | Epic |
|-------------|-------------|--------------|------|
| FR-UI-13 | `GetAccountAging` | `AgingStatusCard.tsx` | Epic 2 |
| FR-UI-14 | `GetOverdueAccounts` | `OverdueQueue.tsx` | Epic 1 |
| FR-UI-15 | `GetOverdueAccounts` | Filter/sort UI | Epic 1 |
| FR-UI-16 | N/A | Navigation action | Epic 1 |
| FR-UI-17 | `GetAccruedYield` | `YieldSummary.tsx` | Epic 2 |
| FR-UI-18 | `GetAccrualEventHistory` | `AccrualTimeline.tsx` | Epic 2 |
| FR-UI-19 | `GetAccruedYield` | Date picker query | Epic 2 |
| FR-UI-20 | `GetAccruedYield` | Calculation breakdown | Epic 2 |
| FR-UI-21 | `GetECLAllowance` | `ECLDetailView.tsx` | Epic 2 |
| FR-UI-22 | `GetPortfolioECL` | `PortfolioDashboard.tsx` | Epic 1 |
| FR-UI-23 | `GetECLConfig`, `UpdateOverlayMultiplier`, `UpdatePDRate` | `ECLConfigPanel.tsx` | Epic 4 |
| FR-UI-24 | `GetECLConfigHistory` | `ConfigHistory.tsx` | Epic 4 |
| FR-UI-25 | `ScheduleECLConfigChange` | `ScheduleChangeForm.tsx` | Epic 4 |
| FR-UI-26 | `GetPendingConfigChanges` | `PendingChangesList.tsx` | Epic 4 |
| FR-UI-27 | `CancelPendingConfigChange` | Action button | Epic 4 |
| FR-UI-28 | `TriggerPortfolioECLRecalculation` | `RecalcModal.tsx` | Epic 4 |
| FR-UI-29 | `TriggerBulkECLRecalculation` | `BulkRecalcModal.tsx` | Epic 4 |
| FR-UI-30 | `PreviewPeriodClose` | `ECLMovementAnalysis.tsx` | Epic 3 |
| FR-UI-31 | `PreviewPeriodClose` | `PeriodCloseWizard.tsx` | Epic 3 |
| FR-UI-32 | `PreviewPeriodClose` | Preview dashboard | Epic 3 |
| FR-UI-33 | `AcknowledgeAnomaly` | Anomaly review panel | Epic 3 |
| FR-UI-34 | `PreviewPeriodClose` | Movement analysis | Epic 3 |
| FR-UI-35 | `FinalizePeriodClose` | Finalize button | Epic 3 |
| FR-UI-36 | `GetPeriodClose`, `GetClosedPeriods` | `CloseHistory.tsx` | Epic 3 |
| FR-UI-37 | `FinalizePeriodClose` | Journal entries view | Epic 3 |
| FR-UI-38 | `CreateExportJob` | `ExportWizard.tsx` | Epic 5 |
| FR-UI-39 | `CreateExportJob` | Format selector | Epic 5 |
| FR-UI-40 | `GetExportStatus` | `ExportJobStatus.tsx` | Epic 5 |
| FR-UI-41 | `GetExportResult` | Download action | Epic 5 |
| FR-UI-42 | `RetryExport` | Retry action | Epic 5 |
| FR-UI-43 | `ListExportJobs` | `ExportHistory.tsx` | Epic 5 |
| FR-UI-44 | `GetEventHistory` | `EventTimeline.tsx` | Epic 6 |
| FR-UI-45 | `TraceECLToSource` | `ECLDrilldown.tsx` | Epic 6 |
| FR-UI-46 | `TraceAccruedYieldToSource` | `YieldDrilldown.tsx` | Epic 6 |
| FR-UI-47 | `SearchAccounts` | Enhanced search | Epic 6 |
| FR-UI-48 | `BatchAccountQuery` | `BatchQueryPanel.tsx` | Epic 6 |
| FR-UI-49 | `GenerateRandomSample` | `SamplingTool.tsx` | Epic 6 |
| FR-UI-50 | `GetCarryingAmountBreakdown` | `CarryingAmountBreakdown.tsx` | Epic 2 |
| FR-UI-51 | `GetEventProcessingStatus` | `SystemStatusDashboard.tsx` | Epic 1 |
| FR-UI-52 | `GetEventProcessingStatus` | Stream status panel | Epic 1 |

---

## Epic List

### Epic 0: gRPC Client & API Foundation
**Goal:** Extend gRPC client with all new backend methods and create API route layer

Before any UI work can begin, we must:
1. Update `proto/accounting_ledger.proto` with new service methods
2. Extend `src/server/grpc-client.ts` with typed methods for 35 new RPCs
3. Create API routes in `src/app/api/` for new endpoints

**Scope:**
- Copy updated proto from billie-platform-services
- Add TypeScript interfaces for all new message types
- Implement client methods for each new RPC
- Create ~25 new API routes

**Dependencies:** None (foundational)

**Stories:** 3-5 stories covering proto update, client extension, API routes by domain

---

### Epic 1: Portfolio Dashboard & Collections Queue
**Goal:** Finance and Collections can view portfolio health and manage overdue accounts

Provides executive-level visibility into portfolio ECL by bucket, total receivables, and system health. Collections can efficiently triage and manage overdue accounts.

**FRs covered:** FR-UI-14, FR-UI-15, FR-UI-16, FR-UI-22, FR-UI-51, FR-UI-52

**NFRs covered:** NFR-UI-P2, NFR-UI-P3, NFR-UI-U5

**New Components:**
- `PortfolioDashboard.tsx` - Main dashboard with ECL breakdown
- `OverdueQueue.tsx` - Paginated list of overdue accounts
- `SystemStatusPanel.tsx` - Event processing health indicator
- Dashboard enhancement - Add portfolio widgets to existing dashboard

**Dependencies:** Epic 0 (gRPC client)

---

### Epic 2: Enhanced Account Detail (Aging, Yield, ECL)
**Goal:** Staff can see complete account picture including aging, accrued yield, and ECL

Extends existing account detail view with new tabs/panels for aging status, revenue recognition, and ECL allowance with full traceability.

**FRs covered:** FR-UI-5, FR-UI-13, FR-UI-17, FR-UI-18, FR-UI-19, FR-UI-20, FR-UI-21, FR-UI-50

**NFRs covered:** NFR-UI-P1, NFR-UI-P2, NFR-UI-C1

**New Components:**
- `AgingStatusCard.tsx` - DPD, bucket, overdue amount
- `AccrualTab.tsx` - Yield summary and calculation breakdown
- `ECLTab.tsx` - ECL allowance and trace
- `CarryingAmountBreakdown.tsx` - Detailed breakdown for audit
- Enhancement to `RepaymentScheduleList.tsx` - Add instalment status

**Dependencies:** Epic 0 (gRPC client)

---

### Epic 3: Period-End Close Wizard
**Goal:** Operations and Finance can complete period-end close with preview and validation

Multi-step wizard guides users through preview, anomaly review, and finalization with full visibility into ECL movement and generated journals.

**FRs covered:** FR-UI-30, FR-UI-31, FR-UI-32, FR-UI-33, FR-UI-34, FR-UI-35, FR-UI-36, FR-UI-37

**NFRs covered:** NFR-UI-U2, NFR-UI-U3, NFR-UI-C2

**New Components:**
- `PeriodCloseWizard.tsx` - Multi-step wizard container
- `PreviewStep.tsx` - Preview with totals and anomalies
- `AnomalyReviewStep.tsx` - Review and acknowledge anomalies
- `ECLMovementAnalysis.tsx` - Prior vs current comparison
- `FinalizeStep.tsx` - Confirmation and finalization
- `CloseHistory.tsx` - Past period closes
- `JournalEntriesView.tsx` - Generated journal entries

**Dependencies:** Epic 0 (gRPC client), Epic 2 (ECL display)

---

### Epic 4: ECL Configuration Management
**Goal:** Finance Admin can manage ECL parameters with full audit trail

Complete configuration panel for overlay multiplier, PD rates, scheduled changes, and configuration history.

**FRs covered:** FR-UI-23, FR-UI-24, FR-UI-25, FR-UI-26, FR-UI-27, FR-UI-28, FR-UI-29

**NFRs covered:** NFR-UI-U3, NFR-UI-A1

**New Components:**
- `ECLConfigPanel.tsx` - Main config view
- `OverlayEditor.tsx` - Edit overlay multiplier
- `PDRateEditor.tsx` - Edit PD rates by bucket
- `ScheduleChangeForm.tsx` - Schedule future changes
- `PendingChangesList.tsx` - View/cancel pending changes
- `ConfigHistory.tsx` - Audit trail of changes
- `RecalcModal.tsx` - Trigger portfolio recalc
- `BulkRecalcModal.tsx` - Selective account recalc

**Dependencies:** Epic 0 (gRPC client)

---

### Epic 5: Export Center
**Goal:** Finance and Auditors can export data for external systems and audit purposes

Unified export interface for journal entries (Xero format), audit trails, and methodology documentation with job management.

**FRs covered:** FR-UI-38, FR-UI-39, FR-UI-40, FR-UI-41, FR-UI-42, FR-UI-43

**NFRs covered:** NFR-UI-P4, NFR-UI-U2

**New Components:**
- `ExportCenter.tsx` - Main export view
- `ExportWizard.tsx` - Create export wizard
- `ExportJobsList.tsx` - Active/completed jobs
- `ExportProgress.tsx` - Real-time progress
- Download action handlers

**Dependencies:** Epic 0 (gRPC client)

---

### Epic 6: Investigation & Traceability Tools
**Goal:** Engineering and Auditors can trace any value back to source events

Comprehensive investigation tools including event timeline, ECL/yield drilldown, batch queries, and random sampling.

**FRs covered:** FR-UI-44, FR-UI-45, FR-UI-46, FR-UI-47, FR-UI-48, FR-UI-49

**NFRs covered:** NFR-UI-P3, NFR-UI-C3

**New Components:**
- `InvestigationView.tsx` - Main investigation dashboard
- `EventTimeline.tsx` - Full event history
- `ECLDrilldown.tsx` - Trace ECL to source
- `YieldDrilldown.tsx` - Trace yield to source
- `BatchQueryPanel.tsx` - Multi-account queries
- `SamplingTool.tsx` - Random sample generation
- Enhanced search integration

**Dependencies:** Epic 0 (gRPC client), Epic 2 (account detail)

---

## Cross-Cutting Acceptance Criteria

The following requirements apply as acceptance criteria on ALL stories:

| Requirement | Acceptance Criteria |
|-------------|---------------------|
| NFR-UI-C1 | Component follows Payload CMS design patterns |
| NFR-UI-C2 | View integrates with existing navigation |
| NFR-UI-U4 | Financial values formatted consistently |
| NFR-UI-A1 | All interactive elements have focus states |
| Optimistic UI | Write actions show immediate feedback |
| Error Handling | Failures show clear recovery options |

---

## Implementation Priority

Based on dependencies and business value:

| Priority | Epic | Rationale |
|----------|------|-----------|
| P0 | Epic 0: gRPC Foundation | Blocking - all other work depends on this |
| P1 | Epic 2: Enhanced Account Detail | High value, extends existing UI |
| P1 | Epic 1: Portfolio Dashboard | High visibility, management requirement |
| P2 | Epic 3: Period-End Close | Critical for month-end process |
| P2 | Epic 4: ECL Configuration | Required for ECL management |
| P3 | Epic 5: Export Center | Integration with external systems |
| P3 | Epic 6: Investigation Tools | Audit and debugging support |

---

## Effort Estimates (High-Level)

| Epic | New Components | API Routes | Stories | T-Shirt |
|------|----------------|------------|---------|---------|
| Epic 0 | 0 | ~25 | 3-5 | M |
| Epic 1 | 4 | 4 | 6-8 | L |
| Epic 2 | 5 | 5 | 8-10 | L |
| Epic 3 | 7 | 5 | 8-10 | XL |
| Epic 4 | 8 | 8 | 10-12 | XL |
| Epic 5 | 4 | 5 | 5-7 | M |
| Epic 6 | 6 | 6 | 8-10 | L |
| **Total** | **34** | **~58** | **48-62** | - |

---

## Related Documents

- **UX Design:** [docs/ux-design/ledger-integration-ux.md](../docs/ux-design/ledger-integration-ux.md)
- **Existing UX Spec:** [docs/ux-design-specification.md](../docs/ux-design-specification.md)
- **Architecture:** [docs/architecture-billie-crm-web.md](../docs/architecture-billie-crm-web.md)

---

## Next Steps

1. ✅ Gap analysis complete
2. ✅ UX design for new features complete
3. ✅ Create detailed stories for all epics — see [stories.md](./stories.md)
4. ⏳ Review and confirm epic/story breakdown with stakeholders
5. ⏳ Begin implementation of Epic 0 (gRPC Foundation)
