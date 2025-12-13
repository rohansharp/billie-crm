# Story 2.2: Customer Profile & Identity Flags

**Status:** done

## Story

As a **support staff member**,
I want to see the customer's profile information and identity flags,
So that I know who I'm helping and any special considerations.

## Acceptance Criteria

1. **Given** I am on the ServicingView for a customer
   **When** the profile section loads
   **Then** I see: Full Name, Customer ID, Email, Phone, Address, Account Status

2. **Given** a customer has identity flags (e.g., "Staff", "Investor", "Vulnerable")
   **When** the profile displays
   **Then** flags appear as colored badges next to the customer name

3. **Given** a customer is marked as "Vulnerable"
   **When** viewing their profile
   **Then** a warning banner displays with handling guidelines

## Implementation Notes

**Already implemented in Story 2.1:**
- Full Name, Customer ID, Email, Phone, Address display
- Staff, Investor, Founder, Verified badges

**New for Story 2.2:**
- Add `vulnerableFlag` to Customer collection
- Add Vulnerable badge with special styling
- Add warning banner for vulnerable customers
- Add Date of Birth display
- Extract CustomerProfile to its own component file

## Tasks / Subtasks

- [x] **Task 1: Add vulnerableFlag to Customer collection** (AC: 2, 3)
  - [x] Add `vulnerableFlag` field to `src/collections/Customers.ts`
  - [x] Update `CustomerData` type in `src/hooks/queries/useCustomer.ts`

- [x] **Task 2: Extract CustomerProfile to dedicated component** (AC: 1)
  - [x] Create `src/components/ServicingView/CustomerProfile.tsx`
  - [x] Move CustomerProfile from ServicingView.tsx
  - [x] Add Date of Birth display
  - [x] Add more detailed address formatting

- [x] **Task 3: Add Vulnerable badge and warning banner** (AC: 2, 3)
  - [x] Add Vulnerable badge (red/warning color)
  - [x] Create VulnerableCustomerBanner component
  - [x] Display handling guidelines in banner
  - [x] Add banner styles to styles.module.css

- [x] **Task 4: Tests** (AC: 1, 2, 3)
  - [x] `tests/unit/ui/customer-profile.test.tsx` - 25 tests
  - [x] Test vulnerable badge display
  - [x] Test warning banner display
  - [x] Test address formatting fallback paths

## Dev Notes

### Vulnerable Customer Handling Guidelines

```
⚠️ Vulnerable Customer
This customer has been flagged as requiring additional care.
Please ensure all interactions are:
• Clear and jargon-free
• Patient and understanding
• Properly documented
```

### Badge Colors

| Badge | Background | Text |
|-------|------------|------|
| Verified | #dcfce7 | #166534 |
| Staff | #dbeafe | #1d4ed8 |
| Investor | #fef3c7 | #b45309 |
| Founder | #f3e8ff | #7c3aed |
| Vulnerable | #fee2e2 | #b91c1c |

### References

- [Source: docs/epics.md#Story 2.2]
- [Source: Story 2.1] (Existing profile implementation)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (Anthropic)

### Completion Notes

- All 3 acceptance criteria satisfied
- 25 new tests added for CustomerProfile and VulnerableCustomerBanner
- All 134 unit tests pass
- ESLint passes (with pre-existing warnings)
- Next.js build compiles successfully
- Extracted CustomerProfile to dedicated component
- Added vulnerableFlag to Customer collection
- Added Vulnerable badge with red styling
- Added VulnerableCustomerBanner with handling guidelines
- Added Date of Birth display with Australian date format
- Improved address formatting

### Files Created

1. `src/components/ServicingView/CustomerProfile.tsx` - Extracted profile component
2. `src/components/ServicingView/VulnerableCustomerBanner.tsx` - Warning banner
3. `tests/unit/ui/customer-profile.test.tsx` - 22 unit tests

### Files Modified

1. `src/collections/Customers.ts` - Added vulnerableFlag field
2. `src/hooks/queries/useCustomer.ts` - Added vulnerableFlag to CustomerData type
3. `src/components/ServicingView/ServicingView.tsx` - Imports extracted components, shows banner
4. `src/components/ServicingView/styles.module.css` - Added vulnerable badge and banner styles
5. `src/components/ServicingView/index.ts` - Export new components

### Change Log

- 2025-12-11: Initial implementation of Story 2.2 - Customer Profile & Identity Flags
- 2025-12-11: Code review fix - Added 3 tests for address formatting fallback paths

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5  
**Date:** 2025-12-11  
**Verdict:** ✅ APPROVED

### Findings

| Priority | Issue | Resolution |
|----------|-------|------------|
| LOW | Missing tests for address fallback formatting | ✅ Fixed - Added 3 tests covering partial address, null address, and parts-only formatting |

### Notes

- All 3 acceptance criteria satisfied
- Clean component extraction with proper typing
- Australian date format correctly applied
- Accessible banner with `role="alert"`
- 25 comprehensive unit tests
