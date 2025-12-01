# Billie Servicing App - Implementation Plan

## Overview

This plan builds the Billie Servicing App with two components:

1. **Python Event Processor** - Daemon using Billie Event SDKs to parse events and write to MongoDB
2. **Payload CMS Application** - Next.js app with native collection access

**Key Dependencies:**
- Billie Event SDKs for typed event parsing
- Payload CMS collections (MongoDB) for projections
- gRPC client for ledger operations

---

## Phase 1: Foundation (Week 1-2)

### Objective
Set up project structure, Payload collections, and event processing with SDKs.

---

### Step 1.1: Project Structure

```bash
billie-servicing/
├── event-processor/              # Python daemon
│   ├── pyproject.toml
│   ├── src/
│   │   └── billie_servicing/
│   │       ├── __init__.py
│   │       ├── main.py
│   │       ├── processor.py
│   │       ├── handlers/
│   │       │   ├── __init__.py
│   │       │   ├── account.py    # account.* events
│   │       │   ├── customer.py   # customer.* events
│   │       │   └── conversation.py
│   │       └── mappings.py       # SDK to Payload field mappings
│   └── tests/
│
├── payload-app/                  # Payload CMS
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── (payload)/
│   │   │   ├── api/
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

### Step 1.2: Python Event Processor Dependencies

**File: `event-processor/pyproject.toml`**

```toml
[tool.poetry]
name = "billie-servicing-processor"
version = "0.1.0"
description = "Event processor for Billie Servicing App"

[tool.poetry.dependencies]
python = "^3.11"
redis = "^5.0"
motor = "^3.3"
pydantic = "^2.0"

# Billie Event SDKs (installed from GitHub)
# Note: These require GITHUB_TOKEN environment variable
billie-accounts-events = {git = "https://github.com/BillieLoans/billie-event-sdks.git", subdirectory = "packages/accounts", tag = "accounts-v2.2.0"}
billie-customers-events = {git = "https://github.com/BillieLoans/billie-event-sdks.git", subdirectory = "packages/customers", tag = "customers-v2.0.0"}

[tool.poetry.group.dev.dependencies]
pytest = "^8.0"
pytest-asyncio = "^0.23"
```

**Alternative: requirements.txt**

```txt
redis>=5.0
motor>=3.3
pydantic>=2.0

# Billie Event SDKs
git+https://${GITHUB_TOKEN}@github.com/BillieLoans/billie-event-sdks.git@accounts-v2.2.0#subdirectory=packages/accounts
git+https://${GITHUB_TOKEN}@github.com/BillieLoans/billie-event-sdks.git@customers-v2.0.0#subdirectory=packages/customers
```

---

### Step 1.3: Payload Collections

Create the collection definitions with repayment schedule support:

- [ ] `src/collections/Customers.ts` - Customer profiles
- [ ] `src/collections/LoanAccounts.ts` - Accounts with repaymentSchedule group
- [ ] `src/collections/Conversations.ts` - Chat transcripts
- [ ] `src/collections/Users.ts` - Staff users
- [ ] Update `payload.config.ts`

**Test:** Start Payload and verify admin panel shows all collections with correct fields.

---

### Step 1.4: Event Processor Core

**File: `event-processor/src/billie_servicing/processor.py`**

```python
"""
Transactional event processor using Billie Event SDKs.
"""
import asyncio
import json
import logging
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable

import redis.asyncio as redis
from motor.motor_asyncio import AsyncIOMotorClient

# Billie Event SDKs
from billie_accounts_events.parser import parse_account_message
from billie_customers_events.parser import parse_customer_message

logger = logging.getLogger(__name__)


class EventProcessor:
    INBOX_STREAM = "inbox:billie-servicing"
    CONSUMER_GROUP = "billie-servicing-processor"
    DLQ_STREAM = "dlq:billie-servicing"
    MAX_RETRIES = 3
    DEDUP_TTL_SECONDS = 86400
    
    def __init__(self, redis_url: str, mongodb_url: str, db_name: str):
        self.redis = redis.from_url(redis_url)
        self.mongo = AsyncIOMotorClient(mongodb_url)
        self.db = self.mongo[db_name]
        self.consumer_id = f"processor-{os.getpid()}"
        self.handlers: dict[str, Callable] = {}
        self._running = False
    
    def register_handler(self, event_type: str, handler: Callable):
        self.handlers[event_type] = handler
    
    async def run(self):
        self._running = True
        await self._ensure_consumer_group()
        await self._process_pending_messages()
        
        logger.info(f"Starting processor: {self.consumer_id}")
        while self._running:
            await self._process_new_messages()
    
    async def stop(self):
        self._running = False
        await self.redis.close()
        self.mongo.close()
    
    async def _ensure_consumer_group(self):
        try:
            await self.redis.xgroup_create(
                self.INBOX_STREAM,
                self.CONSUMER_GROUP,
                id="0",
                mkstream=True
            )
            logger.info(f"Created consumer group: {self.CONSUMER_GROUP}")
        except redis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise
    
    async def _process_pending_messages(self):
        """Process messages from previous runs that weren't ACKed."""
        logger.info("Processing pending messages...")
        
        while True:
            pending = await self.redis.xpending_range(
                self.INBOX_STREAM,
                self.CONSUMER_GROUP,
                min="-",
                max="+",
                count=100
            )
            
            if not pending:
                break
            
            for entry in pending:
                message_id = entry["message_id"]
                delivery_count = entry["times_delivered"]
                
                messages = await self.redis.xclaim(
                    self.INBOX_STREAM,
                    self.CONSUMER_GROUP,
                    self.consumer_id,
                    min_idle_time=0,
                    message_ids=[message_id]
                )
                
                if messages:
                    await self._process_message(messages[0], delivery_count)
        
        logger.info("Pending messages processed")
    
    async def _process_new_messages(self):
        messages = await self.redis.xreadgroup(
            groupname=self.CONSUMER_GROUP,
            consumername=self.consumer_id,
            streams={self.INBOX_STREAM: ">"},
            count=10,
            block=1000
        )
        
        if messages:
            for stream_name, stream_messages in messages:
                for message_id, fields in stream_messages:
                    await self._process_message((message_id, fields))
    
    async def _process_message(self, message: tuple, delivery_count: int = 1):
        """
        Process message with transactional guarantee.
        
        XACK only after successful MongoDB write.
        """
        message_id, fields = message
        
        try:
            # Decode bytes to strings
            sanitized = {
                k.decode() if isinstance(k, bytes) else k:
                v.decode() if isinstance(v, bytes) else v
                for k, v in fields.items()
            }
            
            # Get event type
            event_type = sanitized.get('msg_type') or sanitized.get('typ') or sanitized.get('event_type', '')
            
            # Get event ID for deduplication
            event_id = sanitized.get('id') or sanitized.get('event_id') or str(message_id)
            
            # Deduplication check
            dedup_key = f"dedup:{event_id}"
            if await self.redis.exists(dedup_key):
                logger.debug(f"Duplicate event {event_id}, skipping")
                await self.redis.xack(self.INBOX_STREAM, self.CONSUMER_GROUP, message_id)
                return
            
            # Parse with appropriate SDK
            parsed_event = self._parse_event(event_type, sanitized)
            
            # Get handler
            handler = self.handlers.get(event_type)
            if not handler:
                logger.warning(f"No handler for event type: {event_type}")
                await self.redis.xack(self.INBOX_STREAM, self.CONSUMER_GROUP, message_id)
                return
            
            # Write to MongoDB
            await handler(self.db, parsed_event)
            
            # Set dedup key
            await self.redis.setex(dedup_key, self.DEDUP_TTL_SECONDS, "1")
            
            # ACK after successful write
            await self.redis.xack(self.INBOX_STREAM, self.CONSUMER_GROUP, message_id)
            
            logger.info(f"Processed: {event_type} ({event_id})")
            
        except Exception as e:
            logger.error(f"Error processing {message_id}: {e}", exc_info=True)
            
            if delivery_count >= self.MAX_RETRIES:
                await self._move_to_dlq(message_id, fields, str(e))
                await self.redis.xack(self.INBOX_STREAM, self.CONSUMER_GROUP, message_id)
                logger.error(f"Message {message_id} moved to DLQ")
    
    def _parse_event(self, event_type: str, sanitized: dict) -> Any:
        """Parse event using appropriate SDK."""
        
        if event_type.startswith('account.') or event_type.startswith('payment.'):
            # Use accounts SDK
            return parse_account_message(sanitized)
        
        elif event_type.startswith('customer.') or event_type.startswith('application.'):
            # Use customers SDK
            payload = parse_customer_message(sanitized)
            # Wrap in mock ParsedEvent for consistency
            return type('ParsedEvent', (), {
                'event_type': event_type,
                'conversation_id': sanitized.get('conv', ''),
                'sequence': sanitized.get('seq', ''),
                'payload': payload
            })()
        
        else:
            # Chat events - return raw dict
            return sanitized
    
    async def _move_to_dlq(self, message_id: str, fields: dict, error: str):
        await self.redis.xadd(
            self.DLQ_STREAM,
            {
                **{k.decode() if isinstance(k, bytes) else k:
                   v.decode() if isinstance(v, bytes) else v
                   for k, v in fields.items()},
                "original_message_id": str(message_id),
                "error": error,
                "moved_at": datetime.utcnow().isoformat(),
            }
        )
```

---

### Step 1.5: Event Handlers

**File: `event-processor/src/billie_servicing/handlers/account.py`**

```python
"""Account event handlers using Billie Accounts SDK."""
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

# Status mapping: SDK → Payload
SDK_STATUS_MAP = {
    "PENDING": "active",
    "ACTIVE": "active",
    "SUSPENDED": "in_arrears",
    "CLOSED": "paid_off",
}


async def handle_account_created(db: AsyncIOMotorDatabase, parsed_event):
    """
    Handle account.created.v1 event.
    
    SDK Model: AccountCreatedV1
    """
    payload = parsed_event.payload
    account_id = payload.account_id
    customer_id = payload.customer_id
    
    # Get customer for relationship
    customer = await db.customers.find_one({"customerId": customer_id})
    customer_mongo_id = customer.get("_id") if customer else None
    customer_name = customer.get("fullName", "") if customer else ""
    
    sdk_status = str(payload.status) if payload.status else "PENDING"
    
    document = {
        "loanAccountId": account_id,
        "accountNumber": payload.account_number,
        "customerId": customer_mongo_id,
        "customerName": customer_name,
        "loanTerms": {
            "loanAmount": float(payload.loan_amount) if payload.loan_amount else None,
            "loanFee": float(payload.loan_fee) if payload.loan_fee else None,
            "totalPayable": float(payload.loan_total_payable) if payload.loan_total_payable else None,
            "openedDate": payload.opened_date,
        },
        "balances": {
            "currentBalance": float(payload.current_balance) if payload.current_balance else 0.0,
            "totalOutstanding": float(payload.current_balance) if payload.current_balance else 0.0,
            "totalPaid": 0.0,
        },
        "accountStatus": SDK_STATUS_MAP.get(sdk_status, "active"),
        "sdkStatus": sdk_status,
        "updatedAt": datetime.utcnow(),
    }
    
    await db["loan-accounts"].update_one(
        {"loanAccountId": account_id},
        {
            "$set": document,
            "$setOnInsert": {"createdAt": datetime.utcnow()},
        },
        upsert=True
    )


async def handle_account_updated(db: AsyncIOMotorDatabase, parsed_event):
    """Handle account.updated.v1 event."""
    payload = parsed_event.payload
    account_id = payload.account_id
    
    update_doc = {"updatedAt": datetime.utcnow()}
    
    if payload.current_balance is not None:
        update_doc["balances.currentBalance"] = float(payload.current_balance)
        update_doc["balances.totalOutstanding"] = float(payload.current_balance)
    
    if payload.status:
        sdk_status = str(payload.status)
        update_doc["sdkStatus"] = sdk_status
        update_doc["accountStatus"] = SDK_STATUS_MAP.get(sdk_status, "active")
    
    if payload.last_payment_date:
        update_doc["lastPayment.date"] = payload.last_payment_date
    
    if payload.last_payment_amount is not None:
        update_doc["lastPayment.amount"] = float(payload.last_payment_amount)
    
    await db["loan-accounts"].update_one(
        {"loanAccountId": account_id},
        {"$set": update_doc}
    )


async def handle_account_status_changed(db: AsyncIOMotorDatabase, parsed_event):
    """Handle account.status_changed.v1 event."""
    payload = parsed_event.payload
    account_id = payload.account_id
    
    sdk_status = str(payload.new_status)
    
    await db["loan-accounts"].update_one(
        {"loanAccountId": account_id},
        {
            "$set": {
                "sdkStatus": sdk_status,
                "accountStatus": SDK_STATUS_MAP.get(sdk_status, "active"),
                "updatedAt": datetime.utcnow(),
            }
        }
    )


async def handle_schedule_created(db: AsyncIOMotorDatabase, parsed_event):
    """
    Handle account.schedule.created.v1 event.
    
    Adds repayment schedule to loan account.
    """
    payload = parsed_event.payload
    account_id = payload.account_id
    
    # Build payments array
    payments = []
    for payment in (payload.payments or []):
        payments.append({
            "paymentNumber": payment.payment_number,
            "dueDate": payment.due_date,
            "amount": float(payment.amount) if payment.amount else 0.0,
            "status": "scheduled",
        })
    
    schedule_doc = {
        "repaymentSchedule": {
            "scheduleId": payload.schedule_id,
            "numberOfPayments": payload.n_payments,
            "paymentFrequency": payload.payment_frequency,
            "payments": payments,
            "createdDate": payload.created_date,
        },
        "updatedAt": datetime.utcnow(),
    }
    
    await db["loan-accounts"].update_one(
        {"loanAccountId": account_id},
        {"$set": schedule_doc}
    )
```

**File: `event-processor/src/billie_servicing/handlers/customer.py`**

```python
"""Customer event handlers using Billie Customers SDK."""
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase


async def handle_customer_changed(db: AsyncIOMotorDatabase, parsed_event):
    """Handle customer.changed.v1 event."""
    payload = parsed_event.payload
    customer_id = payload.customer_id
    
    existing = await db.customers.find_one({"customerId": customer_id})
    
    first = getattr(payload, 'first_name', None) or (existing or {}).get("firstName", "")
    last = getattr(payload, 'last_name', None) or (existing or {}).get("lastName", "")
    full_name = f"{first} {last}".strip()
    
    update_doc = {
        "customerId": customer_id,
        "fullName": full_name,
        "updatedAt": datetime.utcnow(),
    }
    
    field_mappings = {
        'first_name': 'firstName',
        'last_name': 'lastName',
        'email_address': 'emailAddress',
        'mobile_phone_number': 'mobilePhoneNumber',
        'date_of_birth': 'dateOfBirth',
        'ekyc_status': 'ekycStatus',
    }
    
    for sdk_field, payload_field in field_mappings.items():
        value = getattr(payload, sdk_field, None)
        if value is not None:
            update_doc[payload_field] = value
    
    if hasattr(payload, 'residential_address') and payload.residential_address:
        addr = payload.residential_address
        update_doc["residentialAddress"] = {
            "streetNumber": getattr(addr, 'street_number', None),
            "streetName": getattr(addr, 'street_name', None),
            "streetType": getattr(addr, 'street_type', None),
            "unitNumber": getattr(addr, 'unit_number', None),
            "suburb": getattr(addr, 'suburb', None),
            "state": getattr(addr, 'state', None),
            "postcode": getattr(addr, 'postcode', None),
            "country": getattr(addr, 'country', 'Australia'),
            "fullAddress": getattr(addr, 'full_address', None),
        }
    
    await db.customers.update_one(
        {"customerId": customer_id},
        {
            "$set": update_doc,
            "$setOnInsert": {"createdAt": datetime.utcnow()},
        },
        upsert=True
    )


async def handle_customer_verified(db: AsyncIOMotorDatabase, parsed_event):
    """Handle customer.verified.v1 event."""
    payload = parsed_event.payload
    customer_id = payload.customer_id
    
    await db.customers.update_one(
        {"customerId": customer_id},
        {
            "$set": {
                "identityVerified": True,
                "updatedAt": datetime.utcnow(),
            }
        }
    )
```

---

### Step 1.6: Main Entry Point

**File: `event-processor/src/billie_servicing/main.py`**

```python
"""Main entry point for event processor."""
import asyncio
import logging
import os
import signal

from .processor import EventProcessor
from .handlers.account import (
    handle_account_created,
    handle_account_updated,
    handle_account_status_changed,
    handle_schedule_created,
)
from .handlers.customer import (
    handle_customer_changed,
    handle_customer_verified,
)
from .handlers.conversation import (
    handle_conversation_started,
    handle_utterance,
    handle_final_decision,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def main():
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
    mongodb_url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "billie-servicing")
    
    processor = EventProcessor(redis_url, mongodb_url, db_name)
    
    # Register account handlers (using billie_accounts_events SDK)
    processor.register_handler("account.created.v1", handle_account_created)
    processor.register_handler("account.updated.v1", handle_account_updated)
    processor.register_handler("account.status_changed.v1", handle_account_status_changed)
    processor.register_handler("account.schedule.created.v1", handle_schedule_created)
    
    # Register customer handlers (using billie_customers_events SDK)
    processor.register_handler("customer.changed.v1", handle_customer_changed)
    processor.register_handler("customer.created.v1", handle_customer_changed)  # Same handler
    processor.register_handler("customer.updated.v1", handle_customer_changed)  # Same handler
    processor.register_handler("customer.verified.v1", handle_customer_verified)
    
    # Register chat handlers (manual parsing)
    processor.register_handler("conversation_started", handle_conversation_started)
    processor.register_handler("user_input", handle_utterance)
    processor.register_handler("assistant_response", handle_utterance)
    processor.register_handler("final_decision", handle_final_decision)
    
    # Shutdown handler
    def shutdown(sig, frame):
        logger.info("Shutting down...")
        asyncio.create_task(processor.stop())
    
    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)
    
    await processor.run()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Phase 2: Payload CMS & gRPC (Week 3-4)

### Step 2.1: Payload Collections

Implement all collections as defined in DATA_MODEL.md:

- [ ] `LoanAccounts.ts` with repaymentSchedule group
- [ ] `Customers.ts` with SDK field mappings
- [ ] `Conversations.ts`
- [ ] `Users.ts`

### Step 2.2: gRPC Client

Set up gRPC client for AccountingLedgerService:

- [ ] `src/server/grpc-client.ts`
- [ ] Promisified wrappers for all operations
- [ ] Error handling

### Step 2.3: API Routes

- [ ] `/api/ledger/transactions/[accountId]` - GetTransactions
- [ ] `/api/ledger/balance/[accountId]` - GetBalance
- [ ] `/api/ledger/repayment` - RecordRepayment (POST)
- [ ] `/api/ledger/late-fee` - ApplyLateFee (POST)
- [ ] `/api/customer/[customerId]` - Get customer with accounts

---

## Phase 3: Staff UI (Week 5-7)

### Step 3.1: Single Customer View

- [ ] Customer header with name, flags
- [ ] Accounts list with current balances
- [ ] Repayment schedule display
- [ ] Transaction history (from gRPC)
- [ ] Conversations list

### Step 3.2: Transaction Forms

- [ ] Record Payment modal
- [ ] Apply Late Fee form
- [ ] Waive Fee form
- [ ] Write Off form

### Step 3.3: Global Search

- [ ] Search bar component
- [ ] Customer/Account search
- [ ] Results categorization

---

## Phase 4: Production (Week 8-9)

### Step 4.1: Testing

- [ ] Unit tests for Python handlers
- [ ] SDK parsing tests
- [ ] Integration tests

### Step 4.2: Monitoring

- [ ] Processing lag metrics
- [ ] DLQ size alerts
- [ ] Error rates

### Step 4.3: Deployment

```yaml
# docker-compose.yml
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
      - GITHUB_TOKEN=${GITHUB_TOKEN}
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

---

## Event Handler Summary

| Event Type | SDK | Handler | Target Collection |
|------------|-----|---------|-------------------|
| `account.created.v1` | `billie_accounts_events` | `handle_account_created` | `loan-accounts` |
| `account.updated.v1` | `billie_accounts_events` | `handle_account_updated` | `loan-accounts` |
| `account.status_changed.v1` | `billie_accounts_events` | `handle_account_status_changed` | `loan-accounts` |
| `account.schedule.created.v1` | `billie_accounts_events` | `handle_schedule_created` | `loan-accounts` |
| `customer.changed.v1` | `billie_customers_events` | `handle_customer_changed` | `customers` |
| `customer.created.v1` | `billie_customers_events` | `handle_customer_changed` | `customers` |
| `customer.verified.v1` | `billie_customers_events` | `handle_customer_verified` | `customers` |
| `conversation_started` | Manual | `handle_conversation_started` | `conversations` |
| `user_input` | Manual | `handle_utterance` | `conversations` |
| `assistant_response` | Manual | `handle_utterance` | `conversations` |

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Event processing lag | < 1 second |
| Payload query latency | < 50ms |
| Message loss | Zero |
| SDK parsing errors | Zero |
| Test coverage | > 80% |
