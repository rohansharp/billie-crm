---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - docs/prd.md
  - docs/ux-design-specification.md
  - docs/analysis/brainstorming-session-2025-12-11.md
  - docs/index.md
  - docs/architecture-billie-crm-web.md
  - docs/architecture-event-processor.md
  - docs/integration-architecture.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2025-12-11'
project_name: 'billie-crm'
user_name: 'Rohan'
date: '2025-12-11'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The system must provide a **Unified Servicing Shell** for support staff to manage loan accounts efficiently.
*   **Customer Intelligence:** Global search (FR1), Single Customer View (FR4), and Aggregated Profile/Account/Transaction data (FR5, FR6).
*   **Financial Operations (Write):** Staff must perform "Write" actions like **Fee Waivers** (FR8), **Repayments** (FR9), and **Write-Offs** (FR10) directly from the UI.
*   **Compliance & Audit:** All actions must be logged immutably (FR15), and sensitive actions like Write-Offs require a **Maker-Checker (Approval)** workflow (FR13, FR14).
*   **Real-Time Feedback:** The system must use **Optimistic UI** (FR11) to provide instant feedback while handling eventual consistency with the backend ledger.

**Non-Functional Requirements:**
*   **Performance:** "Zero Context Switching" means page loads < 1.5s (NFR3) and Optimistic interactions < 100ms (NFR1).
*   **Data Integrity:** The "Read Model" (MongoDB) must remain consistent with the "Write Model" (Ledger) via reliable event consumption.
*   **Security:** Strict RBAC (Support vs. Approver) and PCI-DSS scope reduction (no raw card data).
*   **Resilience:** The UI must degrade gracefully to "Read-Only" if the connection to the Event Processor or Ledger is lost (NFR7).

**Scale & Complexity:**
*   **Primary Domain:** Fintech / Web Application
*   **Complexity Level:** High (Distributed System, Event Sourcing, Hybrid Monolith)
*   **Estimated Components:** 3 Major (Web App, Event Processor, Ledger Integration)

### Technical Constraints & Dependencies

**Constraints:**
*   **Brownfield Context:** Must integrate with existing `event-processor` (Python) and `billie-crm-web` (Next.js/Payload).
*   **CQRS Architecture:** The "Read" path (MongoDB projection) is decoupled from the "Write" path (gRPC to Ledger). Architecture must respect this split.
*   **Payload CMS:** The Web App *is* Payload CMS. Custom views must be injected into the Payload Admin UI, not built as a separate app.
*   **Event Sourcing:** The "Source of Truth" is the Ledger Event Log, not the local database. Local data is a projection.

**Dependencies:**
*   **External Ledger Service:** The system relies on a gRPC connection to an external service for all financial calculations and state changes.
*   **Redis Streams:** The communication backbone between the Core Banking System and our Event Processor.
*   **MongoDB:** Shared storage between the Event Processor (Writer) and Web App (Reader).

### Cross-Cutting Concerns Identified

1.  **Optimistic UI State Management:** How do we manage the "Pending" state of a transaction locally (React Client) while waiting for the Event Processor to update the database (MongoDB)? This requires a robust client-side store (Zustand/Query).
2.  **Authentication & RBAC:** User roles (Support/Approver) must be synced between Payload's Auth system and the Ledger's permission model.
3.  **Idempotency:** "Write" actions (Repayments) must generate Idempotency Keys on the client to prevent double-posting during network retries.
4.  **Error Handling & Compensation:** If an Optimistic Update fails (Ledger rejects), the UI must "Rollback" securely and notify the user.

## Starter Template Evaluation

### Primary Technology Domain

**Brownfield Project** - Extending an existing Next.js/Payload CMS application.

### Existing Foundation (Inherited Decisions)

This project already has a production-ready foundation. No starter template is needed.

| Category | Technology | Version | Status |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | 15.x | ✅ In Use |
| **CMS** | Payload CMS | 3.45.0 | ✅ In Use |
| **Language** | TypeScript | 5.x | ✅ Configured |
| **Database** | MongoDB | (via Payload) | ✅ Connected |
| **Styling** | SCSS / CSS Modules | - | ✅ Configured |
| **Testing** | Vitest / Playwright | - | ✅ Configured |
| **Linting** | ESLint / Prettier | - | ✅ Configured |

### New Dependencies to Evaluate

The following libraries are *candidates* to be added to enable Servicing App features:

| Need | Candidate | Rationale |
| :--- | :--- | :--- |
| **Command Palette** | `cmdk` | Accessible, headless, Linear-style `Cmd+K` |
| **Data Tables** | `@tanstack/react-table` | Headless, virtualization-ready |
| **Optimistic State** | `zustand` | Lightweight, works with React Query |
| **Toast Notifications** | `sonner` | Modern, supports "Undo" actions |
| **gRPC Client** | `@grpc/grpc-js` | Already in use via `src/server/grpc-client.ts` |

### Architectural Decisions Still Needed

1.  **State Management Strategy:** How to manage Optimistic UI state across components.
2.  **Custom View Integration:** How to inject custom React pages into Payload Admin.
3.  **API Route Architecture:** Structure for `/api/ledger/*` proxy routes.
4.  **Error Boundary Design:** How to implement "Read-Only Mode" gracefully.

**Note:** These decisions will be addressed in the following steps.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1.  State Management Strategy (Optimistic UI)
2.  Custom View Integration (Payload Admin)
3.  API Route Architecture (Ledger Proxy)

**Important Decisions (Shape Architecture):**
4.  Error Handling & Degradation Strategy
5.  Real-Time Data Strategy

**Deferred Decisions (Post-MVP):**
-   Cross-tab state synchronization (BroadcastChannel)
-   WebSocket real-time updates (Polling sufficient for MVP)

### Frontend State Management

**Decision:** Zustand + TanStack Query (Hybrid Approach)

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Server State** | TanStack Query v5 | Caching, background refetch, polling (10s), stale management |
| **Optimistic UI State** | Zustand | Synchronous "Pending Mutations" store for instant feedback |

**Rationale:**
*   TanStack Query handles the "Read" path with built-in `staleTime`, `refetchOnWindowFocus`, and `optimisticUpdate`.
*   Zustand provides a synchronous, global store for the "Pending Actions" that must update the UI *before* the API call starts (< 16ms).
*   This separation allows `BalanceCard` and `TransactionTable` to subscribe to pending state independently.

**Implementation Pattern:**

```typescript
// stores/optimistic.ts
interface OptimisticStore {
  pendingMutations: Map<string, PendingMutation>;
  addPending: (id: string, mutation: PendingMutation) => void;
  resolvePending: (id: string, success: boolean) => void;
}

// hooks/useOptimisticBalance.ts
const useOptimisticBalance = (accountId: string) => {
  const serverBalance = useQuery(['balance', accountId], fetchBalance);
  const pendingAdjustments = useOptimisticStore(s => s.getPendingForAccount(accountId));
  
  return computeOptimisticBalance(serverBalance.data, pendingAdjustments);
};
```

### Custom View Integration

**Decision:** Payload `admin.components.views` Pattern

**Rationale:**
*   Only official Payload pattern that preserves the Admin shell (sidebar, header, auth).
*   Honors the "Zero Context Switching" UX requirement.
*   Provides automatic access to `user` and `permissions` for RBAC.

**Implementation Pattern:**

```typescript
// payload.config.ts
export default buildConfig({
  admin: {
    components: {
      views: {
        ServicingView: {
          Component: '@/components/views/ServicingView',
          path: '/servicing/:customerId',
        },
        ApprovalsView: {
          Component: '@/components/views/ApprovalsView',
          path: '/approvals',
        },
      },
    },
  },
});
```

### API Route Architecture

**Decision:** Individual Routes + Zod Typed Responses

**Rationale:**
*   Explicit, testable, single-responsibility routes.
*   Aligns with existing gRPC contracts in `proto/accounting_ledger.proto`.
*   Avoids adding another RPC layer (tRPC) on top of gRPC.
*   Zod schemas provide type-safe error mapping for the UI.

**Route Structure:**

```
src/app/api/ledger/
├── waive-fee/route.ts      # POST - Waive a fee
├── record-repayment/route.ts # POST - Record manual repayment
├── write-off/route.ts      # POST - Request write-off (triggers approval)
├── adjustment/route.ts     # POST - Manual balance adjustment
└── transactions/route.ts   # GET - Fetch transaction history
```

**Response Schema Pattern:**

```typescript
// lib/schemas/ledger-responses.ts
const WaiveFeeResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('success'), newBalance: z.number() }),
  z.object({ status: z.literal('error'), code: z.enum(['INSUFFICIENT_PRIVILEGES', 'VERSION_CONFLICT', 'LEDGER_UNAVAILABLE']), message: z.string() }),
]);
```

### Error Handling & Degradation Strategy

**Decision:** Graceful Degradation to "Read-Only Mode"

**Trigger:** If gRPC connection to Ledger fails OR Event Processor health check fails.

**Behavior:**
1.  **Detection:** API routes return `503 Service Unavailable` with `X-ReadOnly-Mode: true` header.
2.  **UI Response:** Global banner appears: "System in Read-Only Mode. Write actions temporarily disabled."
3.  **Write Buttons:** Disabled with tooltip explaining the reason.
4.  **Recovery:** Automatic retry every 30 seconds. Banner dismisses when connection restored.

**Implementation:**

```typescript
// middleware/health-check.ts
export const withLedgerHealth = (handler: NextApiHandler) => async (req, res) => {
  const isHealthy = await ledgerClient.healthCheck();
  if (!isHealthy) {
    res.setHeader('X-ReadOnly-Mode', 'true');
    return res.status(503).json({ error: 'LEDGER_UNAVAILABLE' });
  }
  return handler(req, res);
};
```

### Real-Time Data Strategy

**Decision:** Intelligent Polling (TanStack Query)

**Rationale:**
*   WebSockets add infrastructure complexity (sticky sessions, reconnection logic).
*   The UX spec defines 10-second polling as acceptable (NFR2).
*   TanStack Query's `refetchOnWindowFocus` and `refetchOnReconnect` provide "pseudo real-time" feel.

**Configuration:**

```typescript
// providers/query-provider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,        // 10 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
    },
  },
});
```

**Post-Mutation Revalidation:**
After any write action (Waive, Repay), immediately invalidate related queries to force a fresh fetch:

```typescript
// After successful waive-fee mutation
queryClient.invalidateQueries(['balance', accountId]);
queryClient.invalidateQueries(['transactions', accountId]);
```

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 12 areas where AI agents could make different choices. The following patterns ensure consistency.

### Naming Patterns

**Database/Collection Naming (Payload Collections):**
*   **Collection Files:** PascalCase (`LoanAccounts.ts`, `Customers.ts`)
*   **Collection Slugs:** kebab-case (`loan-accounts`, `customers`)
*   **Field Names:** camelCase (`loanAccountId`, `customerId`)

**API Route Naming:**
*   **Route Folders:** kebab-case (`/api/ledger/waive-fee/`)
*   **Query Params:** camelCase (`?loanAccountId=123`)
*   **Response Fields:** camelCase (`{ totalOutstanding, feeBalance }`)

**Component Naming:**
*   **Component Files:** PascalCase (`BalanceCard.tsx`, `TransactionList.tsx`)
*   **Component Exports:** Named exports, PascalCase (`export const BalanceCard`)
*   **Props Interfaces:** `{ComponentName}Props` (`BalanceCardProps`)
*   **Hooks:** `use{Name}` (`useOptimisticBalance`, `useLoanAccount`)

**Store Naming:**
*   **Zustand Stores:** `use{Domain}Store` (`useOptimisticStore`, `useUIStore`)
*   **Query Keys:** Array format `['domain', id]` (`['balance', accountId]`)

### Structure Patterns

**Component Organization:**

```
src/components/
├── LoanAccountServicing/     # Feature folder
│   ├── index.tsx             # Barrel export + main component
│   ├── BalanceCard.tsx       # Sub-component
│   ├── TransactionList.tsx   # Sub-component
│   ├── WaiveFeeModal.tsx     # Modal component
│   └── styles.module.css     # Scoped styles
├── ui/                       # Shared UI primitives
│   ├── CommandBar/
│   ├── OptimisticToast/
│   └── ContextDrawer/
```

**Store Organization:**

```
src/stores/
├── optimistic.ts             # Pending mutations store
├── ui.ts                     # UI state (modals, drawers)
└── index.ts                  # Barrel export
```

**Hook Organization:**

```
src/hooks/
├── queries/                  # TanStack Query hooks
│   ├── useBalance.ts
│   ├── useTransactions.ts
│   └── useCustomer.ts
├── mutations/                # TanStack Mutation hooks
│   ├── useWaiveFee.ts
│   └── useRecordRepayment.ts
└── index.ts
```

### Format Patterns

**API Response Format (Success):**

```typescript
// Standard success response
{
  "data": {
    "principalBalance": "1200.00",
    "feeBalance": "30.00",
    "totalOutstanding": "1230.00"
  }
}

// Or direct response (existing pattern)
{
  "principalBalance": "1200.00",
  "feeBalance": "30.00",
  "totalOutstanding": "1230.00"
}
```

**API Response Format (Error):**

```typescript
// Standard error response
{
  "error": {
    "code": "INSUFFICIENT_PRIVILEGES" | "VERSION_CONFLICT" | "LEDGER_UNAVAILABLE" | "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": {} // Optional additional context
  }
}
```

**Date/Time Format:**
*   **API:** ISO 8601 strings (`2025-12-11T14:30:00Z`)
*   **Display:** `en-AU` locale (`11 Dec 2025, 2:30 pm`)
*   **gRPC Timestamps:** `{ seconds: string, nanos: number }` (converted at API boundary)

**Currency Format:**
*   **Storage:** String with decimal (`"1200.50"`)
*   **Display:** `Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })`

### Communication Patterns

**Optimistic UI Pattern:**

```typescript
// 1. User clicks "Waive Fee"
// 2. Immediately: Add to Zustand optimistic store
optimisticStore.addPending(mutationId, { type: 'waive', amount: 30 });

// 3. Immediately: UI shows greyed-out updated balance
// 4. Background: Call API
const result = await waiveFee(accountId, feeId);

// 5. On Success: Remove from optimistic store, invalidate queries
optimisticStore.resolvePending(mutationId, true);
queryClient.invalidateQueries(['balance', accountId]);

// 6. On Failure: Remove from optimistic store (balance reverts), show toast
optimisticStore.resolvePending(mutationId, false);
toast.error('Waiver failed: ' + result.error.message, { action: { label: 'Retry', onClick: retry } });
```

**Query Key Convention:**

```typescript
// Entity queries
['customer', customerId]
['balance', loanAccountId]
['transactions', loanAccountId, { page, filter }]

// List queries
['approvals', { status: 'pending' }]
```

### Process Patterns

**Loading State Pattern:**

```typescript
// Use TanStack Query's built-in states
const { data, isLoading, isError, error, refetch } = useBalance(accountId);

// For mutations with optimistic UI
const { mutate, isPending } = useWaiveFee();

// Component renders based on state
if (isLoading) return <Skeleton />;
if (isError) return <ErrorBanner message={error.message} onRetry={refetch} />;
return <BalanceCard data={data} isPending={isPending} />;
```

**Error Boundary Pattern:**

```typescript
// Global error boundary in layout
<ErrorBoundary fallback={<GlobalErrorPage />}>
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
</ErrorBoundary>

// Local error boundaries for non-critical sections
<ErrorBoundary fallback={<SectionError />}>
  <TransactionList accountId={accountId} />
</ErrorBoundary>
```

### Enforcement Guidelines

**All AI Agents MUST:**

1.  Use `'use client'` directive for interactive components.
2.  Use named exports (not default exports) for components.
3.  Use CSS Modules (`styles.module.css`) for component-scoped styles.
4.  Format currency using `Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })`.
5.  Handle API errors with the standard `{ error: { code, message } }` format.
6.  Use TanStack Query for all data fetching, with Zustand only for UI/optimistic state.

### Pattern Examples

**Good Example (Component):**

```typescript
'use client'

import { useBalance } from '@/hooks/queries/useBalance'
import { useOptimisticStore } from '@/stores/optimistic'
import styles from './styles.module.css'

interface BalanceCardProps {
  loanAccountId: string
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ loanAccountId }) => {
  const { data, isLoading } = useBalance(loanAccountId)
  const pendingAmount = useOptimisticStore(s => s.getPendingAmount(loanAccountId))
  
  const displayBalance = data ? computeOptimistic(data.totalOutstanding, pendingAmount) : null
  
  // ...
}
```

**Anti-Patterns (Avoid):**

```typescript
// ❌ Default export
export default function BalanceCard() {}

// ❌ Inline styles for repeated elements
<div style={{ color: 'red' }}>Error</div>

// ❌ useState for server data (use TanStack Query)
const [balance, setBalance] = useState(null)
useEffect(() => { fetch(...).then(setBalance) }, [])

// ❌ Direct Zustand mutation in render
useOptimisticStore.getState().addPending(...) // Should use hook selector
```

### Advanced Pattern Refinements

*The following patterns were refined through Advanced Elicitation and Party Mode review.*

#### Entity-Indexed Optimistic Store

Structure the optimistic store by entity ID for O(1) lookups instead of requiring filtering:

```typescript
// stores/optimistic.ts
interface OptimisticStore {
  // Indexed by loanAccountId for direct lookup
  pendingByAccount: Map<string, PendingMutation[]>;
  
  // Actions
  addPending: (loanAccountId: string, mutation: PendingMutation) => void;
  resolvePending: (mutationId: string, success: boolean) => void;
  getPendingForAccount: (loanAccountId: string) => PendingMutation[];
  getPendingAmount: (loanAccountId: string) => number;
}

// Usage in components - O(1) lookup
const pendingMutations = useOptimisticStore(s => s.getPendingForAccount(accountId));
```

#### Mutation Stage Enum (Truth Scale)

Align with the UX "Truth Scale" by tracking mutation stages:

```typescript
// types/mutations.ts
type MutationStage = 
  | 'optimistic'  // Immediate UI update, API not yet called
  | 'submitted'   // API call in flight
  | 'confirmed'   // Backend confirmed success
  | 'failed';     // Backend rejected, rollback needed

interface PendingMutation {
  id: string;                    // Idempotency key
  type: 'waive' | 'repayment' | 'adjustment' | 'writeOff';
  amount: number;
  stage: MutationStage;
  timestamp: number;
  error?: { code: string; message: string };
}
```

**UI Feedback by Stage:**

| Stage | Visual | Copy |
| :--- | :--- | :--- |
| `optimistic` | Greyed balance | "Waiving fee..." |
| `submitted` | Pulse animation | "Confirming with ledger..." |
| `confirmed` | Green flash, then normal | "Fee waived!" (toast) |
| `failed` | Red flash, revert | "Waiver failed" (toast with Retry) |

#### Centralized Error Messages

Map error codes to user-friendly messages consistently:

```typescript
// lib/errors/messages.ts
export const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_PRIVILEGES: "You don't have permission for this action.",
  VERSION_CONFLICT: "This record was modified. Please refresh and try again.",
  LEDGER_UNAVAILABLE: "The ledger is temporarily unavailable. Read-only mode active.",
  VALIDATION_ERROR: "Please check the form for errors.",
  ACCOUNT_NOT_FOUND: "This loan account could not be found.",
  INSUFFICIENT_BALANCE: "The account balance is insufficient for this operation.",
  APPROVAL_REQUIRED: "This action requires approval from a supervisor.",
};

// Usage
import { ERROR_MESSAGES } from '@/lib/errors/messages';

const userMessage = ERROR_MESSAGES[error.code] || error.message;
toast.error(userMessage);
```

#### Idempotency Key Generation

Centralized utility for generating idempotency keys:

```typescript
// lib/utils/idempotency.ts
import { nanoid } from 'nanoid';

/**
 * Generates a unique idempotency key for write operations.
 * Format: {userId}-{action}-{timestamp}-{random}
 */
export function generateIdempotencyKey(
  userId: string,
  action: string
): string {
  const timestamp = Date.now();
  const random = nanoid(8);
  return `${userId}-${action}-${timestamp}-${random}`;
}

// Usage in mutation hooks
const idempotencyKey = generateIdempotencyKey(user.id, 'waive-fee');
```

#### Test Organization

```
tests/
├── unit/                       # Fast, isolated tests
│   ├── components/             # Component unit tests
│   │   └── BalanceCard.test.tsx
│   ├── hooks/                  # Hook unit tests
│   │   └── useOptimisticBalance.test.ts
│   └── stores/                 # Store unit tests
│       └── optimistic.test.ts
├── integration/                # Tests with API mocking
│   └── servicing/
│       ├── waive-fee.test.ts
│       └── repayment.test.ts
└── e2e/                        # Playwright end-to-end
    └── servicing-flow.spec.ts
```

**Test Naming Convention:**
- Unit: `{ComponentName}.test.tsx` or `{hookName}.test.ts`
- Integration: `{feature-name}.test.ts`
- E2E: `{user-flow}.spec.ts`

#### Cross-Component Communication

**Decision:** Query Invalidation (TanStack Query handles refresh automatically)

```typescript
// In WaiveFeeModal after successful mutation
const waiveFeeMutation = useMutation({
  mutationFn: waiveFee,
  onSuccess: () => {
    // Automatically refresh related data
    queryClient.invalidateQueries({ queryKey: ['balance', loanAccountId] });
    queryClient.invalidateQueries({ queryKey: ['transactions', loanAccountId] });
    
    // Close modal and show success
    onClose();
    toast.success('Fee waived successfully');
  },
  onError: (error) => {
    toast.error(ERROR_MESSAGES[error.code] || error.message);
  }
});
```

**Rationale:** This eliminates prop drilling of `refreshKey` and `onRefresh` callbacks. Parent components don't need to manage refresh state—TanStack Query handles it globally.

#### Form State Management

**Decision:** React Hook Form + Zod (consistent with API schemas)

```typescript
// components/LoanAccountServicing/WaiveFeeModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WaiveFeeSchema } from '@/lib/schemas/ledger';

export const WaiveFeeModal: React.FC<Props> = ({ feeId, onClose }) => {
  const form = useForm({
    resolver: zodResolver(WaiveFeeSchema),
    defaultValues: { feeId, reason: '' }
  });
  
  // Form validated before submission, matching API schema
};
```

**Rationale:** Zod schemas are shared between API validation and form validation, ensuring consistency.

## Project Structure & Boundaries

### Complete Project Directory Structure

```
billie-crm/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── eslint.config.mjs
├── next.config.mjs
├── package.json
├── playwright.config.ts
├── pnpm-lock.yaml
├── tsconfig.json
├── vitest.config.mts
├── vitest.setup.ts
│
├── docs/                                    # 📚 Project Documentation
│   ├── architecture.md                      # This document
│   ├── prd.md                               # Product Requirements
│   ├── ux-design-specification.md           # UX Patterns & Flows
│   └── index.md                             # Documentation index
│
├── proto/                                   # 🔌 gRPC Contract Definitions
│   └── accounting_ledger.proto              # Ledger service contract
│
├── src/
│   ├── env.ts                               # 🆕 Zod-validated environment variables
│   │
│   ├── app/
│   │   ├── (frontend)/                      # Public-facing routes (future)
│   │   │   └── customer/[customerId]/page.tsx
│   │   │
│   │   ├── (payload)/                       # Payload Admin Shell
│   │   │   ├── admin/
│   │   │   │   ├── [[...segments]]/page.tsx # Payload catch-all
│   │   │   │   └── importMap.js             # Payload component imports
│   │   │   ├── custom.scss                  # Payload theme overrides
│   │   │   └── layout.tsx                   # Payload layout wrapper
│   │   │
│   │   └── api/                             # 🌐 API Routes (Next.js)
│   │       ├── customer/
│   │       │   └── [customerId]/route.ts    # GET customer details
│   │       ├── ledger/
│   │       │   ├── adjustment/route.ts      # POST manual adjustment
│   │       │   ├── balance/route.ts         # GET live balance
│   │       │   ├── late-fee/route.ts        # POST apply late fee
│   │       │   ├── record/route.ts          # POST record transaction
│   │       │   ├── repayment/route.ts       # POST record repayment
│   │       │   ├── statement/route.ts       # GET account statement
│   │       │   ├── transactions/route.ts    # GET transaction history
│   │       │   ├── waive-fee/route.ts       # POST waive fee
│   │       │   └── write-off/route.ts       # POST request write-off
│   │       └── loan-accounts/
│   │           └── [id]/route.ts            # GET loan account details
│   │
│   ├── collections/                         # 📦 Payload Collections (MongoDB)
│   │   ├── Applications.ts
│   │   ├── Conversations.ts
│   │   ├── Customers.ts                     # Customer read model
│   │   ├── LoanAccounts.ts                  # Loan account read model
│   │   ├── Media.ts
│   │   └── Users.ts                         # Staff users (RBAC)
│   │
│   ├── components/                          # 🧩 React Components
│   │   ├── LoanAccountServicing/            # Feature: Loan Servicing
│   │   │   ├── index.tsx                    # Main servicing view
│   │   │   ├── BalanceCard.tsx              # Live balance display
│   │   │   ├── TransactionList.tsx          # Transaction history
│   │   │   ├── AdjustmentModal.tsx          # Manual adjustment form
│   │   │   ├── ApplyLateFeeModal.tsx        # Late fee application
│   │   │   ├── RecordPaymentModal.tsx       # Payment recording
│   │   │   ├── WaiveFeeModal.tsx            # Fee waiver form
│   │   │   ├── WriteOffModal.tsx            # Write-off request
│   │   │   └── styles.module.css            # Scoped styles
│   │   │
│   │   ├── ui/                              # 🆕 Shared UI Primitives
│   │   │   ├── index.ts                     # Barrel export
│   │   │   ├── CommandBar/                  # Cmd+K search
│   │   │   │   ├── index.tsx
│   │   │   │   ├── CommandBar.tsx
│   │   │   │   └── styles.module.css
│   │   │   ├── OptimisticToast/             # Truth Scale feedback
│   │   │   │   ├── index.tsx
│   │   │   │   └── OptimisticToast.tsx
│   │   │   ├── ContextDrawer/               # Slide-over panel
│   │   │   │   ├── index.tsx
│   │   │   │   └── ContextDrawer.tsx
│   │   │   └── Skeleton/                    # Loading states
│   │   │       └── index.tsx
│   │   │
│   │   └── views/                           # 🆕 Custom Payload Views
│   │       ├── ServicingView/               # Single Customer View
│   │       │   ├── index.tsx
│   │       │   ├── ServicingView.tsx
│   │       │   └── styles.module.css
│   │       └── ApprovalsView/               # Approval Queue
│   │           ├── index.tsx
│   │           ├── ApprovalsView.tsx
│   │           └── styles.module.css
│   │
│   ├── hooks/                               # 🆕 Custom React Hooks
│   │   ├── index.ts                         # Barrel export
│   │   ├── useGlobalHotkeys.ts              # 🆕 Cmd+K, F7 keyboard shortcuts
│   │   ├── queries/                         # TanStack Query hooks (Read)
│   │   │   ├── useBalance.ts                # Fetch live balance
│   │   │   ├── useTransactions.ts           # Fetch transaction list
│   │   │   ├── useCustomer.ts               # Fetch customer profile
│   │   │   ├── useLoanAccount.ts            # Fetch loan account
│   │   │   └── useApprovals.ts              # Fetch pending approvals
│   │   └── mutations/                       # TanStack Mutation hooks (Write)
│   │       ├── useWaiveFee.ts               # Waive fee mutation
│   │       ├── useRecordRepayment.ts        # Record repayment mutation
│   │       ├── useAdjustment.ts             # Manual adjustment mutation
│   │       ├── useWriteOff.ts               # Write-off request mutation
│   │       └── useApproval.ts               # Approve/reject mutation
│   │
│   ├── stores/                              # 🆕 Zustand State Stores
│   │   ├── index.ts                         # Barrel export
│   │   ├── optimistic.ts                    # Pending mutations store
│   │   └── ui.ts                            # UI state (modals, drawers)
│   │
│   ├── providers/                           # 🆕 Provider Wrappers
│   │   ├── index.tsx                        # Combined <Providers> wrapper
│   │   ├── QueryProvider.tsx                # TanStack Query setup
│   │   └── ToastProvider.tsx                # Sonner Toaster setup
│   │
│   ├── middleware/                          # 🆕 Route Middleware
│   │   └── ledger-health.ts                 # Read-Only Mode detection
│   │
│   ├── lib/                                 # 🆕 Shared Utilities
│   │   ├── api/                             # API utilities
│   │   │   └── with-ledger-health.ts        # withLedgerHealth wrapper
│   │   ├── errors/
│   │   │   └── messages.ts                  # ERROR_MESSAGES map
│   │   ├── schemas/                         # Zod schemas
│   │   │   ├── ledger.ts                    # API request/response schemas
│   │   │   └── forms.ts                     # Form validation schemas
│   │   ├── utils/
│   │   │   ├── idempotency.ts               # generateIdempotencyKey()
│   │   │   ├── currency.ts                  # formatCurrency() helper
│   │   │   └── date.ts                      # formatDate() helper
│   │   └── query-client.ts                  # TanStack Query client config
│   │
│   ├── types/                               # 🆕 TypeScript Types
│   │   ├── index.ts                         # Barrel export
│   │   ├── mutations.ts                     # MutationStage, PendingMutation
│   │   └── api.ts                           # API response types
│   │
│   ├── server/                              # Server-side utilities
│   │   └── grpc-client.ts                   # gRPC connection to Ledger
│   │
│   ├── payload-types.ts                     # Auto-generated Payload types
│   └── payload.config.ts                    # Payload CMS configuration
│
├── tests/
│   ├── unit/                                # Fast, isolated tests
│   │   ├── components/                      # 🆕 Component tests
│   │   │   └── BalanceCard.test.tsx
│   │   ├── hooks/                           # 🆕 Hook tests
│   │   │   └── useOptimisticBalance.test.ts
│   │   ├── stores/                          # 🆕 Store tests
│   │   │   └── optimistic.test.ts
│   │   └── collections.test.ts              # Existing collection tests
│   │
│   ├── int/                                 # Integration tests
│   │   ├── fixtures/test-data.ts
│   │   ├── ledger-api.int.spec.ts           # Ledger API integration
│   │   ├── servicing-app.int.spec.ts        # Servicing flow tests
│   │   └── single-customer-view.int.spec.ts # SCV integration
│   │
│   ├── e2e/                                 # Playwright E2E tests
│   │   ├── frontend.e2e.spec.ts
│   │   └── fixtures/                        # 🆕 Playwright fixtures
│   │       └── auth.ts                      # Login as Support/Approver
│   │
│   └── utils/
│       ├── test-helpers.ts
│       ├── render-with-providers.tsx        # 🆕 Test render wrapper
│       └── mocks/                           # 🆕 Mock factories
│           ├── grpc-responses.ts            # Mock ledger responses
│           └── query-client.ts              # Test QueryClient setup
│
└── event-processor/                         # 🐍 Python Event Processor
    ├── Dockerfile
    ├── pyproject.toml
    ├── requirements.txt
    ├── README.md
    ├── src/billie_servicing/
    │   ├── main.py                          # Entry point
    │   └── handlers/
    │       ├── account.py                   # Loan account events
    │       ├── conversation.py              # Chat events
    │       └── customer.py                  # Customer events
    └── tests/
        ├── conftest.py
        └── test_handlers.py
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Pattern | Location |
| :--- | :--- | :--- |
| **External → Web App** | REST/JSON | `/api/ledger/*`, `/api/customer/*` |
| **Web App → Ledger** | gRPC | `src/server/grpc-client.ts` |
| **Event Processor → MongoDB** | Motor (async) | `event-processor/src/` |
| **Redis → Event Processor** | Consumer Groups | Stream subscription |

**Component Boundaries:**

| Layer | Responsibility | Communication |
| :--- | :--- | :--- |
| **Views** (`components/views/`) | Page-level orchestration | Props down, events up |
| **Features** (`components/LoanAccountServicing/`) | Domain logic + UI | Hooks for data, stores for optimistic |
| **UI** (`components/ui/`) | Reusable primitives | Props only (no domain knowledge) |
| **Hooks** (`hooks/`) | Data fetching/mutation | TanStack Query + Zustand |
| **Stores** (`stores/`) | Client-side state | Zustand selectors |
| **Providers** (`providers/`) | Context wrappers | Wrap app at root level |

**Data Boundaries (CQRS):**

```
┌─────────────────────────────────────────────────────────────┐
│                      READ PATH (Query)                      │
│  Browser → API Route → MongoDB (Projection) → JSON Response │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     WRITE PATH (Command)                    │
│  Browser → API Route → gRPC → Ledger Service → Event →     │
│  Redis Stream → Event Processor → MongoDB (Update)          │
└─────────────────────────────────────────────────────────────┘
```

### Requirements to Structure Mapping

**FR1: Global Search (Cmd+K)**
- Component: `src/components/ui/CommandBar/`
- Hook: `src/hooks/queries/useCustomer.ts`, `src/hooks/useGlobalHotkeys.ts`
- Integration: Payload `admin.components` config

**FR4-FR6: Single Customer View**
- View: `src/components/views/ServicingView/`
- Components: `src/components/LoanAccountServicing/`
- Hooks: `useCustomer.ts`, `useLoanAccount.ts`, `useTransactions.ts`

**FR8-FR10: Financial Operations (Write)**
- Mutations: `src/hooks/mutations/useWaiveFee.ts`, `useRecordRepayment.ts`, etc.
- API Routes: `src/app/api/ledger/waive-fee/`, `repayment/`, etc.
- Optimistic Store: `src/stores/optimistic.ts`
- Middleware: `src/lib/api/with-ledger-health.ts`

**FR11: Optimistic UI**
- Store: `src/stores/optimistic.ts`
- Types: `src/types/mutations.ts` (MutationStage enum)
- Components: `OptimisticToast`, `BalanceCard` pending state
- Provider: `src/providers/ToastProvider.tsx`

**FR13-FR14: Approval Workflow**
- View: `src/components/views/ApprovalsView/`
- Hook: `src/hooks/queries/useApprovals.ts`, `src/hooks/mutations/useApproval.ts`

**FR15: Audit Logging**
- Handled by: gRPC Ledger Service (immutable event log)
- Local trace: API route logging

### Cross-Cutting Concerns

| Concern | Location | Pattern |
| :--- | :--- | :--- |
| **Error Messages** | `src/lib/errors/messages.ts` | Centralized `ERROR_MESSAGES` map |
| **Idempotency** | `src/lib/utils/idempotency.ts` | `generateIdempotencyKey()` |
| **Validation** | `src/lib/schemas/` | Zod schemas (shared API + forms) |
| **Query Config** | `src/lib/query-client.ts` | TanStack Query defaults (10s stale) |
| **Currency Format** | `src/lib/utils/currency.ts` | `Intl.NumberFormat('en-AU')` |
| **Environment** | `src/env.ts` | Zod-validated env variables |
| **Global Hotkeys** | `src/hooks/useGlobalHotkeys.ts` | Cmd+K, F7 registration |
| **Health Check** | `src/middleware/ledger-health.ts` | Read-Only Mode detection |

### Provider Hierarchy

```tsx
// src/providers/index.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryProvider>
  );
}

// Usage in layout.tsx
<Providers>
  <PayloadAdminShell />
</Providers>
```

### Test Infrastructure

| Test Type | Location | Setup |
| :--- | :--- | :--- |
| **Unit** | `tests/unit/` | Vitest + `renderWithProviders()` |
| **Integration** | `tests/int/` | Vitest + API mocking |
| **E2E** | `tests/e2e/` | Playwright + `fixtures/auth.ts` |
| **Mocks** | `tests/utils/mocks/` | gRPC responses, QueryClient |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are verified compatible:
- Next.js 15 (App Router) + Payload CMS 3.x: Native integration via `@payloadcms/next`
- TanStack Query v5 + React 18: Full compatibility with concurrent features
- Zustand v4/v5 + React 18: Framework-agnostic, no conflicts
- Zod v3 + TypeScript: Native type inference for API/form schemas

**Pattern Consistency:**
- Naming conventions (PascalCase components, camelCase hooks) applied uniformly
- Query/Mutation separation aligns with CQRS architectural pattern
- Optimistic store pattern complements Query's built-in optimistic updates
- Error codes consistently map to user-facing messages

**Structure Alignment:**
- `hooks/queries/` and `hooks/mutations/` mirror CQRS read/write separation
- `stores/optimistic.ts` provides synchronous client-side state for immediate UI feedback
- API routes (`/api/ledger/*`) directly map to gRPC service methods
- Provider hierarchy properly wraps application at root level

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

| FR | Requirement | Architectural Support |
| :--- | :--- | :--- |
| FR1-3 | Global Search | `CommandBar` + `useCustomer` + `useGlobalHotkeys` |
| FR4-6 | Single Customer View | `ServicingView` + query hooks |
| FR7 | Identity Flags | `Customers` collection fields |
| FR8-10 | Write Actions | `hooks/mutations/*` + `/api/ledger/*` routes |
| FR11-12 | Optimistic UI + Rollback | `stores/optimistic.ts` + `MutationStage` + `OptimisticToast` |
| FR13-14 | Approval Queue | `ApprovalsView` + approval hooks |
| FR15-16 | Audit Logging | gRPC Ledger (immutable event log) |
| FR17 | Segregation of Duties | `withAuth` middleware + self-approval check |
| FR18-19 | Notifications | `ToastProvider` + `sonner` |
| FR20-21 | Read-Only Mode | `ledger-health.ts` + `ui.ts` store |
| FR22-23 | Sync Status | `MutationStage` enum displayed in toast |
| FR24 | Version Conflicts | `VERSION_CONFLICT` error code |

**Non-Functional Requirements Coverage:**

| NFR | Requirement | Architectural Support |
| :--- | :--- | :--- |
| NFR1 | < 100ms UI response | Zustand synchronous updates |
| NFR2 | 10s polling | TanStack Query `staleTime: 10_000` |
| NFR3 | < 1.5s FCP | Server prefetch + HydrationBoundary |
| NFR4 | RBAC on API routes | `withAuth(role)` middleware |
| NFR5 | Data Minimization | Zod typed responses |
| NFR6 | Auditability | gRPC Ledger immutable log |
| NFR7 | Graceful Degradation | Read-Only Mode (API + UI) |
| NFR8 | Error Recovery | Toast with Retry action |
| NFR9 | Keyboard Navigation | `useGlobalHotkeys` + `cmdk` |

### Gap Resolutions

**Gap 1: RBAC Middleware (FR17, NFR4)**

Added `src/lib/api/with-auth.ts` pattern:

```typescript
// src/lib/api/with-auth.ts
import { getPayloadUser } from '@/lib/auth';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

type Role = 'support' | 'approver' | 'admin';

export const withAuth = (requiredRole: Role) => 
  (handler: NextApiHandler) => async (req, res) => {
    const user = await getPayloadUser(req);
    
    if (!user) {
      return res.status(401).json({ 
        error: { code: 'UNAUTHENTICATED', message: 'Please log in.' }
      });
    }
    
    if (!user.roles?.includes(requiredRole)) {
      return res.status(403).json({ 
        error: { code: 'INSUFFICIENT_PRIVILEGES', message: ERROR_MESSAGES.INSUFFICIENT_PRIVILEGES }
      });
    }
    
    req.user = user;
    return handler(req, res);
  };

// Usage
export const POST = withAuth('approver')(async (req) => {
  // Only approvers reach here
});
```

**Gap 2: Segregation of Duties (FR17)**

Self-approval prevention check:

```typescript
// In approval route handler
if (request.requestedBy === currentUser.id) {
  return res.status(403).json({
    error: { code: 'SELF_APPROVAL_FORBIDDEN', message: ERROR_MESSAGES.SELF_APPROVAL_FORBIDDEN }
  });
}
```

Added to `ERROR_MESSAGES`:
```typescript
SELF_APPROVAL_FORBIDDEN: "You cannot approve your own request.",
UNAUTHENTICATED: "Please log in to continue.",
```

**Gap 3: FCP Optimization (NFR3)**

Server prefetch pattern for ServicingView:

```typescript
// src/components/views/ServicingView/page.tsx (server wrapper)
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function ServicingPage({ params }: { params: { customerId: string } }) {
  const queryClient = new QueryClient();
  
  // Parallel prefetch to avoid waterfall
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ['customer', params.customerId], queryFn: fetchCustomer }),
    queryClient.prefetchQuery({ queryKey: ['balance', params.customerId], queryFn: fetchBalance }),
  ]);
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServicingView customerId={params.customerId} />
    </HydrationBoundary>
  );
}
```

**Gap 4: Read-Only Mode UI State (NFR7)**

Enhanced `ui.ts` store:

```typescript
// src/stores/ui.ts
interface UIStore {
  readOnlyMode: boolean;
  setReadOnlyMode: (value: boolean) => void;
  // ... other UI state
}

export const useUIStore = create<UIStore>((set) => ({
  readOnlyMode: false,
  setReadOnlyMode: (value) => set({ readOnlyMode: value }),
}));

// Detection in API response handler
const response = await fetch('/api/ledger/balance');
if (response.headers.get('X-ReadOnly-Mode') === 'true') {
  useUIStore.getState().setReadOnlyMode(true);
}
```

UI components check `readOnlyMode` to disable write buttons and show banner.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (High, Full-stack, Fintech)
- [x] Technical constraints identified (Brownfield, CQRS, Payload CMS)
- [x] Cross-cutting concerns mapped (Auth, Error Handling, Optimistic UI)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified (Next.js 15, Payload 3.x, TanStack Query, Zustand)
- [x] Integration patterns defined (gRPC, REST, Redis Streams)
- [x] Performance considerations addressed (Polling, Prefetch, Optimistic UI)

**✅ Implementation Patterns**
- [x] Naming conventions established (PascalCase, camelCase, kebab-case)
- [x] Structure patterns defined (Feature folders, barrel exports)
- [x] Communication patterns specified (Query invalidation, Zustand selectors)
- [x] Process patterns documented (Error handling, Loading states, RBAC)

**✅ Project Structure**
- [x] Complete directory structure defined (with all new files)
- [x] Component boundaries established (Views → Features → UI)
- [x] Integration points mapped (API routes → gRPC → Event Processor)
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
1. **CQRS Alignment:** Architecture cleanly separates Read (Query) and Write (Mutation) paths
2. **Optimistic UI:** Comprehensive pattern with MutationStage enum and rollback support
3. **Brownfield Integration:** Respects existing Payload/Next.js patterns while adding new capabilities
4. **Implementation Guidance:** Code examples provided for all major patterns
5. **Gap Resolution:** All identified gaps addressed with concrete solutions

**Areas for Future Enhancement:**
- WebSocket real-time updates (if polling proves insufficient post-MVP)
- Cross-tab state synchronization (BroadcastChannel API)
- Advanced caching strategies (persistent query cache)

### Implementation Handoff

**AI Agent Guidelines:**

1. **Follow all architectural decisions exactly as documented**
2. **Use implementation patterns consistently across all components**
3. **Respect project structure and boundaries**
4. **Refer to this document for all architectural questions**
5. **Use the provided code examples as templates**

**First Implementation Priority:**

```bash
# 1. Install new dependencies
pnpm add @tanstack/react-query zustand cmdk sonner zod nanoid react-hook-form @hookform/resolvers

# 2. Create foundational files in order:
# - src/env.ts (environment validation)
# - src/lib/query-client.ts (Query configuration)
# - src/providers/index.tsx (Provider wrapper)
# - src/stores/optimistic.ts (Optimistic state)
# - src/types/mutations.ts (MutationStage enum)
# - src/lib/errors/messages.ts (Error messages)
# - src/lib/api/with-auth.ts (RBAC middleware)
# - src/lib/api/with-ledger-health.ts (Health check)

# 3. Then implement features in order:
# - CommandBar (Global Search)
# - ServicingView (Single Customer View)
# - Mutation hooks (Write actions)
# - ApprovalsView (Approval queue)
```

**Architecture Document Complete.** ✅

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2025-12-11
**Document Location:** `docs/architecture.md`

### Final Architecture Deliverables

**📋 Complete Architecture Document**

- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**

- **5** major architectural decisions made (State Management, Custom Views, API Routes, Error Handling, Real-Time)
- **12** implementation patterns defined (Naming, Structure, Format, Communication, Process)
- **6** architectural component areas specified (Views, Features, UI, Hooks, Stores, Providers)
- **24** functional requirements fully supported
- **9** non-functional requirements fully supported

**📚 AI Agent Implementation Guide**

- Technology stack with verified versions (Next.js 15, Payload CMS 3.x, TanStack Query, Zustand, Zod)
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All functional requirements are supported
- [x] All non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

### Project Success Factors

**🎯 Clear Decision Framework**
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction.

**🔧 Consistency Guarantee**
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly.

**📋 Complete Coverage**
All 33 project requirements (24 FR + 9 NFR) are architecturally supported, with clear mapping from business needs to technical implementation.

**🏗️ Brownfield Integration**
The architecture respects the existing Payload CMS/Next.js foundation while adding new capabilities for the Servicing App features.

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

