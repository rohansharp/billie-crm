# Billie Servicing App - Architecture

## System Overview

The Billie Servicing App uses a **hybrid Python/Node.js architecture** with **Payload CMS collections** (MongoDB) as the projection store:

1. **Python Event Processor** - Consumes events from Redis inbox, writes to MongoDB
2. **Payload CMS (Next.js)** - Staff UI with native collection access
3. **Redis** - Event inbox stream only (not for projections)
4. **MongoDB** - Payload collections for all data

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BILLIE SERVICING APP                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                         PAYLOAD CMS (Next.js)                                  │  │
│  │                                                                                │  │
│  │  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────────┐  │  │
│  │  │   Staff IDAM    │   │  Payload Admin  │   │   Custom UI Components      │  │  │
│  │  │   (Keycloak)    │   │     Panel       │   │  (Single Customer View)     │  │  │
│  │  └────────┬────────┘   └────────┬────────┘   └──────────────┬──────────────┘  │  │
│  │           │                     │                           │                  │  │
│  │           ▼                     ▼                           ▼                  │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │                         Payload CMS Core                                │   │  │
│  │  │                                                                         │   │  │
│  │  │   • Native collection queries (find, findByID)                         │   │  │
│  │  │   • Relationship population                                            │   │  │
│  │  │   • Access control                                                     │   │  │
│  │  │   • Admin panel views                                                  │   │  │
│  │  └──────────┬─────────────────────────────────────────────────────────────┘   │  │
│  │             │                                                                  │  │
│  │             │  Native MongoDB Access                                          │  │
│  │             ▼                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │                    Next.js API Routes                                   │   │  │
│  │  │                                                                         │   │  │
│  │  │   /api/ledger/*           /api/customer/*         /api/search/*        │   │  │
│  │  │   (gRPC Proxy)            (Payload queries)       (Payload queries)    │   │  │
│  │  └──────────┬─────────────────────────────────────────────────────────────┘   │  │
│  │             │                                                                  │  │
│  └─────────────┼──────────────────────────────────────────────────────────────────┘  │
│                │                                                                     │
│                │ gRPC                                                               │
│                ▼                                                                     │
│  ┌─────────────────────────┐                                                        │
│  │  Accounting Ledger      │                                                        │
│  │  Service (External)     │                                                        │
│  └─────────────────────────┘                                                        │
│                                                                                      │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                              MONGODB                                          │   │
│  │                                                                               │   │
│  │   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────┐   │   │
│  │   │   customers     │   │   loan-accounts │   │   conversations         │   │   │
│  │   │   (Payload)     │   │   (Payload)     │   │   (Payload)             │   │   │
│  │   └─────────────────┘   └─────────────────┘   └─────────────────────────┘   │   │
│  │                                                                               │   │
│  │   ┌─────────────────┐                                                        │   │
│  │   │   users         │   Payload CMS native collections                       │   │
│  │   │   (Payload)     │                                                        │   │
│  │   └─────────────────┘                                                        │   │
│  │                                                                               │   │
│  └───────────────────────────────────────────▲───────────────────────────────────┘   │
│                                              │                                       │
│                                              │ Writes (motor/pymongo)               │
│                                              │                                       │
│  ┌───────────────────────────────────────────┴───────────────────────────────────┐  │
│  │                     PYTHON EVENT PROCESSOR (Daemon)                            │  │
│  │                                                                                │  │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │   │  Billie Event SDKs                                                       │ │  │
│  │   │                                                                          │ │  │
│  │   │  billie_accounts_events (v2.2.0)                                        │ │  │
│  │   │    • parse_account_message() → AccountCreatedV1, etc.                   │ │  │
│  │   │                                                                          │ │  │
│  │   │  billie_customers_events (v2.0.0)                                       │ │  │
│  │   │    • parse_customer_message() → CustomerChangedV1, etc.                 │ │  │
│  │   └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │   │  Event Handlers                                                          │ │  │
│  │   │                                                                          │ │  │
│  │   │  • account.created.v1        → upsert loan-accounts                     │ │  │
│  │   │  • account.updated.v1        → update loan-accounts                     │ │  │
│  │   │  • account.status_changed.v1 → update loan-accounts status              │ │  │
│  │   │  • account.schedule.created.v1 → add repayment schedule                 │ │  │
│  │   │  • customer.changed.v1       → upsert customers                         │ │  │
│  │   │  • customer.created.v1       → upsert customers                         │ │  │
│  │   │  • chat events               → upsert conversations                     │ │  │
│  │   └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │   │  Transactional Guarantees                                                │ │  │
│  │   │                                                                          │ │  │
│  │   │  • Consumer group: billie-servicing-processor                           │ │  │
│  │   │  • XACK only after successful MongoDB write                             │ │  │
│  │   │  • Process XPENDING on startup for recovery                             │ │  │
│  │   │  • Deduplication via event_id with 24h TTL                              │ │  │
│  │   │  • Dead letter queue after 3 retries                                    │ │  │
│  │   └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                              ▲                                 │  │
│  └──────────────────────────────────────────────┼─────────────────────────────────┘  │
│                                                 │                                    │
│                                                 │ Consumes                          │
│                                                 │                                    │
│  ┌──────────────────────────────────────────────┴─────────────────────────────────┐  │
│  │                              REDIS                                              │  │
│  │                                                                                 │  │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │   │   inbox:billie-servicing (Stream)                                       │  │  │
│  │   │                                                                          │  │  │
│  │   │   Events routed by broker from:                                         │  │  │
│  │   │   • accountsService (account.*, payment.*)                              │  │  │
│  │   │   • customerService (customer.*, application.*)                         │  │  │
│  │   │   • chatLedger (conversation events)                                    │  │  │
│  │   └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                 │  │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │   │   dedup:* (String with TTL)     │   dlq:billie-servicing (Stream)      │  │  │
│  │   │   Deduplication keys            │   Dead letter queue                  │  │  │
│  │   └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Billie Event SDKs

The event processor uses official Billie event SDKs for parsing events from the inbox stream.

### SDK Installation

```bash
# requirements.txt / pyproject.toml
git+https://${GITHUB_TOKEN}@github.com/BillieLoans/billie-event-sdks.git@accounts-v2.2.0#subdirectory=packages/accounts
git+https://${GITHUB_TOKEN}@github.com/BillieLoans/billie-event-sdks.git@customers-v2.0.0#subdirectory=packages/customers
```

### SDK Overview

| SDK Package | Import | Parser Function | Version |
|-------------|--------|-----------------|---------|
| `billie_accounts_events` | `from billie_accounts_events.parser import parse_account_message` | `parse_account_message()` | v2.2.0 |
| `billie_customers_events` | `from billie_customers_events.parser import parse_customer_message` | `parse_customer_message()` | v2.0.0 |

### Event Routing

```python
def route_event(event_type: str, event_data: dict):
    """Route event to appropriate SDK parser."""
    
    if event_type.startswith('account.') or event_type.startswith('payment.'):
        # Use accounts SDK
        from billie_accounts_events.parser import parse_account_message
        return parse_account_message(event_data)
    
    elif event_type.startswith('customer.') or event_type.startswith('application.'):
        # Use customers SDK
        from billie_customers_events.parser import parse_customer_message
        return parse_customer_message(event_data)
    
    else:
        # Chat events - parse manually
        return event_data
```

### ParsedEvent Wrapper

The SDKs return a `ParsedEvent` wrapper with envelope metadata:

```python
event = parse_account_message(event_data)

event.event_type        # e.g., "account.created.v1"
event.conversation_id   # Correlation ID
event.sequence          # Event sequence number
event.user_id           # Customer ID from envelope
event.payload           # Typed payload object (e.g., AccountCreatedV1)
```

---

## Event Types Handled

### Accounts SDK Events

| Event Type | Handler | Target Collection | Description |
|------------|---------|-------------------|-------------|
| `account.created.v1` | `handle_account_created` | `loan-accounts` | Create new loan account |
| `account.updated.v1` | `handle_account_updated` | `loan-accounts` | Update balance, last payment |
| `account.status_changed.v1` | `handle_account_status_changed` | `loan-accounts` | Update account status |
| `account.schedule.created.v1` | `handle_schedule_created` | `loan-accounts` | Add repayment schedule |
| `payment.processed.v1` | (optional) | `loan-accounts` | Record payment processed |
| `payment.scheduled.v1` | (optional) | `loan-accounts` | Record scheduled payment |

### Customers SDK Events

| Event Type | Handler | Target Collection | Description |
|------------|---------|-------------------|-------------|
| `customer.changed.v1` | `handle_customer_changed` | `customers` | Update customer fields |
| `customer.created.v1` | `handle_customer_created` | `customers` | Create new customer |
| `customer.updated.v1` | `handle_customer_updated` | `customers` | Update customer fields |
| `customer.verified.v1` | `handle_customer_verified` | `customers` | Mark customer verified |
| `application.submitted.v1` | (optional) | - | Application submitted |
| `application.status_changed.v1` | (optional) | - | Application status change |

### Chat Events (Manual Parsing)

| Event Type | Handler | Target Collection |
|------------|---------|-------------------|
| `conversation_started` | `handle_conversation_started` | `conversations` |
| `user_input` | `handle_utterance` | `conversations` |
| `assistant_response` | `handle_utterance` | `conversations` |
| `final_decision` | `handle_final_decision` | `conversations` |

---

## Account Event Payloads (SDK Models)

### `account.created.v1` - AccountCreatedV1

| Field | Type | Description |
|-------|------|-------------|
| `account_id` | `str` | Unique account identifier |
| `account_number` | `str` | Human-readable account number |
| `customer_id` | `str` | Associated customer ID |
| `status` | `AccountStatus` | PENDING, ACTIVE, SUSPENDED, CLOSED |
| `loan_amount` | `Decimal` | Original loan amount |
| `current_balance` | `Decimal` | Current outstanding balance |
| `loan_fee` | `Decimal` | Fee amount |
| `loan_total_payable` | `Decimal` | Total amount to be repaid |
| `opened_date` | `datetime` | Account opening date |

**Status Mapping:**
```python
SDK_STATUS_TO_PROJECTION = {
    "PENDING": "active",
    "ACTIVE": "active",
    "SUSPENDED": "in_arrears",
    "CLOSED": "paid_off",
}
```

### `account.schedule.created.v1` - Repayment Schedule

| Field | Type | Description |
|-------|------|-------------|
| `account_id` | `str` | Associated account ID |
| `schedule_id` | `str` | Unique schedule identifier |
| `loan_amount` | `Decimal` | Loan principal amount |
| `total_amount` | `Decimal` | Total amount including fees |
| `fee` | `Decimal` | Fee amount |
| `n_payments` | `int` | Number of scheduled payments |
| `payment_frequency` | `str` | "weekly", "fortnightly", etc. |
| `payments` | `List[ScheduledPayment]` | List of scheduled payments |
| `created_date` | `datetime` | Schedule creation date |

**ScheduledPayment:**
| Field | Type | Description |
|-------|------|-------------|
| `payment_number` | `int` | Payment sequence number |
| `due_date` | `datetime` | Payment due date |
| `amount` | `Decimal` | Payment amount |

### `account.updated.v1`

| Field | Type | Description |
|-------|------|-------------|
| `account_id` | `str` | Account identifier |
| `current_balance` | `Decimal` | Updated balance |
| `status` | `AccountStatus` | Updated status |
| `last_payment_date` | `datetime` | (Optional) Last payment date |
| `last_payment_amount` | `Decimal` | (Optional) Last payment amount |

### `account.status_changed.v1`

| Field | Type | Description |
|-------|------|-------------|
| `account_id` | `str` | Account identifier |
| `new_status` | `AccountStatus` | New status value |
| `changed_at` | `datetime` | Change timestamp |

---

## Customer Event Payloads (SDK Models)

### `customer.changed.v1` - CustomerChangedV1

| Field | Type | Description |
|-------|------|-------------|
| `customer_id` | `str` | Unique customer identifier |
| `first_name` | `str` | (Optional) First name |
| `last_name` | `str` | (Optional) Last name |
| `email_address` | `str` | (Optional) Email address |
| `mobile_phone_number` | `str` | (Optional) Phone number |
| `date_of_birth` | `str` | (Optional) Date of birth |
| `ekyc_status` | `str` | (Optional) eKYC verification status |
| `residential_address` | `Address` | (Optional) Address object |
| `changed_at` | `datetime` | Change timestamp |

**Field Mapping (SDK → Payload Collection):**
```python
SDK_TO_PAYLOAD_FIELDS = {
    'first_name': 'firstName',
    'last_name': 'lastName',
    'email_address': 'emailAddress',
    'mobile_phone_number': 'mobilePhoneNumber',
    'date_of_birth': 'dateOfBirth',
}
```

### Address Object

```python
{
    "address_type": "RESIDENTIAL" | "MAILING",
    "street_number": str,
    "street_name": str,
    "street_type": str,
    "suburb": str,
    "state": str,
    "postcode": str,
    "country": str,
    "unit_number": str | None,
    "full_address": str | None
}
```

---

## Event Processing Flow

```python
from billie_accounts_events.parser import parse_account_message
from billie_accounts_events.models import AccountCreatedV1, AccountScheduleCreatedV1
from billie_customers_events.parser import parse_customer_message
from billie_customers_events.models import CustomerChangedV1


class EventProcessor:
    """Event processor using Billie SDKs."""
    
    async def _process_message(self, message: tuple, delivery_count: int = 1):
        message_id, fields = message
        
        try:
            # Extract event type from raw fields
            event_type = self._get_event_type(fields)
            
            # Deduplication check
            event_id = fields.get(b'id', fields.get(b'event_id', message_id))
            if isinstance(event_id, bytes):
                event_id = event_id.decode()
            
            dedup_key = f"dedup:{event_id}"
            if await self.redis.exists(dedup_key):
                await self.redis.xack(self.INBOX_STREAM, self.CONSUMER_GROUP, message_id)
                return
            
            # Parse with appropriate SDK
            parsed_event = self._parse_event(event_type, fields)
            
            # Route to handler
            await self._handle_event(event_type, parsed_event)
            
            # Set dedup key and ACK
            await self.redis.setex(dedup_key, self.DEDUP_TTL_SECONDS, "1")
            await self.redis.xack(self.INBOX_STREAM, self.CONSUMER_GROUP, message_id)
            
        except Exception as e:
            logger.error(f"Error processing {message_id}: {e}")
            if delivery_count >= self.MAX_RETRIES:
                await self._move_to_dlq(message_id, fields, str(e))
                await self.redis.xack(self.INBOX_STREAM, self.CONSUMER_GROUP, message_id)
    
    def _parse_event(self, event_type: str, fields: dict):
        """Parse event using appropriate SDK."""
        # Decode bytes to strings
        sanitized = {
            k.decode() if isinstance(k, bytes) else k:
            v.decode() if isinstance(v, bytes) else v
            for k, v in fields.items()
        }
        
        if event_type.startswith('account.') or event_type.startswith('payment.'):
            return parse_account_message(sanitized)
        
        elif event_type.startswith('customer.') or event_type.startswith('application.'):
            return parse_customer_message(sanitized)
        
        else:
            # Chat events - return raw
            return sanitized
    
    async def _handle_event(self, event_type: str, parsed_event):
        """Route to appropriate handler."""
        handlers = {
            # Account events
            'account.created.v1': self._handle_account_created,
            'account.updated.v1': self._handle_account_updated,
            'account.status_changed.v1': self._handle_account_status_changed,
            'account.schedule.created.v1': self._handle_schedule_created,
            
            # Customer events
            'customer.changed.v1': self._handle_customer_changed,
            'customer.created.v1': self._handle_customer_created,
            'customer.updated.v1': self._handle_customer_updated,
            'customer.verified.v1': self._handle_customer_verified,
            
            # Chat events
            'conversation_started': self._handle_conversation_started,
            'user_input': self._handle_utterance,
            'assistant_response': self._handle_utterance,
            'final_decision': self._handle_final_decision,
        }
        
        handler = handlers.get(event_type)
        if handler:
            await handler(parsed_event)
        else:
            logger.warning(f"No handler for event type: {event_type}")
```

---

## Transactional Integrity

### Processing Guarantees

| Guarantee | Implementation |
|-----------|----------------|
| **At-least-once delivery** | Consumer groups with manual XACK |
| **Exactly-once semantics** | Deduplication with event_id |
| **No message loss** | XPENDING recovery on startup |
| **Ordered processing** | Single consumer per group |
| **Failure isolation** | Dead letter queue |

### Critical Rule

**XACK only happens after successful MongoDB write.**

```python
# ✅ Correct - ACK after write
await db["loan-accounts"].update_one(...)  # Write first
await self.redis.xack(...)                  # ACK after

# ❌ Wrong - ACK before write
await self.redis.xack(...)                  # ACK first
await db["loan-accounts"].update_one(...)  # Write after (message lost if this fails)
```

---

## Directory Structure

```
billie-servicing/
│
├── event-processor/              # Python daemon
│   ├── pyproject.toml
│   ├── src/
│   │   └── billie_servicing/
│   │       ├── __init__.py
│   │       ├── main.py           # Entry point
│   │       ├── processor.py      # EventProcessor class
│   │       ├── handlers/
│   │       │   ├── __init__.py
│   │       │   ├── account.py    # Account event handlers
│   │       │   ├── customer.py   # Customer event handlers
│   │       │   └── conversation.py
│   │       └── models/
│   │           └── mappings.py   # SDK to Payload field mappings
│   └── tests/
│
├── payload-app/                  # Payload CMS (Next.js)
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── (payload)/
│   │   │   ├── api/
│   │   │   │   └── ledger/
│   │   │   └── customer/
│   │   ├── collections/
│   │   │   ├── Customers.ts
│   │   │   ├── LoanAccounts.ts   # Includes repayment schedule
│   │   │   ├── Conversations.ts
│   │   │   └── Users.ts
│   │   └── server/
│   │       └── grpc-client.ts
│   └── proto/
│       └── accounting_ledger.proto
│
├── docker-compose.yml
└── README.md
```

---

## Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  event-processor:
    build: ./event-processor
    environment:
      - REDIS_URL=redis://redis:6379
      - MONGODB_URL=mongodb://mongodb:27017
      - DB_NAME=billie-servicing
      - GITHUB_TOKEN=${GITHUB_TOKEN}  # For SDK installation
    depends_on:
      - redis
      - mongodb
    restart: unless-stopped

  payload-app:
    build: ./payload-app
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URI=mongodb://mongodb:27017/billie-servicing
      - LEDGER_SERVICE_URL=ledger-service:50051
    depends_on:
      - mongodb

volumes:
  mongo-data:
```
