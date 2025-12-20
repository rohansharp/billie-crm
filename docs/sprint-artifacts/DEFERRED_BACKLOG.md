# Deferred Items Backlog

This file tracks items identified during code reviews that were deferred for future implementation.

---

## Epic 1: Global Search & Foundation

### Story 1.4: Loan Account & Transaction Search
| ID | Item | Priority | Notes |
|----|------|----------|-------|
| 1.4-D1 | Improve `useLoanAccountSearch.test.ts` behavior tests | Low | Tests verify types compile, not actual hook behavior |

---

## Epic 2: Single Customer View

### Story 2.1: ServicingView Custom Payload View
| ID | Item | Priority | Notes |
|----|------|----------|-------|
| 2.1-D1 | Loading integration test for ServicingView | Low | Covered by unit tests of sub-components |

### Story 2.3: Loan Accounts List with Live Balances
| ID | Item | Priority | Notes |
|----|------|----------|-------|
| 2.3-D1 | Display "Product Type" in LoanAccountCard | Low | Data model gap - field not available |

---

## Epic 3: Financial Actions (Optimistic UI)

### Story 3.1: Waive Fee Action with Optimistic UI
| ID | Item | Priority | Notes |
|----|------|----------|-------|
| 3.1-D1 | Auth context integration for `approvedBy` | Medium | Currently hardcoded as `'current-user'` |
| 3.1-D2 | Behavior-focused mutation hook tests | Low | Tests verify types, not actual mutation flow |

### Story 3.2: Record Repayment Action with Optimistic UI
| ID | Item | Priority | Notes |
|----|------|----------|-------|
| 3.2-D1 | Date field for backdating payments | Low | AC mentioned "Date field (default today)"; uses server timestamp |
| 3.2-D2 | Pass notes field to API | Low | Form captures notes but API only accepts paymentReference |

### Story 3.3: Idempotency & Duplicate Prevention
| ID | Item | Priority | Notes |
|----|------|----------|-------|
| 3.3-D1 | Server-side idempotency (AC2) | Medium | API routes need to accept/process idempotency keys |
| 3.3-D2 | Retry with same key (AC4) | Medium | Requires 3.3-D1; currently retries are fresh requests |
| 3.3-D3 | Zustand selector optimization | Low | `LoanAccountDetails` could use direct selector for better reactivity |

### Story 3.4: Bulk Fee Waiver
| ID | Item | Priority | Notes |
|----|------|----------|-------|
| 3.4-D1 | Fee type badge differentiation | Low | All fees use same style; could differentiate DISHONOUR_FEE |
| 3.4-D2 | Auto-exit selection mode on success | Low | Selections clear but stays in selection mode |
| 3.4-D3 | Individual fee waiver API | Medium | API only supports total amount; can't target specific fee transactions |

---

## Epic 4: Write-Off & Approval Workflow

### Story 4.1: Write-Off Request Form
| ID | Item | Priority | Notes |
|----|------|----------|-------|
| 4.1-D1 | Document upload for supporting evidence | Medium | AC1 mentions document upload; requires storage config |
| 4.1-D2 | Request priority selection in form | Low | Form only shows "Normal"; priority field exists in collection |
| 4.1-D3 | Draft/save request without submitting | Low | Future enhancement for complex requests |

---

## Summary by Priority

### Medium Priority
- **3.1-D1**: Auth context for `approvedBy` in waive fee (and record repayment)
- **3.3-D1**: Server-side idempotency (API acceptance of idempotency keys)
- **3.3-D2**: Retry with same idempotency key (requires 3.3-D1)
- **4.1-D1**: Document upload for write-off supporting evidence

### Low Priority
- 1.4-D1: Hook behavior tests
- 2.1-D1: Loading integration test
- 2.3-D1: Product Type display
- 3.1-D2: Mutation behavior tests
- 3.2-D1: Date field for backdating
- 3.2-D2: Notes field to API
- 3.3-D3: Zustand selector optimization
- 3.4-D1: Fee type badge differentiation
- 3.4-D2: Auto-exit selection mode on success

---

*Last updated: Story 4.1 completion*
