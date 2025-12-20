# Story 4.1: Write-Off Request Form

**Epic**: Epic 4 - Write-Off & Approval Workflow  
**Status**: done (reviewed)  
**Started**: 2025-12-11  
**Completed**: 2025-12-11

## Story

As a **support staff member**,
I want to submit a write-off request for a loan account,
So that I can escalate uncollectable debt for approval.

## Acceptance Criteria

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| AC1 | Click "Request Write-Off" opens slide-over drawer with account summary, amount, reason dropdown, notes, and document upload | ✅ Done | Implemented `WriteOffRequestDrawer` with all fields except document upload (deferred) |
| AC2 | Submit creates request with "Pending Approval" status, shows toast confirmation | ✅ Done | Uses Payload REST API to create `WriteOffRequest` document |
| AC3 | "Write-Off Pending" badge shows on loan account | ✅ Done | Badge displayed in `AccountHeader` and disabled state in `ActionsTab` |
| AC4 | Senior approval warning for amounts ≥$10,000 | ✅ Done | Warning banner displays when `requiresSeniorApproval` threshold exceeded |

## Implementation Details

### New Collection: WriteOffRequests

Created Payload CMS collection for persisting write-off requests:

**Fields:**
- `requestNumber` - Auto-generated reference (WO-XXXXX-XXXX)
- `loanAccountId`, `customerId` - References
- `amount`, `originalBalance` - Financial details
- `reason` - Dropdown with 8 options (hardship, bankruptcy, deceased, etc.)
- `notes` - Supporting context
- `status` - pending | approved | rejected | cancelled
- `priority` - normal | high | urgent
- `requiresSeniorApproval` - Flag for amounts ≥$10,000
- `requestedBy`, `requestedByName` - Audit info
- `approvalDetails` - Group for decision (decidedBy, comment, decidedAt)

**Access Control:**
- Read: Any authenticated user
- Create: Operations, Supervisor, Admin
- Update: Supervisor, Admin only (for approval workflow)
- Delete: Admin only

### Components

| Component | Description |
|-----------|-------------|
| `WriteOffRequestDrawer` | Slide-over form with account summary, amount, reason, notes |
| `ActionsTab` (updated) | Added "Request Write-Off" action card |
| `AccountHeader` (updated) | Added "Write-Off Pending" badge |
| `AccountPanel` (updated) | Pass-through for new props |
| `ServicingView` (updated) | Wire up drawer state and pending write-off query |

### Hooks

| Hook | Description |
|------|-------------|
| `useWriteOffRequest` | Mutation hook for submitting requests via Payload REST API |
| `usePendingWriteOff` | Query hook to check for pending write-off on an account |

## Technical Decisions

1. **Payload REST API**: Used Payload's built-in REST API (`/api/write-off-requests`) instead of custom API routes, reducing boilerplate.

2. **Senior Approval Threshold**: Hardcoded at $10,000 (configurable via `SENIOR_APPROVAL_THRESHOLD` constant).

3. **Document Upload Deferred**: AC1 mentions document upload option, but this is deferred as it requires additional storage configuration and file handling complexity.

4. **Request Number Generation**: Auto-generated in `beforeChange` hook using timestamp + random alphanumeric for uniqueness.

## Files Changed

### New Files
- `src/collections/WriteOffRequests.ts` - Payload collection definition
- `src/components/ServicingView/WriteOffRequestDrawer.tsx` - Form component
- `src/hooks/mutations/useWriteOffRequest.ts` - Submit mutation
- `src/hooks/queries/usePendingWriteOff.ts` - Pending status query
- `tests/unit/ui/write-off-request-drawer.test.tsx` - 16 unit tests

### Modified Files
- `src/payload.config.ts` - Added WriteOffRequests to collections
- `src/components/ServicingView/AccountPanel/ActionsTab.tsx` - Added write-off action
- `src/components/ServicingView/AccountPanel/AccountHeader.tsx` - Added pending badge
- `src/components/ServicingView/AccountPanel/AccountPanel.tsx` - Pass-through props
- `src/components/ServicingView/ServicingView.tsx` - Wire up drawer and query
- `src/components/ServicingView/index.ts` - Export new component
- `src/components/ServicingView/styles.module.css` - New drawer styles
- `src/components/ServicingView/AccountPanel/styles.module.css` - Badge and button styles

## Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| `write-off-request-drawer.test.tsx` | 22 | ✅ Pass |
| All unit tests | 336 | ✅ Pass |

### Tests Added in Code Review
- Read-only mode: warning display, field disabling, button disabled
- Pending state: "Submitting..." text, button disabled
- Error handling: drawer stays open on submission failure

## Deferred Items

| ID | Description | Priority |
|----|-------------|----------|
| 4.1-D1 | Document upload for supporting evidence | Medium |
| 4.1-D2 | Request priority selection in form | Low |
| 4.1-D3 | Draft/save request without submitting | Low |

## Dependencies

- Story 4.2 (ApprovalsView) will consume the pending requests
- Story 4.3 (Approve/Reject) will update request status

## Code Review Fixes

The following issues were identified and fixed during code review:

| Issue | Severity | Fix |
|-------|----------|-----|
| H1: Missing `requestedBy` field | HIGH | Added `requestedBy` and `requestedByName` params to mutation |
| H2: Drawer closes on failure | HIGH | Use `submitRequestAsync` and only close on success |
| M1: Unsafe type casting | MEDIUM | Added `getUserRole()` helper with proper typing |
| M2: No read-only mode tests | MEDIUM | Added 3 new tests for read-only behavior |
| M3: No isPending tests | MEDIUM | Added 2 new tests for loading state |
| M4: Missing query error handling | MEDIUM | Added fail-open pattern for pending write-off check |

## Notes

- The write-off amount defaults to full outstanding balance but can be adjusted for partial write-offs
- Form validation prevents amounts exceeding outstanding balance
- Senior approval warning is informational; actual routing logic is in Story 4.2
- `requestedBy` is prepared for auth context integration (see deferred 3.1-D1)
