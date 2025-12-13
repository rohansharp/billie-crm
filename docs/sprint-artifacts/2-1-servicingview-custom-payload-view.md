# Story 2.1: ServicingView Custom Payload View

**Status:** done

## Story

As a **support staff member**,
I want to navigate to a dedicated servicing page for a customer,
So that I can see all their information in one place.

## Acceptance Criteria

1. **Given** I am logged into Payload admin
   **When** I navigate to `/admin/servicing/:customerId`
   **Then** the ServicingView custom view renders within the Payload admin shell

2. **Given** the ServicingView loads
   **When** the customer data is being fetched
   **Then** skeleton loaders display for each section (profile, accounts, transactions)

3. **Given** the ServicingView URL contains an invalid customer ID
   **When** the page loads
   **Then** an error message displays "Customer not found" with a link back to search

4. **Given** the command palette (Epic 1) search results
   **When** I select a customer
   **Then** I am navigated to `/admin/servicing/{customerId}`

## Implementation Notes

**Custom View Registration:** Payload CMS allows registering custom views via `admin.views`. The ServicingView
will be registered as a standalone view at `/admin/servicing/:customerId`.

**Server Component Strategy:** Use Next.js App Router with server components for initial data fetch,
client components for interactive elements.

**Skeleton Pattern:** Use dedicated skeleton components that match the shape of content areas.

## Tasks / Subtasks

- [x] **Task 1: Register ServicingView as custom Payload view** (AC: 1)
  - [x] Create `src/app/(payload)/admin/servicing/[customerId]/page.tsx`
  - [x] Route automatically available via App Router (no config needed)
  - [x] Verify route renders within Payload admin context

- [x] **Task 2: Create ServicingView layout component** (AC: 1, 2)
  - [x] Create `src/components/ServicingView/ServicingView.tsx`
  - [x] Create layout with sections: CustomerProfile, LoanAccountsList, TransactionHistory
  - [x] Create `src/components/ServicingView/styles.module.css`
  - [x] Add responsive grid layout (single column mobile, multi-column desktop)

- [x] **Task 3: Create skeleton loader components** (AC: 2)
  - [x] Create `src/components/ui/Skeleton/Skeleton.tsx`
  - [x] Create `src/components/ui/Skeleton/styles.module.css`
  - [x] Create `src/components/ServicingView/CustomerProfileSkeleton.tsx`
  - [x] Create `src/components/ServicingView/LoanAccountsSkeleton.tsx`
  - [x] Create `src/components/ServicingView/TransactionsSkeleton.tsx`

- [x] **Task 4: Implement customer fetch with error handling** (AC: 2, 3)
  - [x] Create `src/hooks/queries/useCustomer.ts` - TanStack Query hook
  - [x] Fetch customer by `customerId` from Payload API
  - [x] Handle loading state (show skeletons)
  - [x] Handle error state (show "Customer not found" with dashboard link)

- [x] **Task 5: Connect command palette to navigation** (AC: 4)
  - [x] Update `GlobalCommandPalette` customer selection handler
  - [x] Use `next/navigation` router to navigate to `/admin/servicing/{customerId}`
  - [x] Loan account selection navigates to customer's servicing page

- [x] **Task 6: Tests** (AC: 1, 2, 3, 4)
  - [x] `tests/unit/ui/skeleton.test.tsx` - 13 tests
  - [x] `tests/unit/hooks/useCustomer.test.ts` - 9 tests
  - [x] `tests/int/servicing-view.int.spec.ts` - 8 tests

## Dev Notes

### Custom View Registration (Payload 3.x)

```typescript
// src/payload.config.ts
export default buildConfig({
  admin: {
    views: {
      ServicingView: {
        Component: '@/components/ServicingView#ServicingView',
        path: '/servicing/:customerId',
      },
    },
  },
})
```

### Route Structure

```
src/app/(payload)/admin/servicing/[customerId]/
├── page.tsx          # Server component entry point
└── layout.tsx        # Optional layout wrapper
```

### Skeleton Component Pattern

```typescript
// src/components/ui/Skeleton/Skeleton.tsx
interface SkeletonProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'rectangular' | 'circular'
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ ... }) => { ... }
```

### useCustomer Hook Pattern

```typescript
// src/hooks/queries/useCustomer.ts
export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => fetchCustomer(customerId),
    enabled: !!customerId,
    staleTime: 60_000, // 1 minute
  })
}
```

### Navigation from Command Palette

```typescript
// In GlobalCommandPalette
import { useRouter } from 'next/navigation'

const router = useRouter()

const handleSelectCustomer = useCallback((customerId: string) => {
  setCommandPaletteOpen(false)
  router.push(`/admin/servicing/${customerId}`)
}, [setCommandPaletteOpen, router])
```

### References

- [Source: docs/epics.md#Story 2.1]
- [Source: docs/project_context.md] (Custom Views, TanStack Query patterns)
- [Payload Docs: Custom Views](https://payloadcms.com/docs/admin/custom-views)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (Anthropic)

### Debug Log References

- Fixed pre-existing test failure in idempotency.test.ts (nanoid can contain `-`)

### Completion Notes

- All 4 acceptance criteria satisfied
- 30 new tests added (13 skeleton, 9 hook, 8 integration)
- All 215 tests pass
- Next.js build compiles successfully with `/admin/servicing/[customerId]` route
- ESLint passes (with pre-existing warnings)
- Command palette now navigates to ServicingView on customer/account selection
- Skeleton loaders display while fetching customer data
- Error state shows "Customer not found" with link back to dashboard
- Responsive grid layout (sidebar + main content)

### Files Created

1. `src/app/(payload)/admin/servicing/[customerId]/page.tsx` - Route entry point
2. `src/components/ServicingView/ServicingView.tsx` - Main view component
3. `src/components/ServicingView/styles.module.css` - Styles (220+ lines)
4. `src/components/ServicingView/index.ts` - Barrel export
5. `src/components/ServicingView/CustomerProfileSkeleton.tsx` - Profile skeleton
6. `src/components/ServicingView/LoanAccountsSkeleton.tsx` - Accounts skeleton
7. `src/components/ServicingView/TransactionsSkeleton.tsx` - Transactions skeleton
8. `src/components/ui/Skeleton/Skeleton.tsx` - Reusable skeleton component
9. `src/components/ui/Skeleton/styles.module.css` - Skeleton styles with shimmer
10. `src/components/ui/Skeleton/index.ts` - Barrel export
11. `src/hooks/queries/useCustomer.ts` - TanStack Query hook
12. `tests/unit/ui/skeleton.test.tsx` - 13 tests
13. `tests/unit/hooks/useCustomer.test.ts` - 9 tests
14. `tests/int/servicing-view.int.spec.ts` - 8 tests

### Files Modified

1. `src/providers/index.tsx` - Navigation to ServicingView on selection
2. `src/hooks/queries/index.ts` - Export useCustomer
3. `src/hooks/index.ts` - Export useCustomer
4. `src/components/ui/index.ts` - Export Skeleton components
5. `tests/unit/lib/idempotency.test.ts` - Fixed flaky test

### Change Log

- 2025-12-11: Initial implementation of Story 2.1 - ServicingView
- 2025-12-11: Code review fixes - replaced inline styles with CSS class, added search hint to error page

---

## Senior Developer Review (AI)

### Review Date: 2025-12-11

### Findings Summary

| Severity | Issue | Resolution |
|----------|-------|------------|
| LOW | Inline styles in placeholder components | ✅ Fixed: Added `.placeholderText` CSS class |
| LOW | Error link doesn't mention search | ✅ Fixed: Added "Press ⌘K to search" hint |

### Fixes Applied

1. **Placeholder styles** - Replaced inline `style` props with `.placeholderText` CSS class
2. **Error hint** - Added "Press ⌘K to search for another customer" below dashboard link

### Verification

- All 215 tests pass
- ESLint clean
- Build compiles successfully

### Approval

✅ **APPROVED** - Story 2.1 complete
