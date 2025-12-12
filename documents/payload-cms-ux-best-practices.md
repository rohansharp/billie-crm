# Payload CMS UX Best Practices: Comprehensive Guidelines

> A guide for creating exceptional user experiences within Payload CMS while staying aligned with Payload's conventions and patterns.

---

## Table of Contents

1. [Understanding Payload's Customization Philosophy](#1-understanding-payloads-customization-philosophy)
2. [The Payload Way: What You Should Leverage](#2-the-payload-way-what-you-should-leverage)
3. [Custom Views: The Right Pattern](#3-custom-views-the-right-pattern)
4. [UX Best Practices for Servicing Applications](#4-ux-best-practices-for-servicing-applications)
5. [Recommended Architecture](#5-recommended-architecture-for-your-servicing-app)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Key Takeaways](#7-key-takeaways)

---

## 1. Understanding Payload's Customization Philosophy

Payload CMS is designed with a **"configuration over code"** philosophy, but provides **escape hatches** for custom functionality. The key principle is:

> **Use Payload's primitives first, then extend with custom components only when necessary.**

### Customization Hierarchy (prefer higher levels first)

| Level | Use When | Example |
|-------|----------|---------|
| **Field Configuration** | Standard data display/edit | `defaultValue`, `validate`, `hooks` |
| **Custom Fields** | Specialized input/display | Rich text, color picker, rating stars |
| **Admin Overrides** | Change labels, descriptions, conditions | `admin.description`, `admin.condition` |
| **Custom Views** | Alternative document views | Dashboard, analytics, servicing |
| **Full Custom UI** | Completely different experience | Embedding external apps |

### Decision Framework

```
┌─────────────────────────────────────────────────────────────┐
│                 CAN PAYLOAD CONFIG DO THIS?                 │
│                            │                                │
│                     ┌──────┴──────┐                         │
│                     │             │                         │
│                    YES           NO                         │
│                     │             │                         │
│                     ▼             ▼                         │
│              USE CONFIG    CAN A CUSTOM FIELD DO THIS?      │
│                                   │                         │
│                            ┌──────┴──────┐                  │
│                            │             │                  │
│                           YES           NO                  │
│                            │             │                  │
│                            ▼             ▼                  │
│                     CUSTOM FIELD   CUSTOM VIEW/COMPONENT    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. The Payload Way: What You Should Leverage

### 2.1 Collection Hooks Instead of External Processing

Payload has powerful hooks that run server-side. Use these for data transformation, enrichment, and validation:

```typescript
// ✅ GOOD: Use Payload hooks for derived data
const LoanAccounts: CollectionConfig = {
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Calculate derived fields server-side
        data.totalOutstanding = data.principalBalance + data.feeBalance
        return data
      }
    ],
    afterRead: [
      async ({ doc }) => {
        // Enrich with live data from external services
        if (doc.externalAccountId) {
          doc.liveBalance = await fetchLiveBalance(doc.externalAccountId)
        }
        return doc
      }
    ]
  }
}
```

#### Available Hooks

| Hook | When It Runs | Use Case |
|------|--------------|----------|
| `beforeValidate` | Before field validation | Transform input data |
| `beforeChange` | Before save to DB | Calculate derived fields |
| `afterChange` | After save to DB | Trigger external events, audit logging |
| `beforeRead` | Before returning data | Access control enrichment |
| `afterRead` | After returning data | Add computed/external data |
| `beforeDelete` | Before deletion | Cleanup external resources |
| `afterDelete` | After deletion | Cascade operations |

### 2.2 Admin UI Configuration

Payload v3 offers extensive admin customization through configuration:

```typescript
const LoanAccounts: CollectionConfig = {
  slug: 'loan-accounts',
  
  admin: {
    // Group related collections in sidebar
    group: 'Servicing',
    
    // Custom icon for collection
    icon: CreditCardIcon,
    
    // Custom description with React component
    description: ({ data }) => (
      <StatusBadge status={data?.status} />
    ),
    
    // List view customization
    listSearchableFields: ['accountNumber', 'customer.fullName'],
    defaultColumns: ['accountNumber', 'customer', 'status', 'totalOutstanding'],
    
    // Use document title in breadcrumbs
    useAsTitle: 'accountNumber',
    
    // Preview URL for external viewing
    preview: (doc) => `https://portal.example.com/accounts/${doc.id}`,
    
    // Pagination settings
    pagination: {
      defaultLimit: 25,
      limits: [10, 25, 50, 100],
    },
    
    // Custom components
    components: {
      // Replace the entire edit view
      views: {
        Edit: {
          // Add custom tabs alongside default
          Servicing: {
            Component: ServicingView,
            path: '/servicing',
            Tab: {
              label: 'Servicing',
              href: '/servicing',
            }
          }
        }
      },
      
      // Custom elements in different positions
      beforeList: [AnnouncementBanner],
      afterList: [QuickActions],
    }
  }
}
```

### 2.3 Virtual Fields for External Data

Instead of fetching data client-side, use **virtual fields** that Payload resolves server-side:

```typescript
{
  name: 'liveBalance',
  type: 'group',
  virtual: true, // Not stored in DB
  admin: {
    readOnly: true,
    position: 'sidebar',
    description: 'Real-time balance from ledger service',
  },
  hooks: {
    afterRead: [
      async ({ siblingData }) => {
        try {
          return await grpcClient.getBalance(siblingData.externalAccountId)
        } catch (error) {
          // Graceful fallback
          return {
            principal: siblingData.principalBalance,
            fees: siblingData.feeBalance,
            total: siblingData.totalOutstanding,
            _cached: true,
          }
        }
      }
    ]
  },
  fields: [
    { name: 'principal', type: 'number' },
    { name: 'fees', type: 'number' },
    { name: 'total', type: 'number' },
    { name: '_cached', type: 'checkbox', admin: { hidden: true } },
  ]
}
```

### 2.4 Field-Level Admin Customization

Every field has an `admin` property for UI customization:

```typescript
{
  name: 'status',
  type: 'select',
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Delinquent', value: 'delinquent' },
    { label: 'Closed', value: 'closed' },
  ],
  admin: {
    // Position in sidebar vs main area
    position: 'sidebar',
    
    // Conditional display
    condition: (data, siblingData) => siblingData.accountType === 'loan',
    
    // Custom styling
    style: { fontWeight: 'bold' },
    
    // Width in grid (1-12)
    width: '50%',
    
    // Read-only based on conditions
    readOnly: ({ user }) => !user.roles.includes('admin'),
    
    // Custom description
    description: 'Account status affects payment processing',
    
    // Custom components
    components: {
      Field: CustomStatusField,
      Cell: StatusCell, // In list view
    }
  }
}
```

---

## 3. Custom Views: The Right Pattern

### 3.1 Directory Structure for Custom Views

```
src/
├── collections/
│   └── LoanAccounts.ts              # Collection config
├── views/
│   └── LoanAccountServicing/        # Custom view
│       ├── index.tsx                # Main view component (Server Component)
│       ├── client.tsx               # Client-side interactivity
│       ├── hooks/                   # Data fetching hooks
│       │   ├── useBalance.ts
│       │   └── useTransactions.ts
│       ├── components/              # Sub-components
│       │   ├── BalanceCard/
│       │   │   ├── index.tsx
│       │   │   └── BalanceCard.module.scss
│       │   ├── TransactionList/
│       │   └── ActionDrawers/
│       │       ├── RecordPayment.tsx
│       │       ├── ApplyFee.tsx
│       │       └── WaiveFee.tsx
│       └── actions/                 # Server actions
│           └── ledgerActions.ts
├── components/                      # Shared components
│   └── ui/
│       ├── StatusBadge.tsx
│       └── CurrencyDisplay.tsx
└── lib/
    └── grpc-client.ts               # External service client
```

### 3.2 Use Server Actions (Not API Routes)

Payload v3 with Next.js App Router supports **Server Actions**—prefer these over API routes for mutations:

```typescript
// src/views/LoanAccountServicing/actions/ledgerActions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { getLedgerClient } from '@/lib/grpc-client'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function recordPayment(formData: FormData) {
  const payload = await getPayload({ config })
  
  const loanAccountId = formData.get('loanAccountId') as string
  const amount = formData.get('amount') as string
  const reference = formData.get('reference') as string
  
  // Validation
  if (!loanAccountId || !amount) {
    return { success: false, error: 'Missing required fields' }
  }
  
  try {
    const client = getLedgerClient()
    const result = await client.recordRepayment({
      loanAccountId,
      amount,
      paymentId: crypto.randomUUID(),
      paymentReference: reference,
    })
    
    // Update Payload projection
    await payload.update({
      collection: 'loan-accounts',
      where: { externalAccountId: { equals: loanAccountId } },
      data: {
        lastPaymentDate: new Date().toISOString(),
        lastPaymentAmount: parseFloat(amount),
      }
    })
    
    // Revalidate the page cache
    revalidatePath(`/admin/collections/loan-accounts/${loanAccountId}`)
    
    return { success: true, transaction: result.transaction }
  } catch (error) {
    console.error('Payment failed:', error)
    return { success: false, error: 'Failed to record payment' }
  }
}
```

#### Using Server Actions in Components

```tsx
// src/views/LoanAccountServicing/components/ActionDrawers/RecordPayment.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Drawer, Button, TextInput } from '@payloadcms/ui'
import { recordPayment } from '../../actions/ledgerActions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Processing...' : 'Record Payment'}
    </Button>
  )
}

export function RecordPaymentDrawer({ loanAccountId, isOpen, onClose }) {
  const [state, formAction] = useFormState(recordPayment, null)
  
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Record Payment">
      <form action={formAction}>
        <input type="hidden" name="loanAccountId" value={loanAccountId} />
        
        <TextInput
          name="amount"
          label="Payment Amount"
          required
          type="number"
          step="0.01"
        />
        
        <TextInput
          name="reference"
          label="Payment Reference"
          placeholder="e.g., DD-20240315-001"
        />
        
        {state?.error && (
          <div className="error-message">{state.error}</div>
        )}
        
        {state?.success && (
          <div className="success-message">Payment recorded successfully!</div>
        )}
        
        <SubmitButton />
      </form>
    </Drawer>
  )
}
```

### 3.3 Integrate with Payload's Design System

Payload provides UI components via `@payloadcms/ui`. Use them for visual consistency:

```tsx
import { 
  // Layout
  Card,
  Drawer,
  Modal,
  Collapsible,
  
  // Forms
  Button,
  TextInput,
  Select,
  Checkbox,
  DatePicker,
  
  // Feedback
  toast,
  Banner,
  Pill,
  
  // Hooks
  useDocumentInfo,
  useConfig,
  useAuth,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
```

#### Example: Using Payload's Components

```tsx
import { Card, Button, Pill, toast } from '@payloadcms/ui'

export function AccountStatusCard({ account }) {
  const handleRefresh = async () => {
    try {
      await refreshBalance(account.id)
      toast.success('Balance refreshed')
    } catch {
      toast.error('Failed to refresh balance')
    }
  }
  
  return (
    <Card>
      <Card.Header>
        <Card.Title>Account Status</Card.Title>
        <Pill color={getStatusColor(account.status)}>
          {account.status}
        </Pill>
      </Card.Header>
      <Card.Content>
        <dl>
          <dt>Principal Balance</dt>
          <dd>${account.principalBalance.toFixed(2)}</dd>
          <dt>Fee Balance</dt>
          <dd>${account.feeBalance.toFixed(2)}</dd>
        </dl>
      </Card.Content>
      <Card.Footer>
        <Button onClick={handleRefresh} size="small" buttonStyle="secondary">
          Refresh Balance
        </Button>
      </Card.Footer>
    </Card>
  )
}
```

### 3.4 Using Payload's CSS Variables

Payload exposes CSS custom properties for theming. Use these instead of custom colors:

```scss
// src/views/LoanAccountServicing/styles.module.scss

.balanceCard {
  background: var(--theme-elevation-50);
  border: 1px solid var(--theme-elevation-150);
  border-radius: var(--style-radius-s);
  padding: var(--base);
  
  &:hover {
    border-color: var(--theme-elevation-250);
  }
}

.balanceAmount {
  font-family: var(--font-mono);
  font-size: var(--font-size-large);
  color: var(--theme-text);
}

.balanceLabel {
  font-size: var(--font-size-small);
  color: var(--theme-elevation-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.statusPill {
  &.active { background: var(--color-success-500); }
  &.delinquent { background: var(--color-warning-500); }
  &.closed { background: var(--theme-elevation-400); }
}
```

#### Available CSS Variables

```scss
// Colors
--theme-bg                    // Background
--theme-text                  // Text color
--theme-elevation-{50-950}    // Gray scale
--color-success-{100-900}     // Green
--color-warning-{100-900}     // Amber
--color-error-{100-900}       // Red

// Typography
--font-body
--font-mono
--font-size-small
--font-size-base
--font-size-large
--font-size-h1 through --font-size-h6

// Spacing
--base                        // 24px base unit
--spacing-xs through --spacing-xl

// Borders
--style-radius-s
--style-radius-m
--style-radius-l
```

---

## 4. UX Best Practices for Servicing Applications

### 4.1 Information Architecture

For a **Loan Account Servicing View**, follow this information hierarchy:

```
┌─────────────────────────────────────────────────────────────────┐
│ LOAN ACCOUNT: LA-2024-001                            [Actions ▼]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   BALANCE    │  │    STATUS    │  │   CUSTOMER   │          │
│  │   $1,234.56  │  │   Current    │  │   John Doe   │          │
│  │   Live ✓     │  │              │  │   → View     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ QUICK ACTIONS                                               ││
│  │ [💳 Payment] [📋 Statement] [⚠️ Fee] [🎁 Waive] [⚖️ Adjust] ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ TRANSACTION HISTORY                     [Filter ▼] [Export] ││
│  │ ─────────────────────────────────────────────────────────── ││
│  │ 2024-03-15  Payment Received     -$50.00   → $1,234.56     ││
│  │ 2024-03-01  Late Fee Applied     +$15.00   → $1,284.56     ││
│  │ 2024-02-15  Payment Received     -$50.00   → $1,269.56     ││
│  │                                                             ││
│  │                    [Load More]                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ REPAYMENT SCHEDULE                               [Collapse] ││
│  │ ─────────────────────────────────────────────────────────── ││
│  │ Next Due: 2024-04-01 • $150.00 • 8 payments remaining      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 State Management Recommendations

| Data Type | Fetch Strategy | Caching | Revalidation |
|-----------|----------------|---------|--------------|
| **Account Details** | Payload's `useDocumentInfo()` | Automatic | On mutation |
| **Live Balance** | Virtual field / Server Action | 30 seconds | Manual refresh |
| **Transactions** | Paginated, cursor-based | Session-only | After mutations |
| **Customer Info** | Relationship populate | Automatic | On change |
| **Actions (POST)** | Server Action | None | Immediate |

### 4.3 Error Handling & Fallbacks

Always design for failure, especially with external services:

```tsx
// Pattern: Graceful degradation with clear messaging

export function BalanceCard({ loanAccountId, cachedBalance }) {
  const { data, error, isLoading, refetch } = useBalance(loanAccountId)
  
  // Loading state with skeleton
  if (isLoading) {
    return <BalanceSkeleton />
  }
  
  // Error state with fallback to cached data
  if (error) {
    return (
      <Card variant="warning">
        <Banner type="warning">
          <p>Unable to fetch live balance from ledger service</p>
          <p className="muted">Showing last known balance from projection</p>
        </Banner>
        
        <BalanceDisplay 
          data={cachedBalance} 
          isCached={true}
        />
        
        <Button onClick={refetch} size="small">
          Retry
        </Button>
      </Card>
    )
  }
  
  // Success state
  return (
    <Card>
      <BalanceDisplay data={data} isCached={false} />
      <span className="sync-indicator">● Live</span>
    </Card>
  )
}
```

### 4.4 Optimistic Updates for Actions

Provide immediate feedback for user actions:

```tsx
import { useOptimistic } from 'react'

export function TransactionList({ initialTransactions, loanAccountId }) {
  const [transactions, setTransactions] = useState(initialTransactions)
  
  const [optimisticTransactions, addOptimistic] = useOptimistic(
    transactions,
    (state, newTransaction) => [newTransaction, ...state]
  )
  
  const handleRecordPayment = async (formData) => {
    const amount = formData.get('amount')
    
    // 1. Add optimistic transaction immediately
    const optimisticTx = {
      id: `pending-${Date.now()}`,
      type: 'REPAYMENT',
      amount: `-${amount}`,
      status: 'pending',
      date: new Date().toISOString(),
    }
    addOptimistic(optimisticTx)
    
    // 2. Make actual request
    const result = await recordPayment(formData)
    
    // 3. Replace optimistic with real data
    if (result.success) {
      setTransactions(prev => [
        result.transaction,
        ...prev.filter(t => !t.id.startsWith('pending-'))
      ])
      toast.success('Payment recorded')
    } else {
      // Remove optimistic on failure
      setTransactions(prev => 
        prev.filter(t => !t.id.startsWith('pending-'))
      )
      toast.error(result.error)
    }
  }
  
  return (
    <ul>
      {optimisticTransactions.map(tx => (
        <TransactionRow 
          key={tx.id} 
          transaction={tx}
          isPending={tx.status === 'pending'}
        />
      ))}
    </ul>
  )
}
```

### 4.5 Keyboard Navigation & Accessibility

```tsx
export function ActionButtons({ actions }) {
  return (
    <div 
      role="toolbar" 
      aria-label="Account actions"
      className="action-toolbar"
    >
      {actions.map((action, index) => (
        <Button
          key={action.id}
          onClick={action.handler}
          aria-keyshortcuts={action.shortcut}
          tabIndex={index === 0 ? 0 : -1}
        >
          <span aria-hidden="true">{action.icon}</span>
          <span>{action.label}</span>
          <kbd className="shortcut-hint">{action.shortcut}</kbd>
        </Button>
      ))}
    </div>
  )
}

// Register keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'p':
          e.preventDefault()
          openPaymentDrawer()
          break
        case 's':
          e.preventDefault()
          generateStatement()
          break
      }
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [])
```

---

## 5. Recommended Architecture for Your Servicing App

### Current Approach (Anti-patterns)

```
❌ Custom React components with client-side fetch()
❌ Separate API routes for each operation
❌ CSS modules with fully custom styling
❌ Modal-heavy interaction pattern
❌ Manual error handling in each component
❌ No integration with Payload's data layer
```

### Recommended Approach

```
✅ Server Components with Server Actions
✅ Payload's UI components for consistency
✅ Virtual fields for live external data
✅ Drawer pattern for complex forms (less disruptive than modals)
✅ Centralized error handling with fallbacks
✅ Payload hooks for data enrichment
```

### Comparison Table

| Aspect | Current | Recommended |
|--------|---------|-------------|
| Balance fetch | `/api/ledger/balance` route | Virtual field with `afterRead` hook |
| Transactions | Client-side paginated fetch | Server Component with streaming |
| Record payment | Modal with `fetch()` POST | Drawer with Server Action |
| Styling | Custom CSS modules | Payload variables + minimal overrides |
| Error handling | Per-component try/catch | Error boundaries + toast notifications |
| Data refresh | Manual `refetch()` | `revalidatePath()` after mutations |

### Recommended File Structure

```
src/
├── collections/
│   └── LoanAccounts/
│       ├── index.ts                 # Main collection config
│       ├── fields/
│       │   ├── liveBalance.ts       # Virtual field for live balance
│       │   └── repaymentSchedule.ts # Computed schedule field
│       ├── hooks/
│       │   ├── enrichWithLedger.ts  # afterRead hook
│       │   └── syncToLedger.ts      # afterChange hook
│       └── access/
│           └── canService.ts        # Role-based access
│
├── views/
│   └── LoanAccountServicing/
│       ├── index.tsx                # Server Component entry
│       ├── ServicingClient.tsx      # Client interactivity
│       ├── components/
│       │   ├── BalanceCard.tsx
│       │   ├── TransactionTable.tsx
│       │   └── ActionToolbar.tsx
│       ├── drawers/
│       │   ├── RecordPayment.tsx
│       │   ├── ApplyFee.tsx
│       │   ├── WaiveFee.tsx
│       │   └── Adjustment.tsx
│       └── actions/
│           └── ledger.ts            # Server Actions
│
├── components/
│   └── shared/
│       ├── CurrencyDisplay.tsx
│       ├── StatusBadge.tsx
│       └── RelativeTime.tsx
│
└── lib/
    ├── grpc/
    │   ├── client.ts
    │   └── types.ts
    └── formatters/
        ├── currency.ts
        └── date.ts
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1)

1. **Move live balance to a virtual field group**
   - Create `afterRead` hook that fetches from gRPC
   - Add fallback to projection data on failure
   - Display in sidebar with refresh button

2. **Replace API routes with Server Actions**
   - Convert `/api/ledger/repayment` → `recordPayment` action
   - Convert `/api/ledger/late-fee` → `applyLateFee` action
   - Add proper error handling and revalidation

3. **Adopt Payload's Drawer component**
   - Replace Modal components with Drawer
   - Use `useFormState` for form handling
   - Integrate with Payload's toast for feedback

### Phase 2: Integration (Week 2)

1. **Implement `afterRead` hooks for data enrichment**
   - Fetch live balance when viewing account
   - Cache results with TTL
   - Handle service unavailability gracefully

2. **Add proper error boundaries**
   - Wrap servicing view in error boundary
   - Provide meaningful error messages
   - Add retry functionality

3. **Implement optimistic updates**
   - Use `useOptimistic` for transaction list
   - Show pending state for in-flight operations
   - Roll back on failure

### Phase 3: Polish (Week 3)

1. **Align styling with Payload's design tokens**
   - Replace custom colors with CSS variables
   - Use Payload's spacing scale
   - Match typography to admin theme

2. **Add keyboard shortcuts**
   - Cmd/Ctrl + P for payment
   - Cmd/Ctrl + S for statement
   - Escape to close drawers

3. **Implement audit logging**
   - Use `afterChange` hooks
   - Log user, action, and timestamp
   - Store in dedicated AuditLog collection

---

## 7. Key Takeaways

### The Golden Rules

1. **Configuration First**
   > Exhaust Payload's config options before writing custom code. Every custom component is technical debt.

2. **Server-Side by Default**
   > Use hooks and Server Actions, not client-side fetching. This improves performance, security, and SEO.

3. **Consistent UI**
   > Use Payload's component library (`@payloadcms/ui`). Your custom views should feel native to the admin.

4. **Graceful Degradation**
   > Always have fallbacks for external service failures. Users should never see a broken interface.

5. **Leverage Relationships**
   > Use Payload's relationships and `populate` instead of manual joins. Let the framework do the work.

6. **Virtual Fields for External Data**
   > Perfect for computed/external data that shouldn't be stored. Keeps your schema clean.

### Quick Reference: When to Use What

| I need to... | Use... |
|--------------|--------|
| Add a new data field | Collection field definition |
| Compute a value from other fields | `beforeChange` hook |
| Fetch external data for display | Virtual field with `afterRead` hook |
| Create a custom input | Custom Field component |
| Add a new tab to edit view | `admin.components.views.Edit` |
| Handle form submission | Server Action with `useFormState` |
| Show success/error feedback | Payload's `toast` |
| Display a form in a panel | Payload's `<Drawer>` component |
| Control who can do what | Collection `access` functions |

### Anti-Patterns to Avoid

```typescript
// ❌ DON'T: Client-side data fetching for critical data
useEffect(() => {
  fetch('/api/balance').then(...)
}, [])

// ✅ DO: Server-side enrichment
hooks: {
  afterRead: [async ({ doc }) => {
    doc.liveBalance = await fetchBalance(doc.id)
    return doc
  }]
}
```

```typescript
// ❌ DON'T: Custom API routes for CRUD operations
// src/app/api/accounts/[id]/update/route.ts
export async function POST(req) { ... }

// ✅ DO: Server Actions
// src/actions/accounts.ts
'use server'
export async function updateAccount(formData: FormData) { ... }
```

```typescript
// ❌ DON'T: Completely custom styling
.myButton {
  background: #4f46e5;
  padding: 12px 24px;
}

// ✅ DO: Use Payload's design tokens
.myButton {
  background: var(--color-primary-500);
  padding: var(--spacing-s) var(--spacing-m);
}
```

---

## Appendix: Useful Resources

- [Payload CMS v3 Documentation](https://payloadcms.com/docs)
- [Payload UI Components](https://payloadcms.com/docs/admin/components)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [React useFormState](https://react.dev/reference/react-dom/hooks/useFormState)
- [Payload GitHub - UI Package](https://github.com/payloadcms/payload/tree/main/packages/ui)

---

*Document Version: 1.0*  
*Last Updated: December 2024*  
*Author: AI Assistant based on Payload CMS best practices*

