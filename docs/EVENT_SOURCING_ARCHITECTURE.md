# Event Sourcing Architecture

> CRM-Originated Events via Redis Streams

## Overview

This document describes the architecture for publishing CRM-originated events (e.g., write-off requests, approvals) through the central event ledger, enabling a unified event-sourcing pattern across the application.

## Current State

### Inbound Events (Already Implemented)

External services publish events to the central ledger, which are routed to application-specific inboxes and consumed by the Python event processor:

```
Ledger Service  ──▶  ChatLedger  ──▶  Event Router  ──▶  inbox:billie-servicing  ──▶  Event Processor  ──▶  MongoDB
                     (central)        (routes by type)   (app inbox)                 (Python)              (Projections)
```

**Event Types:**
- `account.created.v1`, `account.updated.v1`, `account.schedule.created.v1`
- `customer.changed.v1`, `customer.verified.v1`
- `conversation_started`, `user_input`, `assistant_response`

### CRM Operations (Current - Direct Write)

CRM operations currently write directly to MongoDB via Payload:

```
CRM UI  ──▶  Payload REST API  ──▶  MongoDB (direct write)
```

**Operations:**
- Write-off request submission
- Write-off approval/rejection
- (Future) Notes, flags, manual adjustments

## Target State

CRM-originated events publish to a dedicated internal stream, avoiding external dependencies:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UNIFIED EVENT FLOW                                   │
│                                                                             │
│  ┌─────────────────┐                      ┌─────────────────────────────┐  │
│  │ External Events │                      │ CRM-Originated Events       │  │
│  │ (Ledger Service)│                      │ (billie-crm)                │  │
│  └────────┬────────┘                      └─────────────┬───────────────┘  │
│           │                                             │                   │
│           │  account.created.v1                         │  writeoff.requested.v1
│           │  customer.changed.v1                        │  writeoff.approved.v1
│           │                                             │                   │
│           ▼                                             │                   │
│  ┌─────────────────────┐                                │                   │
│  │     ChatLedger      │                                │                   │
│  │  (ecosystem stream) │                                │                   │
│  └──────────┬──────────┘                                │                   │
│             │                                           │                   │
│             ▼                                           │                   │
│  ┌─────────────────────┐                                │                   │
│  │    Event Router     │                                │                   │
│  │ (external service)  │                                │                   │
│  └──────────┬──────────┘                                │                   │
│             │                                           │                   │
│             ▼                                           ▼                   │
│  ┌─────────────────────────────┐   ┌────────────────────────────────────┐  │
│  │  inbox:billie-servicing     │   │  inbox:billie-servicing:internal   │  │
│  │  (external events)          │   │  (CRM internal events)             │  │
│  └─────────────┬───────────────┘   └──────────────────┬─────────────────┘  │
│                │                                       │                    │
│                └───────────────────┬───────────────────┘                    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   Event Processor (Python)                           │  │
│  │                   Consumes from BOTH streams                         │  │
│  │                   Consumer Group: billie-servicing-processor         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     MongoDB (Payload Collections)                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Decision: Direct Internal Stream

CRM-originated events publish directly to `inbox:billie-servicing:internal` rather than
going through the external Event Router via `chatLedger`. This design choice:

- **Eliminates external dependency** - Internal operations don't depend on the Event Router
- **Reduces latency** - Events flow directly to the processor
- **Improves reliability** - Fewer moving parts for critical internal workflows
- **Maintains separation** - Internal events are clearly namespaced

## Configuration

All stream names and event types are configurable via environment variables:

```bash
# Redis Streams (CRM / TypeScript)
REDIS_PUBLISH_STREAM=inbox:billie-servicing:internal  # Internal stream for CRM events

# Redis Streams (Event Processor / Python)  
INBOX_STREAM=inbox:billie-servicing           # External events (from Event Router)
INTERNAL_STREAM=inbox:billie-servicing:internal  # Internal events (from CRM)

# Event Types
EVENT_TYPE_WRITEOFF_REQUESTED=writeoff.requested.v1
EVENT_TYPE_WRITEOFF_APPROVED=writeoff.approved.v1
EVENT_TYPE_WRITEOFF_REJECTED=writeoff.rejected.v1
EVENT_TYPE_WRITEOFF_CANCELLED=writeoff.cancelled.v1
```

### Event Type Registry

For external routing configuration, these are the CRM-originated event types:

| Event Type | Description |
|------------|-------------|
| `writeoff.requested.v1` | Write-off request submitted |
| `writeoff.approved.v1` | Write-off request approved |
| `writeoff.rejected.v1` | Write-off request rejected |
| `writeoff.cancelled.v1` | Write-off request cancelled |

## Event Envelope

All events follow the LedgerMessage format for consistency with the existing event ecosystem:

```typescript
interface CRMEvent<T = unknown> {
  // Core envelope (required)
  conv: string       // Request ID - groups related events (e.g., request + approval)
  agt: string        // Agent identifier - always "billie-crm"
  usr: string        // User ID who triggered the action
  seq: 1             // Always 1 for CRM events
  cls: 'msg'         // Class - always "msg"
  typ: string        // Event type (e.g., "writeoff.requested.v1")
  
  // Idempotency
  cause: string      // Unique event ID for deduplication
  
  // Payload
  payload: T         // Event-specific payload (serialized as JSON string)
}
```

### Field Values

| Field | Value | Notes |
|-------|-------|-------|
| `conv` | Request ID | Generated UUID on `writeoff.requested`, reused for approve/reject/cancel |
| `agt` | `"billie-crm"` | Fixed value identifying the CRM as event source |
| `usr` | User ID | Payload CMS user ID who triggered the action |
| `seq` | `1` | Always 1 (not used for sequencing in this context) |
| `cls` | `"msg"` | Message class |
| `typ` | Event type | Versioned event type (e.g., `"writeoff.requested.v1"`) |
| `cause` | Event ID | UUID generated per event for idempotency/deduplication |
| `payload` | JSON string | Event-specific data, serialized |

### Fields NOT Set

These fields are handled by the event router and should **not** be set by the CRM:

- `rec` - Recipients (routing configured externally)
- `c_seq` - Cause sequence (not applicable)

### Conversation ID (`conv`) Strategy

The `conv` field groups related events in a workflow:

```
writeoff.requested.v1  ─┐
                        ├──▶  conv = "req_abc123"  (same request ID)
writeoff.approved.v1   ─┘
```

- **On `writeoff.requested`**: Generate a new UUID as the Request ID, use as `conv`
- **On `approve/reject/cancel`**: Look up the existing request, use its Request ID as `conv`

This enables:
1. Tracing the complete lifecycle of a write-off request
2. Correlating events in logs and debugging
3. Potential future features like event replay per request

## CRM Event Types

### Write-Off Events

#### `writeoff.requested.v1`

Published when a user submits a write-off request.

```typescript
interface WriteOffRequestedPayload {
  loanAccountId: string
  customerId: string
  customerName: string
  accountNumber: string
  amount: number
  originalBalance: number
  reason: 'hardship' | 'bankruptcy' | 'deceased' | 'unable_to_locate' | 
          'fraud_victim' | 'disputed' | 'aged_debt' | 'other'
  notes?: string
  priority: 'normal' | 'high' | 'urgent'
  requestedBy: string      // User ID
  requestedByName: string  // User name for audit
}
```

**Projection:** Creates new document in `write-off-requests` collection with status `"pending"`.

#### `writeoff.approved.v1`

Published when a supervisor approves a write-off request.

```typescript
interface WriteOffApprovedPayload {
  requestId: string        // Write-off request ID
  requestNumber: string    // WO-XXXXX reference
  comment: string          // Approval comment (min 10 chars)
  approvedBy: string       // User ID
  approvedByName: string   // User name for audit
}
```

**Projection:** Updates document status to `"approved"`, sets `approvalDetails`.

#### `writeoff.rejected.v1`

Published when a supervisor rejects a write-off request.

```typescript
interface WriteOffRejectedPayload {
  requestId: string
  requestNumber: string
  reason: string           // Rejection reason (min 10 chars)
  rejectedBy: string
  rejectedByName: string
}
```

**Projection:** Updates document status to `"rejected"`, sets `approvalDetails`.

#### `writeoff.cancelled.v1`

Published when a user cancels their pending write-off request.

```typescript
interface WriteOffCancelledPayload {
  requestId: string
  requestNumber: string
  cancelledBy: string
  cancelledByName: string
}
```

**Projection:** Updates document status to `"cancelled"`.

## Command API Design

### Pattern: Command → Event → Projection

```
POST /api/commands/writeoff/request
  │
  ├─▶ Authenticate user
  ├─▶ Validate command payload
  ├─▶ Generate request ID (conv) and event ID (cause)
  ├─▶ Publish event to Redis (with retry)
  └─▶ Return 202 Accepted { eventId, requestId, status: "accepted" }
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/commands/writeoff/request` | Submit write-off request |
| POST | `/api/commands/writeoff/approve` | Approve pending request |
| POST | `/api/commands/writeoff/reject` | Reject pending request |
| POST | `/api/commands/writeoff/cancel` | Cancel pending request |

### Response Format

```typescript
// Success (202 Accepted)
{
  eventId: string       // UUID for tracking (cause field)
  requestId: string     // Request ID for workflow correlation (conv field)
  status: "accepted"    // Event accepted for processing
  message: string       // Human-readable message
}

// Error (4xx/5xx)
{
  error: {
    code: string        // Error code
    message: string     // Human-readable message
  }
}
```

### Failure Handling

If Redis is unavailable, the command API retries with exponential backoff before failing:

```typescript
async function publishEvent(event: CRMEvent): Promise<{ eventId: string }> {
  const maxRetries = 3
  const backoffs = [100, 200, 400] // milliseconds
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const streamKey = config.publishStream // inbox:billie-servicing:internal
      await redis.xadd(streamKey, '*', eventToRecord(event))
      return { eventId: event.cause }
    } catch (error) {
      if (attempt < maxRetries - 1) {
        await sleep(backoffs[attempt])
        continue
      }
      // All retries exhausted
      throw new EventPublishError(
        'Failed to publish event after retries',
        { cause: error, attempts: maxRetries }
      )
    }
  }
  
  // TypeScript: unreachable but satisfies return type
  throw new Error('Unexpected state')
}
```

**Behavior:**
- **Attempt 1**: Immediate
- **Attempt 2**: After 100ms
- **Attempt 3**: After 200ms (total 300ms elapsed)
- **Failure**: After 400ms, return 503 Service Unavailable

The client sees an error and can retry the action. No silent failures.

## Client Integration

### Polling for Result

After publishing a command, clients poll for the projection:

```typescript
// src/hooks/mutations/useWriteOffRequest.ts
const mutation = useMutation({
  mutationFn: async (params) => {
    // 1. Publish command
    const { eventId } = await fetch('/api/commands/writeoff/request', {
      method: 'POST',
      body: JSON.stringify(params),
    }).then(r => r.json())
    
    // 2. Poll for projection (max 5 seconds)
    return pollForProjection(eventId, {
      maxAttempts: 10,
      intervalMs: 500,
    })
  },
})
```

### Polling Implementation

```typescript
async function pollForProjection(eventId: string, options: PollOptions) {
  for (let i = 0; i < options.maxAttempts; i++) {
    const result = await fetch(`/api/write-off-requests?where[eventId][equals]=${eventId}`)
    const { docs } = await result.json()
    
    if (docs.length > 0) {
      return docs[0]
    }
    
    await sleep(options.intervalMs)
  }
  
  throw new Error('Projection not found within timeout')
}
```

## Event Processor Handlers

### Python Handler Structure

```python
# event-processor/src/billie_servicing/handlers/writeoff.py

async def handle_writeoff_requested(db: AsyncIOMotorDatabase, event: dict) -> None:
    """Handle writeoff.requested.v1 event."""
    payload = event.get("payload", {})
    if isinstance(payload, str):
        payload = json.loads(payload)
    
    # Generate request number for display
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    random_suffix = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=4))
    request_number = f"WO-{timestamp}-{random_suffix}"
    
    document = {
        # IDs for lookup and correlation
        "requestId": event.get("conv"),                    # Request ID (conv) for workflow correlation
        "eventId": event.get("cause"),                     # Event ID for polling lookup
        "requestNumber": request_number,                   # Human-readable reference
        
        # Account/customer info
        "loanAccountId": payload["loanAccountId"],
        "customerId": payload["customerId"],
        "customerName": payload.get("customerName", ""),
        "accountNumber": payload.get("accountNumber", ""),
        
        # Request details
        "amount": payload["amount"],
        "originalBalance": payload.get("originalBalance"),
        "reason": payload["reason"],
        "notes": payload.get("notes"),
        "priority": payload.get("priority", "normal"),
        "status": "pending",
        
        # Audit
        "requestedBy": payload["requestedBy"],
        "requestedByName": payload["requestedByName"],
        "requestedAt": datetime.utcnow(),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    
    await db["write-off-requests"].insert_one(document)


async def handle_writeoff_approved(db: AsyncIOMotorDatabase, event: dict) -> None:
    """Handle writeoff.approved.v1 event."""
    payload = event.get("payload", {})
    if isinstance(payload, str):
        payload = json.loads(payload)
    
    request_id = event.get("conv")  # Use conv to find the request
    
    await db["write-off-requests"].update_one(
        {"requestId": request_id},
        {
            "$set": {
                "status": "approved",
                "approvalDetails": {
                    "approvedBy": payload["approvedBy"],
                    "approvedByName": payload["approvedByName"],
                    "comment": payload["comment"],
                    "approvedAt": datetime.utcnow(),
                },
                "updatedAt": datetime.utcnow(),
            }
        }
    )
```

### Handler Registration

```python
# event-processor/src/billie_servicing/main.py

from .handlers.writeoff import (
    handle_writeoff_requested,
    handle_writeoff_approved,
    handle_writeoff_rejected,
    handle_writeoff_cancelled,
)

def setup_handlers(processor: EventProcessor) -> None:
    # Existing handlers
    processor.register_handler("account.created.v1", handle_account_created)
    # ...
    
    # New write-off handlers
    processor.register_handler("writeoff.requested.v1", handle_writeoff_requested)
    processor.register_handler("writeoff.approved.v1", handle_writeoff_approved)
    processor.register_handler("writeoff.rejected.v1", handle_writeoff_rejected)
    processor.register_handler("writeoff.cancelled.v1", handle_writeoff_cancelled)
```

## Implementation Plan

### Phase 1: Infrastructure (TypeScript)

| File | Description |
|------|-------------|
| `src/lib/events/config.ts` | Stream names, event types (from env vars) |
| `src/lib/events/types.ts` | CRMEvent interface, payload types |
| `src/lib/events/schemas.ts` | Zod validation schemas |
| `src/server/redis-client.ts` | Redis connection singleton |
| `src/server/event-publisher.ts` | `publishEvent()` with retry logic |

### Phase 2: Command APIs

| File | Description |
|------|-------------|
| `src/app/api/commands/writeoff/request/route.ts` | Request command |
| `src/app/api/commands/writeoff/approve/route.ts` | Approve command |
| `src/app/api/commands/writeoff/reject/route.ts` | Reject command |
| `src/app/api/commands/writeoff/cancel/route.ts` | Cancel command |

### Phase 3: Event Processor (Python)

| File | Description |
|------|-------------|
| `handlers/writeoff.py` | All write-off event handlers |
| `main.py` | Register new handlers |

### Phase 4: Client Integration

| File | Description |
|------|-------------|
| `src/lib/events/poll.ts` | Polling utility |
| `src/hooks/mutations/useWriteOffRequest.ts` | Updated to use commands |
| `src/hooks/mutations/useApproveWriteOff.ts` | Updated to use commands |
| `src/hooks/mutations/useRejectWriteOff.ts` | Updated to use commands |

### Phase 5: Collection Updates

| File | Description |
|------|-------------|
| `src/collections/WriteOffRequests.ts` | Add `requestId` (conv) and `eventId` (cause) fields |

## Guarantees

### At-Least-Once Delivery

The event processor uses Redis consumer groups with manual XACK:
- Events are not acknowledged until MongoDB write succeeds
- Failed events go to DLQ after max retries

### Idempotency

Deduplication via `cause` field:
- Each event includes a unique `cause` (event ID)
- Processor can check if event was already processed before writing
- Duplicate events are acknowledged but not re-processed

### Eventual Consistency

Clients must handle the eventual consistency model:
- Commands return 202 immediately (event published)
- Projections appear after processing (typically <1 second)
- Client polls for projection using `eventId`
- Timeout after ~5 seconds with user-friendly error

### Publish Reliability

CRM-side publish failures are handled with retry:
- 3 attempts with exponential backoff (100ms, 200ms, 400ms)
- Client receives 503 if all retries fail
- No silent failures - user can retry the action

## Future Extensions

### Additional CRM Events

| Event | Description |
|-------|-------------|
| `note.added.v1` | User adds note to customer/account |
| `flag.added.v1` | User flags a customer |
| `manual_adjustment.v1` | Manual balance adjustment |

### Event Versioning

When event schemas evolve:
1. Create new version (e.g., `writeoff.requested.v2`)
2. Add handler for new version
3. Keep old handler for backwards compatibility
4. Deprecate old version after migration

---

*Document created: December 2024*
*Last updated: December 2024*
