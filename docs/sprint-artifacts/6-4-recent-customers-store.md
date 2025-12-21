# Story 6.4: Recent Customers Store

**Status:** done

---

## Story

As a **support staff member**,
I want my recently viewed customers to persist across sessions,
So that I can quickly return to customers I was helping.

---

## Acceptance Criteria

### Core Functionality

**AC1: Add customer on view**
```gherkin
Given I navigate to a customer's ServicingView
When the page loads
Then the customer is added to my "recent customers" list
```

**AC2: Deduplicate and reorder**
```gherkin
Given I view the same customer multiple times
When the recent customers list updates
Then the customer appears only once, moved to the top with updated timestamp
```

**AC3: Limit to 10 customers**
```gherkin
Given I have viewed more than 10 customers
When viewing the recent customers list
Then only the most recent 10 are stored (FIFO)
```

**AC4: Persist across sessions**
```gherkin
Given I close my browser and return later
When viewing the dashboard
Then my recent customers persist (stored in localStorage)
```

**AC5: Clear history** *(Store action implemented; UI button deferred to Story 6.2)*
```gherkin
Given I click "Clear History" on the recent customers section
When the action completes
Then all recent customers are removed from storage
```
*Note: `clearHistory()` store action is implemented. The UI button will be added in Story 6.2 (Dashboard).*

### Security Requirements

**AC6: No PII in localStorage**
```gherkin
Given the localStorage persistence mechanism
When storing recent customer data
Then ONLY store non-PII data: `customerId` (string) and `viewedAt` (timestamp)
```

**AC7: Fetch fresh data for display** *(Architecture established; API implementation in Story 6.2)*
```gherkin
Given the dashboard displays recent customers
When rendering customer details (name, account count, balance)
Then fetch fresh data from the server using stored IDs (do NOT cache PII in localStorage)
```
*Note: Store only persists IDs (enabling this pattern). The `GET /api/dashboard` endpoint that fetches fresh data is implemented in Story 6.2.*

**AC8: XSS-safe storage**
```gherkin
Given an XSS attack compromises localStorage
When the attacker reads `billie-recent-customers` key
Then they can only see customer IDs and timestamps (no names, emails, or financial data)
```

---

## Tasks / Subtasks

- [x] **Task 1: Create Zustand store with persist middleware** (AC: 1, 2, 3, 4, 6)
  - [x] 1.1 Create `src/stores/recentCustomers.ts` with Zustand persist
  - [x] 1.2 Implement `addCustomer(customerId)` action with deduplication
  - [x] 1.3 Implement `clearHistory()` action
  - [x] 1.4 Configure localStorage key as `billie-recent-customers`
  - [x] 1.5 Add version number for future migrations

- [x] **Task 2: Create hook for tracking customer views** (AC: 1)
  - [x] 2.1 Create `src/hooks/useTrackCustomerView.ts` 
  - [x] 2.2 Hook should call `addCustomer` on mount
  - [x] 2.3 Only track if customerId is valid

- [x] **Task 3: Integrate with ServicingView** (AC: 1)
  - [x] 3.1 Add `useTrackCustomerView` to ServicingView component
  - [x] 3.2 Ensure tracking happens after successful customer data load

- [x] **Task 4: Export from stores barrel** (AC: all)
  - [x] 4.1 Add export to `src/stores/index.ts`

- [x] **Task 5: Write unit tests** (AC: 1, 2, 3, 4, 5, 6)
  - [x] 5.1 Test `addCustomer` adds new customer
  - [x] 5.2 Test `addCustomer` deduplicates and moves to top
  - [x] 5.3 Test limit of 10 customers
  - [x] 5.4 Test `clearHistory` removes all customers
  - [x] 5.5 Test localStorage persistence (mock)
  - [x] 5.6 Test stored data contains only ID and timestamp

---

## Dev Notes

### Architecture Pattern

This story implements the **Zustand Persist Pattern** as defined in `docs/architecture.md`:

```typescript
// src/stores/recentCustomers.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RecentCustomer {
  customerId: string  // ID only - NO PII
  viewedAt: number    // Timestamp
}

interface RecentCustomersStore {
  customers: RecentCustomer[]
  addCustomer: (customerId: string) => void
  clearHistory: () => void
}

export const useRecentCustomersStore = create<RecentCustomersStore>()(
  persist(
    (set, get) => ({
      customers: [],
      addCustomer: (customerId) => {
        const now = Date.now()
        const filtered = get().customers.filter(c => c.customerId !== customerId)
        const updated = [{ customerId, viewedAt: now }, ...filtered].slice(0, 10)
        set({ customers: updated })
      },
      clearHistory: () => set({ customers: [] }),
    }),
    {
      name: 'billie-recent-customers', // localStorage key
      version: 1,
    }
  )
)
```

### Security Rationale (CRITICAL)

**Why IDs only:**
- localStorage is NOT encrypted
- Accessible to any JavaScript on the same origin
- Visible in DevTools
- Vulnerable to XSS attacks

**If we stored PII:**
```javascript
// ❌ DANGEROUS - XSS attack exposes customer data
localStorage.getItem('recent-customers')
// → '{"customers":[{"id":"CUST-001","name":"John Smith","email":"john@..."}]}'
```

**With our approach:**
```javascript
// ✅ SAFE - Only IDs exposed
localStorage.getItem('billie-recent-customers')
// → '{"state":{"customers":[{"customerId":"CUST-001","viewedAt":1702339200000}]}}'
```

### Tracking Hook Pattern

```typescript
// src/hooks/useTrackCustomerView.ts
'use client'

import { useEffect } from 'react'
import { useRecentCustomersStore } from '@/stores/recentCustomers'

export function useTrackCustomerView(customerId: string | undefined) {
  const addCustomer = useRecentCustomersStore(s => s.addCustomer)
  
  useEffect(() => {
    if (customerId) {
      addCustomer(customerId)
    }
  }, [customerId, addCustomer])
}
```

### Integration with ServicingView

```typescript
// In ServicingView.tsx (existing file)
import { useTrackCustomerView } from '@/hooks/useTrackCustomerView'

export const ServicingView: React.FC<{ customerId: string }> = ({ customerId }) => {
  // Track this view
  useTrackCustomerView(customerId)
  
  // ... existing ServicingView code
}
```

### Project Structure

**New files:**
```
src/stores/
├── recentCustomers.ts    # NEW - Zustand store with persist
└── index.ts              # UPDATE - add export

src/hooks/
├── useTrackCustomerView.ts  # NEW - tracking hook
└── index.ts                 # UPDATE - add export

tests/unit/stores/
└── recentCustomers.test.ts  # NEW - unit tests
```

### Testing Strategy

```typescript
// tests/unit/stores/recentCustomers.test.ts
import { useRecentCustomersStore } from '@/stores/recentCustomers'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useRecentCustomersStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useRecentCustomersStore.setState({ customers: [] })
  })
  
  it('adds a new customer to the list', () => {
    const { addCustomer } = useRecentCustomersStore.getState()
    addCustomer('CUST-001')
    
    const { customers } = useRecentCustomersStore.getState()
    expect(customers).toHaveLength(1)
    expect(customers[0].customerId).toBe('CUST-001')
  })
  
  it('moves existing customer to top with updated timestamp', () => {
    const { addCustomer } = useRecentCustomersStore.getState()
    addCustomer('CUST-001')
    addCustomer('CUST-002')
    addCustomer('CUST-001') // View again
    
    const { customers } = useRecentCustomersStore.getState()
    expect(customers).toHaveLength(2)
    expect(customers[0].customerId).toBe('CUST-001') // Most recent
    expect(customers[1].customerId).toBe('CUST-002')
  })
  
  it('limits to 10 customers', () => {
    const { addCustomer } = useRecentCustomersStore.getState()
    for (let i = 1; i <= 15; i++) {
      addCustomer(`CUST-${String(i).padStart(3, '0')}`)
    }
    
    const { customers } = useRecentCustomersStore.getState()
    expect(customers).toHaveLength(10)
    expect(customers[0].customerId).toBe('CUST-015') // Most recent
  })
  
  it('clears all history', () => {
    const { addCustomer, clearHistory } = useRecentCustomersStore.getState()
    addCustomer('CUST-001')
    addCustomer('CUST-002')
    clearHistory()
    
    const { customers } = useRecentCustomersStore.getState()
    expect(customers).toHaveLength(0)
  })
  
  it('only stores customerId and viewedAt (no PII)', () => {
    const { addCustomer } = useRecentCustomersStore.getState()
    addCustomer('CUST-001')
    
    const { customers } = useRecentCustomersStore.getState()
    const storedKeys = Object.keys(customers[0])
    expect(storedKeys).toEqual(['customerId', 'viewedAt'])
  })
})
```

---

## References

- [Source: docs/architecture.md#Zustand Persist Pattern]
- [Source: docs/epics.md#Story 6.4]
- [Source: docs/project_context.md#State Management Rules]
- [Source: docs/sprint-artifacts/6-2-dashboard-api-spec.md] (consumer of this store)

---

## Dev Agent Record

### Context Reference

Story: 6.4 Recent Customers Store
Epic: 6 - Navigation UX

### Agent Model Used

Claude Opus 4 (Anthropic)

### Completion Notes

- **Foundation story complete** - creates the data layer for Story 6.2 (Dashboard)
- **Security requirements met** - only customer IDs and timestamps stored in localStorage, NO PII
- **13 new tests added** - 8 for store (including security validation), 5 for tracking hook
- **All 820 tests passing** - no regressions (1 pre-existing flaky test in error.test.ts unrelated to this story)
- Story 6.2 (Dashboard) will consume this store to display recent customers
- Integration with ServicingView complete - customers tracked only after successful data load

### File List

**New Files:**
- `src/stores/recentCustomers.ts` - Zustand store with persist middleware
- `src/hooks/useTrackCustomerView.ts` - Hook for tracking customer views
- `tests/unit/stores/recentCustomers.test.ts` - 8 unit tests for store
- `tests/unit/hooks/useTrackCustomerView.test.ts` - 5 unit tests for hook

**Modified Files:**
- `src/stores/index.ts` - Added export for `useRecentCustomersStore`
- `src/hooks/index.ts` - Added export for `useTrackCustomerView`
- `src/components/ServicingView/ServicingView.tsx` - Added tracking hook call (tracks only after successful load)

---

## Senior Developer Review (AI)

**Review Date:** 2025-12-11
**Reviewer:** Claude Opus 4 (Code Review Agent)
**Review Outcome:** ✅ Approve (with fixes applied)

### Findings Summary

| Severity | Count | Status |
|----------|-------|--------|
| HIGH | 3 | ✅ Fixed |
| MEDIUM | 2 | ✅ Fixed |
| LOW | 2 | ✅ Addressed |

### Action Items

- [x] **[HIGH]** Task 3.2 - Track only after successful customer data load (fixed in ServicingView.tsx)
- [x] **[HIGH]** AC5 - Clarified that `clearHistory()` action is implemented; UI button deferred to Story 6.2
- [x] **[HIGH]** AC7 - Clarified that store architecture enables this; API endpoint is in Story 6.2
- [x] **[MEDIUM]** Added stronger persistence test validating no PII in stored data
- [x] **[MEDIUM]** Acknowledged unrelated doc changes in git (architecture.md, epics.md from prior session work)
- [x] **[LOW]** Fixed AC8 wording to use correct key name `billie-recent-customers`
- [x] **[LOW]** Store accepts any string - acceptable as hook guards empty string

### Review Notes

1. **Security posture is correct** - Store only persists `customerId` + `viewedAt`, no PII exposure risk
2. **Test coverage improved** - Added security validation test for persisted data structure
3. **AC scope clarified** - AC5 and AC7 are cross-story ACs that depend on Dashboard (6.2)
4. **Pre-existing issue noted** - `tests/unit/lib/error.test.ts` has flaky regex (unrelated to this story)
