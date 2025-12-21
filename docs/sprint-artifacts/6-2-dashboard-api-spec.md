# Dashboard API Technical Specification

**Story:** 6.2 - Dashboard Home Page
**Endpoint:** `GET /api/dashboard`
**Created:** 2025-12-11
**Status:** Ready for Implementation

---

## Overview

The Dashboard API provides aggregated data for the home page, combining user context, action items, recent customers summary, and system status in a single request to avoid N+1 query patterns.

## Endpoint

```
GET /api/dashboard
```

### Authentication

- **Required:** Yes (Payload session cookie)
- **Roles:** All authenticated users (support, approver, admin)

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recentCustomerIds` | string | No | Comma-separated list of customer IDs from localStorage |

**Example:**
```
GET /api/dashboard?recentCustomerIds=CUST-001,CUST-042,CUST-007
```

---

## Response Schema

### Success Response (200 OK)

```typescript
interface DashboardResponse {
  user: {
    firstName: string;
    role: 'support' | 'approver' | 'admin';
  };
  actionItems: {
    pendingApprovalsCount: number;  // 0 if not approver
    failedActionsCount: number;     // Echoed from client (future: server-side)
  };
  recentCustomersSummary: Array<{
    customerId: string;
    name: string;
    accountCount: number;
    totalOutstanding: string;  // Formatted currency, e.g., "$1,250.00"
  }>;
  systemStatus: {
    ledger: 'online' | 'degraded' | 'offline';
    latencyMs: number;
    lastChecked: string;  // ISO 8601 timestamp
  };
}
```

### Example Response

```json
{
  "user": {
    "firstName": "Rohan",
    "role": "approver"
  },
  "actionItems": {
    "pendingApprovalsCount": 3,
    "failedActionsCount": 0
  },
  "recentCustomersSummary": [
    {
      "customerId": "CUST-001",
      "name": "John Smith",
      "accountCount": 2,
      "totalOutstanding": "$1,250.00"
    },
    {
      "customerId": "CUST-042",
      "name": "Jane Doe",
      "accountCount": 1,
      "totalOutstanding": "$500.00"
    }
  ],
  "systemStatus": {
    "ledger": "online",
    "latencyMs": 45,
    "lastChecked": "2025-12-11T14:30:00.000Z"
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHENTICATED` | No valid session |
| 500 | `INTERNAL_ERROR` | Server error |

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Please log in to continue."
  }
}
```

---

## Implementation Details

### File Location

```
src/app/api/dashboard/route.ts
```

### Dependencies

| Dependency | Purpose |
|------------|---------|
| `@/lib/auth` | `getPayloadUser()` for session |
| `@/server/grpc-client` | `ledgerClient.healthCheck()` |
| `@/payload` | Payload Local API for queries |
| `zod` | Response validation |

### Data Sources

| Field | Source | Query |
|-------|--------|-------|
| `user` | Payload session | `getPayloadUser(request)` |
| `pendingApprovalsCount` | MongoDB | `payload.find({ collection: 'write-off-requests' })` |
| `recentCustomersSummary` | MongoDB | `payload.find({ collection: 'customers' })` |
| `systemStatus.ledger` | gRPC | `ledgerClient.healthCheck()` |

### Performance Considerations

1. **Parallel Fetching:** All data sources queried in parallel using `Promise.all()`
2. **Selective Queries:** Pending approvals only queried for approver/admin roles
3. **Limit Enforcement:** Recent customers capped at 10 (from client) and 5 displayed
4. **No Deep Joins:** Customer summary uses indexed fields only

### Caching Strategy

| Data | Cache | Rationale |
|------|-------|-----------|
| User context | No | Changes on role update |
| Pending approvals | No | Must be real-time |
| Recent customers | 30s | Stable, infrequent changes |
| System status | 10s | Matches health check interval |

**Implementation:**

```typescript
// Use TanStack Query on client with appropriate staleTime
const { data } = useQuery({
  queryKey: ['dashboard', recentCustomerIds],
  queryFn: () => fetchDashboard(recentCustomerIds),
  staleTime: 10_000,  // 10 seconds
  refetchOnWindowFocus: true,
});
```

---

## Zod Schema

```typescript
// src/lib/schemas/dashboard.ts
import { z } from 'zod';

export const DashboardResponseSchema = z.object({
  user: z.object({
    firstName: z.string(),
    role: z.enum(['support', 'approver', 'admin']),
  }),
  actionItems: z.object({
    pendingApprovalsCount: z.number().int().min(0),
    failedActionsCount: z.number().int().min(0),
  }),
  recentCustomersSummary: z.array(z.object({
    customerId: z.string(),
    name: z.string(),
    accountCount: z.number().int().min(0),
    totalOutstanding: z.string(),
  })),
  systemStatus: z.object({
    ledger: z.enum(['online', 'degraded', 'offline']),
    latencyMs: z.number().int().min(0),
    lastChecked: z.string().datetime(),
  }),
});

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
```

---

## Route Implementation

```typescript
// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayloadUser } from '@/lib/auth';
import { ledgerClient } from '@/server/grpc-client';
import { getPayload } from 'payload';
import config from '@payload-config';
import { DashboardResponseSchema, type DashboardResponse } from '@/lib/schemas/dashboard';
import { formatCurrency } from '@/lib/utils/currency';

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const user = await getPayloadUser(request);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Please log in to continue.' } },
      { status: 401 }
    );
  }

  // 2. Parse query params
  const recentIdsParam = request.nextUrl.searchParams.get('recentCustomerIds');
  const recentIds = recentIdsParam ? recentIdsParam.split(',').filter(Boolean).slice(0, 10) : [];

  // 3. Parallel fetch all data
  const payload = await getPayload({ config });
  const isApprover = user.roles?.includes('approver') || user.roles?.includes('admin');

  const [approvalsResult, ledgerHealth, customersResult] = await Promise.all([
    // Only query approvals if user has permission
    isApprover
      ? payload.find({
          collection: 'write-off-requests',
          where: { status: { equals: 'pending' } },
          limit: 0, // Count only
        })
      : Promise.resolve({ totalDocs: 0 }),

    // Check ledger health
    ledgerClient.healthCheck().catch(() => ({
      status: 'offline' as const,
      latency: 0,
    })),

    // Fetch recent customers if IDs provided
    recentIds.length > 0
      ? payload.find({
          collection: 'customers',
          where: { id: { in: recentIds } },
          limit: 10,
        })
      : Promise.resolve({ docs: [] }),
  ]);

  // 4. Build response
  const response: DashboardResponse = {
    user: {
      firstName: user.firstName || user.email?.split('@')[0] || 'User',
      role: (user.roles?.[0] as 'support' | 'approver' | 'admin') || 'support',
    },
    actionItems: {
      pendingApprovalsCount: approvalsResult.totalDocs,
      failedActionsCount: 0, // Client tracks this via localStorage
    },
    recentCustomersSummary: customersResult.docs.map((customer) => ({
      customerId: customer.id,
      name: customer.name || 'Unknown',
      accountCount: customer.loanAccounts?.length || 0,
      totalOutstanding: formatCurrency(customer.totalOutstanding || 0),
    })),
    systemStatus: {
      ledger: ledgerHealth.status,
      latencyMs: ledgerHealth.latency,
      lastChecked: new Date().toISOString(),
    },
  };

  // 5. Validate and return
  const validated = DashboardResponseSchema.parse(response);
  return NextResponse.json(validated);
}
```

---

## Client-Side Hook

```typescript
// src/hooks/queries/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { useRecentCustomersStore } from '@/stores/recentCustomers';
import type { DashboardResponse } from '@/lib/schemas/dashboard';

async function fetchDashboard(recentCustomerIds: string[]): Promise<DashboardResponse> {
  const params = recentCustomerIds.length > 0
    ? `?recentCustomerIds=${recentCustomerIds.join(',')}`
    : '';
  
  const response = await fetch(`/api/dashboard${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard');
  }
  return response.json();
}

export function useDashboard() {
  const recentCustomers = useRecentCustomersStore((s) => s.customers);
  const recentCustomerIds = recentCustomers.map((c) => c.customerId);

  return useQuery({
    queryKey: ['dashboard', recentCustomerIds],
    queryFn: () => fetchDashboard(recentCustomerIds),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000, // Refresh every 30s for pending approvals
  });
}
```

---

## Testing Requirements

### Unit Tests

```typescript
// tests/unit/api/dashboard.test.ts
describe('GET /api/dashboard', () => {
  it('returns 401 when not authenticated');
  it('returns user context with firstName and role');
  it('returns pendingApprovalsCount only for approvers');
  it('returns 0 pendingApprovalsCount for support users');
  it('returns recentCustomersSummary for provided IDs');
  it('returns empty recentCustomersSummary when no IDs provided');
  it('returns systemStatus with ledger health');
  it('handles ledger offline gracefully');
  it('limits recentCustomerIds to 10');
  it('validates response against Zod schema');
});
```

### Integration Tests

```typescript
// tests/int/dashboard-api.int.spec.ts
describe('Dashboard API Integration', () => {
  it('aggregates data from multiple sources in parallel');
  it('respects role-based access for approvals count');
  it('returns correct customer data for provided IDs');
});
```

---

## Security Considerations

| Consideration | Mitigation |
|---------------|------------|
| **Authentication** | Session cookie validated via `getPayloadUser()` |
| **Authorization** | Approvals count only returned for approver/admin roles |
| **Input Validation** | `recentCustomerIds` sanitized, limited to 10 IDs |
| **Data Leakage** | Only returns customers from provided IDs (user's own history) |
| **Rate Limiting** | Inherited from Next.js/Vercel defaults |

---

## Rollout Plan

1. **Phase 1:** Implement API route with Zod schema
2. **Phase 2:** Create `useDashboard` hook
3. **Phase 3:** Build DashboardView component consuming the hook
4. **Phase 4:** Configure Payload afterLogin redirect

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-11 | Initial specification created |
