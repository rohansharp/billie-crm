# Story 6.3: Breadcrumb Navigation

**Status:** done

---

## Story

As a **support staff member**,
I want to see breadcrumbs showing my location in the application,
So that I can understand the page hierarchy and navigate back easily.

---

## Background

Breadcrumbs provide visual navigation context, showing users where they are in the application hierarchy and allowing quick navigation back to parent pages.

### Page Hierarchy

```
Dashboard (/)
├── Approvals (/admin/approvals)
└── Servicing
    └── Customer (/admin/servicing/[customerId])
```

---

## Acceptance Criteria

### Root Page

**AC1: No breadcrumbs on Dashboard**
```gherkin
Given I am on the Dashboard (/admin/dashboard)
When viewing the page header
Then no breadcrumb is displayed (root page)
```

### Customer Servicing

**AC2: Breadcrumbs on ServicingView**
```gherkin
Given I am on ServicingView for customer "John Smith" (CUST-001)
When viewing breadcrumbs
Then I see: "🏠 › Customer CUST-001 › John Smith"
```

### Approvals

**AC3: Breadcrumbs on ApprovalsView**
```gherkin
Given I am on ApprovalsView
When viewing breadcrumbs
Then I see: "🏠 › Approvals"
```

### Navigation

**AC4: Home navigation**
```gherkin
Given I click "🏠" in the breadcrumb
When the click is processed
Then I navigate to /admin/dashboard
```

### Current Page Styling

**AC5: Current page is not a link**
```gherkin
Given I am viewing a nested page
When the breadcrumb displays
Then the current page name is bold and not a link
```

---

## Tasks / Subtasks

- [x] **Task 1: Create Breadcrumb component**
  - [x] 1.1 Create `src/components/Breadcrumb/index.tsx`
  - [x] 1.2 Create `src/components/Breadcrumb/styles.module.css`
  - [x] 1.3 Accept `items` array prop with label and href
  - [x] 1.4 Render home icon (🏠) as first item with link to dashboard
  - [x] 1.5 Style current page (bold, not a link, aria-current="page")

- [x] **Task 2: Add to ServicingView**
  - [x] 2.1 Pass customer ID and name to breadcrumb
  - [x] 2.2 Position at top of page (replaced old breadcrumb div)

- [x] **Task 3: Add to ApprovalsView**
  - [x] 3.1 Add simple "Approvals" breadcrumb

- [x] **Task 4: Write unit tests** (17 tests)
  - [x] 4.1 Test rendering with empty, single, and multiple items
  - [x] 4.2 Test home link navigation to /admin/dashboard
  - [x] 4.3 Test current page styling (span, bold, aria-current)
  - [x] 4.4 Test accessibility (aria-label, aria-hidden)
  - [x] 4.5 Test real-world scenarios (Dashboard, Approvals, ServicingView)
  - [x] 4.6 Test aria-current only applies to last item

---

## Dev Notes

### Breadcrumb Item Interface

```typescript
interface BreadcrumbItem {
  label: string
  href?: string  // If undefined, this is the current page
}
```

### Usage Examples

```tsx
// On Dashboard - no breadcrumbs rendered
<Breadcrumb items={[]} />

// On Approvals
<Breadcrumb items={[
  { label: 'Approvals' }  // No href = current page
]} />

// On ServicingView
<Breadcrumb items={[
  { label: `Customer ${customerId}`, href: `/admin/servicing/${customerId}` },
  { label: customerName }  // No href = current page
]} />
```

### Styling

- Home icon: 🏠 (house emoji)
- Separator: › (right angle bracket)
- Current page: Bold text, no underline, not a link
- Links: Underline on hover

---

## References

- [Source: docs/epics.md - Story 6.3 definition]

---

## Dev Agent Record

### Context Reference

Story: 6.3 Breadcrumb Navigation
Epic: 6 - Navigation UX

### Agent Model Used

Claude Opus 4.5

### Completion Notes

**Implementation completed 2025-12-11**

- Created reusable Breadcrumb component with proper accessibility
- Integrated into ServicingView and ApprovalsView
- All 925 tests passing (17 new tests for breadcrumb)

**Component Features:**
1. Renders home icon (🏠) linking to dashboard
2. Separator (›) between items
3. Current page styled bold and not a link
4. Proper ARIA attributes for accessibility (`aria-current="page"` only on last item)
5. Responsive styling for mobile

**Code Review Fixes (2025-12-11):**
- Fixed `aria-current="page"` to only apply to last item (accessibility bug)
- Updated ServicingView loading state to use Breadcrumb component for consistency
- Added test for aria-current behavior

### File List

**New Files:**
- `src/components/Breadcrumb/index.tsx` - Reusable component
- `src/components/Breadcrumb/styles.module.css` - Styling
- `tests/unit/ui/breadcrumb.test.tsx` - 16 unit tests

**Modified Files:**
- `src/components/ServicingView/ServicingView.tsx` - Added breadcrumb
- `src/components/ApprovalsView/ApprovalsView.tsx` - Added breadcrumb
