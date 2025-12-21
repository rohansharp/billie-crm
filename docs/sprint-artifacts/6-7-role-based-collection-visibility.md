# Story 6.7: Role-Based Collection Visibility

**Status:** ready-for-dev

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

- [ ] **Task 1: Add `admin.hidden` to collections** (AC: 1, 2)
  - [ ] 1.1 Hide `Users` collection from non-admins
  - [ ] 1.2 Hide `Media` collection from non-admins
  - [ ] 1.3 Hide `Customers` collection from non-admins (use ServicingView instead)
  - [ ] 1.4 Hide `LoanAccounts` collection from non-admins
  - [ ] 1.5 Hide `WriteOffRequests` collection from non-admins (use ApprovalsView)
  - [ ] 1.6 Hide `Conversations` collection from non-admins
  - [ ] 1.7 Hide `Applications` collection from non-admins

- [ ] **Task 2: Configure post-login redirect** (AC: 3)
  - [ ] 2.1 Add `admin.custom.afterLogin` to payload.config.ts
  - [ ] 2.2 Redirect authenticated users to `/admin/dashboard`

- [ ] **Task 3: Review and update API access controls** (AC: 4, 5)
  - [ ] 3.1 Ensure Users collection has admin-only read access
  - [ ] 3.2 Verify Customers collection allows authenticated read access
  - [ ] 3.3 Verify LoanAccounts allows authenticated read (for gRPC proxy)

- [ ] **Task 4: Update frontend homepage** 
  - [ ] 4.1 Update `/` to redirect authenticated users to `/admin/dashboard`
  - [ ] 4.2 Keep current landing page for unauthenticated users

- [ ] **Task 5: Write unit tests**
  - [ ] 5.1 Test collection hidden logic returns correct value per role
  - [ ] 5.2 Test access control functions

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

_To be filled by dev agent_

### Completion Notes

_To be filled after implementation_

### File List

**Modified Files:**
- `src/collections/Users.ts`
- `src/collections/Customers.ts`
- `src/collections/LoanAccounts.ts`
- `src/collections/WriteOffRequests.ts`
- `src/collections/Conversations.ts`
- `src/collections/Applications.ts`
- `src/collections/Media.ts`
- `src/payload.config.ts`
- `src/app/(frontend)/page.tsx`

**New Files:**
- `src/lib/access.ts` (reusable access control helpers)
- `tests/unit/lib/access.test.ts`
