# Story 6.7: Role-Based Collection Visibility

**Status:** done

---

## Story

As a **system administrator**,
I want Payload's sidebar to show different collections based on user roles,
So that operational staff see a clean, task-focused interface while admins retain full system access.

---

## Background

Currently, all authenticated users see all Payload collections in the sidebar (Users, Customers, Loan Accounts, etc.). This is confusing for operational staff who should interact through our purpose-built views (ServicingView, ApprovalsView) rather than raw collection interfaces.

### Role Definitions

| Role | Description | Approval Authority |
|------|-------------|--------------------|
| **`operations`** | Day-to-day customer servicing staff | ❌ No |
| **`supervisor`** | Senior staff with approval authority | ✅ Yes |
| **`admin`** | System administrators | ✅ Yes |
| **`readonly`** | Audit/compliance observers | ❌ No |

---

## Acceptance Criteria

### Collection Visibility

**AC1: Hide collections from non-admin users**
```gherkin
Given I am logged in with role "operations" or "supervisor" or "readonly"
When the sidebar renders
Then I do NOT see Payload's default collection links (Users, Media, etc.)
And I only see our custom navigation items (Search, Dashboard, Approvals)
```

**AC2: Admin users see all collections**
```gherkin
Given I am logged in with role "admin"
When the sidebar renders
Then I see all Payload collection links (Users, Customers, Loan Accounts, etc.)
And I see our custom navigation items
```

### Post-Login Redirect

**AC3: Redirect to dashboard after login**
```gherkin
Given I successfully authenticate
When Payload completes the login process
Then I am redirected to /admin/dashboard (not the default Payload collection list)
```

### API Access Control

**AC4: Users collection restricted to admins**
```gherkin
Given I am logged in with role "operations"
When I attempt to access /api/users directly
Then I receive a 403 Forbidden response
```

**AC5: Customers collection accessible via API**
```gherkin
Given I am logged in with any role except "readonly"
When I access /api/customers
Then I receive customer data (needed for ServicingView)
```

---

## Tasks / Subtasks

- [x] **Task 1: Create reusable access control helpers** (AC: 1, 2, 4, 5)
  - [x] 1.1 Create `src/lib/access.ts` with role-based helpers
  - [x] 1.2 Implement `getUserRole`, `isAdmin`, `hasApprovalAuthority`, `canService`, `hasAnyRole`
  - [x] 1.3 Implement `hideFromNonAdmins` for Payload `admin.hidden`

- [x] **Task 2: Add `admin.hidden` to collections** (AC: 1, 2)
  - [x] 2.1 Hide `Users` collection from non-admins
  - [x] 2.2 Hide `Media` collection from non-admins
  - [x] 2.3 Hide `Customers` collection from non-admins (use ServicingView instead)
  - [x] 2.4 Hide `LoanAccounts` collection from non-admins
  - [x] 2.5 Hide `WriteOffRequests` collection from non-admins (use ApprovalsView)
  - [x] 2.6 Hide `Conversations` collection from non-admins
  - [x] 2.7 Hide `Applications` collection from non-admins

- [x] **Task 3: Update frontend homepage** (AC: 3)
  - [x] 3.1 Redirect authenticated users from `/` to `/admin/dashboard`
  - [x] 3.2 Show login page for unauthenticated users
  - [x] 3.3 Update styling for cleaner login experience

- [x] **Task 4: Refactor existing access controls** (AC: 4, 5)
  - [x] 4.1 Update Users collection to use `@/lib/access` helpers
  - [x] 4.2 Update Customers collection to use `hasAnyRole`
  - [x] 4.3 Update LoanAccounts collection to use `hasAnyRole`
  - [x] 4.4 Update WriteOffRequests to use access helpers
  - [x] 4.5 Update Conversations/Applications to use `hasApprovalAuthority`

- [x] **Task 5: Write unit tests** (AC: 1-5)
  - [x] 5.1 Test `getUserRole` with various inputs
  - [x] 5.2 Test `isAdmin`, `hasApprovalAuthority`, `canService`, `hasAnyRole`
  - [x] 5.3 Test `hideFromNonAdmins` role matrix
  - [x] 5.4 Test full role matrix against AC requirements

**Implementation Note:** Payload v3 doesn't have a built-in `afterLogin` redirect config. We implemented the redirect in the frontend homepage instead, which covers the common case of users landing on `/`.

---

## Dev Notes

### Payload Collection Hidden Pattern

```typescript
// src/collections/Users.ts
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Administration',
    // Hide from sidebar for non-admins
    hidden: ({ user }) => user?.role !== 'admin',
  },
  // ... rest of config
}
```

### Reusable Hidden Function

```typescript
// src/lib/access.ts
export const isAdmin = (user: User | null) => user?.role === 'admin'
export const hideFromNonAdmins = ({ user }: { user: User | null }) => !isAdmin(user)
```

### Post-Login Redirect

```typescript
// payload.config.ts
export default buildConfig({
  admin: {
    // ...existing config
    custom: {
      afterLogin: '/admin/dashboard',
    },
  },
})
```

### Frontend Redirect (app/(frontend)/page.tsx)

```tsx
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
// ...

export default async function HomePage() {
  const payload = await getPayload({ config })
  // Check if user is authenticated and redirect
  // If not, show landing page
}
```

### Existing Role Definitions (Users.ts)

The Users collection already defines these roles:
- `admin` - Full system access
- `supervisor` - Operations + approval authority
- `operations` - Day-to-day servicing
- `readonly` - View-only access

---

## References

- [Source: src/collections/Users.ts - Role definitions]
- [Source: docs/architecture.md - RBAC patterns]
- [Source: Party Mode Discussion - 2025-12-11]

---

## Dev Agent Record

### Context Reference

Story: 6.7 Role-Based Collection Visibility
Epic: 6 - Navigation UX

### Agent Model Used

Claude Opus 4.5

### Completion Notes

**Implementation completed 2025-12-11**

- Created reusable access control helpers in `src/lib/access.ts`
- Added `admin.hidden: hideFromNonAdmins` to all 7 collections
- Updated frontend homepage to redirect authenticated users to `/admin/dashboard`
- Refactored existing access controls to use centralized helpers
- All 888 tests passing (39 new tests for access control)

**Key decisions:**
1. Used `admin.hidden` function instead of static value for dynamic role checking
2. Redirect implemented in frontend page (Payload v3 doesn't have `afterLogin` config option)
3. Refactored all collections to use centralized `@/lib/access` helpers for consistency

**Role Matrix Implemented:**
| Role | Collections Visible | Approval Authority | Servicing Access |
|------|--------------------|--------------------|------------------|
| admin | ✅ Yes | ✅ Yes | ✅ Yes |
| supervisor | ❌ Hidden | ✅ Yes | ✅ Yes |
| operations | ❌ Hidden | ❌ No | ✅ Yes |
| readonly | ❌ Hidden | ❌ No | ❌ No |

### File List

**New Files:**
- `src/lib/access.ts` - Reusable role-based access control helpers
- `tests/unit/lib/access.test.ts` - 39 unit tests for access helpers

**Modified Files:**
- `src/collections/Users.ts` - Added hidden, refactored access controls
- `src/collections/Customers.ts` - Added hidden, use hasAnyRole
- `src/collections/LoanAccounts.ts` - Added hidden, use hasAnyRole
- `src/collections/WriteOffRequests.ts` - Added hidden, use access helpers
- `src/collections/Conversations.ts` - Added hidden, use hasApprovalAuthority
- `src/collections/Applications.ts` - Added hidden, use hasApprovalAuthority
- `src/collections/Media.ts` - Added hidden
- `src/app/(frontend)/page.tsx` - Redirect authenticated users to dashboard
- `src/app/(frontend)/styles.css` - Added subtitle styling

---

## Senior Developer Review (AI)

**Reviewed:** 2025-12-11

### Issues Found & Resolved

| Issue | Severity | Resolution |
|-------|----------|------------|
| Unused `roles` variable in tests | Minor | Removed unused const |
| Dashboard doesn't exist yet | Note | Acceptable - Story 6.2 will create it |

### What's Good

1. ✅ Centralized access control in `src/lib/access.ts`
2. ✅ Defensive typing using `unknown` with runtime checks
3. ✅ Clear role hierarchy documentation
4. ✅ Comprehensive parameterized tests (39 tests)
5. ✅ Consistent refactoring across all 7 collections
6. ✅ No linter errors in modified files

### Security Review

- ✅ API-level access controls properly implemented
- ✅ UI-level visibility controls properly implemented
- ✅ User can still read their own record (self-service)
- ✅ Admin-only operations properly gated
