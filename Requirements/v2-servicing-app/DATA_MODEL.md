# Billie Servicing App - Data Models

## Overview

This document defines the Payload CMS collection schemas for the Billie Servicing App. Collections are stored in MongoDB and populated by the Python event processor using **Billie Event SDKs**.

---

## Billie Event SDKs

The event processor uses official Billie SDKs to parse incoming events with typed payloads.

### Installation

```bash
# pyproject.toml or requirements.txt
git+https://${GITHUB_TOKEN}@github.com/BillieLoans/billie-event-sdks.git@accounts-v2.2.0#subdirectory=packages/accounts
git+https://${GITHUB_TOKEN}@github.com/BillieLoans/billie-event-sdks.git@customers-v2.0.0#subdirectory=packages/customers
```

### SDK Usage

```python
from billie_accounts_events.parser import parse_account_message
from billie_accounts_events.models import AccountCreatedV1, AccountScheduleCreatedV1

from billie_customers_events.parser import parse_customer_message
from billie_customers_events.models import CustomerChangedV1
```

---

## Storage Architecture

| Data Type | Storage | Event Source | SDK |
|-----------|---------|--------------|-----|
| Customer projections | MongoDB (Payload) | `customer.*` events | `billie_customers_events` |
| Account projections | MongoDB (Payload) | `account.*` events | `billie_accounts_events` |
| Repayment schedules | MongoDB (Payload) | `account.schedule.created.v1` | `billie_accounts_events` |
| Conversation projections | MongoDB (Payload) | Chat events | Manual parsing |
| Users/Auth | MongoDB (Payload) | N/A | N/A |
| Transactions | gRPC API | Live from ledger | N/A |

---

## Collection: LoanAccounts

Stores loan account records with repayment schedules.

### Event Sources

| Event Type | SDK Model | Handler |
|------------|-----------|---------|
| `account.created.v1` | `AccountCreatedV1` | `handle_account_created` |
| `account.updated.v1` | - | `handle_account_updated` |
| `account.status_changed.v1` | - | `handle_account_status_changed` |
| `account.schedule.created.v1` | `AccountScheduleCreatedV1` | `handle_schedule_created` |

### Schema Definition

```typescript
// src/collections/LoanAccounts.ts
import type { CollectionConfig } from 'payload';

export const LoanAccounts: CollectionConfig = {
  slug: 'loan-accounts',
  admin: {
    useAsTitle: 'accountNumber',
    defaultColumns: [
      'accountNumber',
      'customerName',
      'balances.totalOutstanding',
      'accountStatus',
      'createdAt',
    ],
    group: 'Servicing',
    description: 'Loan accounts projected from ledger events',
  },
  access: {
    read: ({ req: { user } }) => {
      return ['admin', 'supervisor', 'operations', 'readonly'].includes(user?.role);
    },
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    // === Core Identifiers ===
    {
      name: 'loanAccountId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Unique identifier from ledger service (account_id)',
      },
    },
    {
      name: 'accountNumber',
      type: 'text',
      required: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Human-readable account number',
      },
    },
    {
      name: 'customerId',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'customerName',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Denormalized for list view performance',
      },
    },

    // === Loan Terms (from account.created.v1) ===
    {
      name: 'loanTerms',
      type: 'group',
      admin: {
        description: 'Original loan terms at disbursement',
      },
      fields: [
        {
          name: 'loanAmount',
          type: 'number',
          admin: {
            readOnly: true,
            step: 0.01,
            description: 'Original loan amount (from SDK: loan_amount)',
          },
        },
        {
          name: 'loanFee',
          type: 'number',
          admin: {
            readOnly: true,
            step: 0.01,
            description: 'Fee amount (from SDK: loan_fee)',
          },
        },
        {
          name: 'totalPayable',
          type: 'number',
          admin: {
            readOnly: true,
            step: 0.01,
            description: 'Total amount to be repaid (from SDK: loan_total_payable)',
          },
        },
        {
          name: 'openedDate',
          type: 'date',
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayOnly' },
            description: 'Account opening date (from SDK: opened_date)',
          },
        },
      ],
    },

    // === Current Balances ===
    {
      name: 'balances',
      type: 'group',
      admin: {
        description: 'Current account balances (updated from events)',
      },
      fields: [
        {
          name: 'currentBalance',
          type: 'number',
          admin: {
            readOnly: true,
            step: 0.01,
            description: 'Current outstanding balance (from SDK: current_balance)',
          },
        },
        {
          name: 'totalOutstanding',
          type: 'number',
          admin: {
            readOnly: true,
            step: 0.01,
            description: 'Total amount currently owed',
          },
        },
        {
          name: 'totalPaid',
          type: 'number',
          admin: {
            readOnly: true,
            step: 0.01,
            description: 'Total amount paid to date',
          },
        },
      ],
    },

    // === Last Payment (from account.updated.v1) ===
    {
      name: 'lastPayment',
      type: 'group',
      admin: {
        description: 'Most recent payment details',
      },
      fields: [
        {
          name: 'date',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'From SDK: last_payment_date',
          },
        },
        {
          name: 'amount',
          type: 'number',
          admin: {
            readOnly: true,
            step: 0.01,
            description: 'From SDK: last_payment_amount',
          },
        },
      ],
    },

    // === Status ===
    {
      name: 'accountStatus',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paid Off', value: 'paid_off' },
        { label: 'In Arrears', value: 'in_arrears' },
        { label: 'Written Off', value: 'written_off' },
      ],
      admin: {
        readOnly: true,
        description: 'Mapped from SDK AccountStatus enum',
      },
    },
    {
      name: 'sdkStatus',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Original status from SDK (PENDING, ACTIVE, SUSPENDED, CLOSED)',
      },
    },

    // === Repayment Schedule (from account.schedule.created.v1) ===
    {
      name: 'repaymentSchedule',
      type: 'group',
      admin: {
        description: 'Repayment schedule from account.schedule.created.v1',
      },
      fields: [
        {
          name: 'scheduleId',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Unique schedule identifier',
          },
        },
        {
          name: 'numberOfPayments',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Total number of scheduled payments (from SDK: n_payments)',
          },
        },
        {
          name: 'paymentFrequency',
          type: 'select',
          options: [
            { label: 'Weekly', value: 'weekly' },
            { label: 'Fortnightly', value: 'fortnightly' },
            { label: 'Monthly', value: 'monthly' },
          ],
          admin: {
            readOnly: true,
            description: 'Payment frequency',
          },
        },
        {
          name: 'payments',
          type: 'array',
          admin: {
            readOnly: true,
            description: 'Individual scheduled payments',
          },
          fields: [
            {
              name: 'paymentNumber',
              type: 'number',
              required: true,
              admin: {
                description: 'Payment sequence number (1, 2, 3...)',
              },
            },
            {
              name: 'dueDate',
              type: 'date',
              required: true,
              admin: {
                date: { pickerAppearance: 'dayOnly' },
              },
            },
            {
              name: 'amount',
              type: 'number',
              required: true,
              admin: {
                step: 0.01,
              },
            },
            {
              name: 'status',
              type: 'select',
              options: [
                { label: 'Scheduled', value: 'scheduled' },
                { label: 'Paid', value: 'paid' },
                { label: 'Missed', value: 'missed' },
                { label: 'Partial', value: 'partial' },
              ],
              defaultValue: 'scheduled',
            },
          ],
        },
        {
          name: 'createdDate',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'Schedule creation date',
          },
        },
      ],
    },
  ],
  timestamps: true,
};
```

### Python Event Handlers

```python
# src/billie_servicing/handlers/account.py

from datetime import datetime
from decimal import Decimal
from motor.motor_asyncio import AsyncIOMotorDatabase
from billie_accounts_events.parser import parse_account_message
from billie_accounts_events.models import AccountCreatedV1


# SDK status to Payload status mapping
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
    Fields: account_id, account_number, customer_id, status, loan_amount,
            current_balance, loan_fee, loan_total_payable, opened_date
    """
    payload = parsed_event.payload
    account_id = payload.account_id
    customer_id = payload.customer_id
    
    # Get customer for denormalization and relationship
    customer = await db.customers.find_one({"customerId": customer_id})
    customer_name = customer.get("fullName", "") if customer else ""
    customer_mongo_id = customer.get("_id") if customer else None
    
    # Map SDK status to Payload status
    sdk_status = str(payload.status) if payload.status else "PENDING"
    account_status = SDK_STATUS_MAP.get(sdk_status, "active")
    
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
        "accountStatus": account_status,
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
    """
    Handle account.updated.v1 event.
    
    Fields: account_id, current_balance, status, last_payment_date, last_payment_amount
    """
    payload = parsed_event.payload
    account_id = payload.account_id
    
    update_doc = {
        "updatedAt": datetime.utcnow(),
    }
    
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
    """
    Handle account.status_changed.v1 event.
    
    Fields: account_id, new_status, changed_at
    """
    payload = parsed_event.payload
    account_id = payload.account_id
    
    sdk_status = str(payload.new_status)
    account_status = SDK_STATUS_MAP.get(sdk_status, "active")
    
    await db["loan-accounts"].update_one(
        {"loanAccountId": account_id},
        {
            "$set": {
                "sdkStatus": sdk_status,
                "accountStatus": account_status,
                "updatedAt": datetime.utcnow(),
            }
        }
    )


async def handle_schedule_created(db: AsyncIOMotorDatabase, parsed_event):
    """
    Handle account.schedule.created.v1 event.
    
    Fields: account_id, schedule_id, loan_amount, total_amount, fee,
            n_payments, payment_frequency, payments[], created_date
    
    Payments[]: payment_number, due_date, amount
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

---

## Collection: Customers

Stores customer profiles projected from customer events.

### Event Sources

| Event Type | SDK Model | Handler |
|------------|-----------|---------|
| `customer.changed.v1` | `CustomerChangedV1` | `handle_customer_changed` |
| `customer.created.v1` | - | `handle_customer_created` |
| `customer.updated.v1` | - | `handle_customer_updated` |
| `customer.verified.v1` | - | `handle_customer_verified` |

### Schema Definition

```typescript
// src/collections/Customers.ts
import type { CollectionConfig } from 'payload';

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: [
      'fullName',
      'emailAddress',
      'mobilePhoneNumber',
      'ekycStatus',
    ],
    group: 'Servicing',
  },
  access: {
    read: ({ req: { user } }) => {
      return ['admin', 'supervisor', 'operations', 'readonly'].includes(user?.role);
    },
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    // === Core Identifiers ===
    {
      name: 'customerId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },

    // === Name (from SDK) ===
    {
      name: 'firstName',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        description: 'From SDK: first_name',
      },
    },
    {
      name: 'lastName',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        description: 'From SDK: last_name',
      },
    },
    {
      name: 'fullName',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        description: 'Computed: firstName + lastName',
      },
    },

    // === Contact (from SDK) ===
    {
      name: 'emailAddress',
      type: 'email',
      index: true,
      admin: {
        readOnly: true,
        description: 'From SDK: email_address',
      },
    },
    {
      name: 'mobilePhoneNumber',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        description: 'From SDK: mobile_phone_number',
      },
    },

    // === Personal Details ===
    {
      name: 'dateOfBirth',
      type: 'date',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
        description: 'From SDK: date_of_birth',
      },
    },
    {
      name: 'ekycStatus',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'From SDK: ekyc_status',
      },
    },
    {
      name: 'identityVerified',
      type: 'checkbox',
      admin: {
        readOnly: true,
        description: 'Set true on customer.verified.v1',
      },
    },

    // === Address (from SDK) ===
    {
      name: 'residentialAddress',
      type: 'group',
      admin: { readOnly: true },
      fields: [
        { name: 'streetNumber', type: 'text' },
        { name: 'streetName', type: 'text' },
        { name: 'streetType', type: 'text' },
        { name: 'unitNumber', type: 'text' },
        { name: 'suburb', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'postcode', type: 'text' },
        { name: 'country', type: 'text', defaultValue: 'Australia' },
        { name: 'fullAddress', type: 'text' },
      ],
    },

    // === Flags ===
    {
      name: 'staffFlag',
      type: 'checkbox',
      admin: { readOnly: true },
    },
    {
      name: 'investorFlag',
      type: 'checkbox',
      admin: { readOnly: true },
    },
    {
      name: 'founderFlag',
      type: 'checkbox',
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
};
```

### Python Event Handler

```python
# src/billie_servicing/handlers/customer.py

from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from billie_customers_events.parser import parse_customer_message


async def handle_customer_changed(db: AsyncIOMotorDatabase, parsed_event):
    """
    Handle customer.changed.v1 event.
    
    SDK Model: CustomerChangedV1
    Fields: customer_id, first_name, last_name, email_address, 
            mobile_phone_number, date_of_birth, ekyc_status,
            residential_address, changed_at
    """
    payload = parsed_event.payload
    customer_id = payload.customer_id
    
    # Get existing for merge (events may be partial)
    existing = await db.customers.find_one({"customerId": customer_id})
    
    # Build full name
    first = getattr(payload, 'first_name', None) or (existing or {}).get("firstName", "")
    last = getattr(payload, 'last_name', None) or (existing or {}).get("lastName", "")
    full_name = f"{first} {last}".strip()
    
    update_doc = {
        "customerId": customer_id,
        "fullName": full_name,
        "updatedAt": datetime.utcnow(),
    }
    
    # Map SDK fields to Payload fields
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
    
    # Handle address
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
    """
    Handle customer.verified.v1 event.
    
    Fields: customer_id, verified_at
    """
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

## Collection: Conversations

Stores chat conversation transcripts. Uses manual parsing (not SDKs).

```typescript
// src/collections/Conversations.ts (unchanged from previous)
```

---

## Collection: Users

Staff user accounts with role-based access.

```typescript
// src/collections/Users.ts (unchanged from previous)
```

---

## SDK Field Mappings Reference

### Accounts SDK → Payload LoanAccounts

| SDK Field | Payload Field | Event Type |
|-----------|---------------|------------|
| `account_id` | `loanAccountId` | account.created.v1 |
| `account_number` | `accountNumber` | account.created.v1 |
| `customer_id` | `customerId` (relationship) | account.created.v1 |
| `status` | `sdkStatus` + `accountStatus` | account.*.v1 |
| `loan_amount` | `loanTerms.loanAmount` | account.created.v1 |
| `loan_fee` | `loanTerms.loanFee` | account.created.v1 |
| `loan_total_payable` | `loanTerms.totalPayable` | account.created.v1 |
| `current_balance` | `balances.currentBalance` | account.*.v1 |
| `opened_date` | `loanTerms.openedDate` | account.created.v1 |
| `last_payment_date` | `lastPayment.date` | account.updated.v1 |
| `last_payment_amount` | `lastPayment.amount` | account.updated.v1 |
| `schedule_id` | `repaymentSchedule.scheduleId` | schedule.created.v1 |
| `n_payments` | `repaymentSchedule.numberOfPayments` | schedule.created.v1 |
| `payment_frequency` | `repaymentSchedule.paymentFrequency` | schedule.created.v1 |
| `payments[]` | `repaymentSchedule.payments[]` | schedule.created.v1 |

### Customers SDK → Payload Customers

| SDK Field | Payload Field | Event Type |
|-----------|---------------|------------|
| `customer_id` | `customerId` | customer.*.v1 |
| `first_name` | `firstName` | customer.changed.v1 |
| `last_name` | `lastName` | customer.changed.v1 |
| `email_address` | `emailAddress` | customer.changed.v1 |
| `mobile_phone_number` | `mobilePhoneNumber` | customer.changed.v1 |
| `date_of_birth` | `dateOfBirth` | customer.changed.v1 |
| `ekyc_status` | `ekycStatus` | customer.changed.v1 |
| `residential_address.*` | `residentialAddress.*` | customer.changed.v1 |

### Status Mapping

```python
SDK_STATUS_MAP = {
    "PENDING": "active",
    "ACTIVE": "active", 
    "SUSPENDED": "in_arrears",
    "CLOSED": "paid_off",
}
```

---

## Querying Data in Payload

### Get Account with Schedule

```typescript
import { getPayload } from 'payload';
import config from '@payload-config';

const payload = await getPayload({ config });

const accounts = await payload.find({
  collection: 'loan-accounts',
  where: {
    customerId: { equals: customerId },
  },
  sort: '-createdAt',
});

// Access repayment schedule
const account = accounts.docs[0];
const schedule = account.repaymentSchedule;

if (schedule) {
  console.log(`Schedule ID: ${schedule.scheduleId}`);
  console.log(`Number of payments: ${schedule.numberOfPayments}`);
  console.log(`Frequency: ${schedule.paymentFrequency}`);
  
  for (const payment of schedule.payments || []) {
    console.log(`Payment ${payment.paymentNumber}: $${payment.amount} due ${payment.dueDate}`);
  }
}
```

### Get Customer with All Related Data

```typescript
// API route: /api/customer/[customerId]
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  const payload = await getPayload({ config });
  
  const customers = await payload.find({
    collection: 'customers',
    where: { customerId: { equals: params.customerId } },
    limit: 1,
  });
  
  if (customers.docs.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  const customer = customers.docs[0];
  
  // Get accounts with schedules
  const accounts = await payload.find({
    collection: 'loan-accounts',
    where: { customerId: { equals: customer.id } },
    sort: '-createdAt',
  });
  
  // Get conversations
  const conversations = await payload.find({
    collection: 'conversations',
    where: { customerId: { equals: customer.id } },
    sort: '-startedAt',
    limit: 10,
  });
  
  return NextResponse.json({
    customer,
    accounts: accounts.docs,
    conversations: conversations.docs,
  });
}
```

---

## Auto-Generated TypeScript Types

```typescript
// payload-types.ts (auto-generated)

export interface LoanAccount {
  id: string;
  loanAccountId: string;
  accountNumber: string;
  customerId: string | Customer;
  customerName?: string;
  loanTerms?: {
    loanAmount?: number;
    loanFee?: number;
    totalPayable?: number;
    openedDate?: string;
  };
  balances?: {
    currentBalance?: number;
    totalOutstanding?: number;
    totalPaid?: number;
  };
  lastPayment?: {
    date?: string;
    amount?: number;
  };
  accountStatus: 'active' | 'paid_off' | 'in_arrears' | 'written_off';
  sdkStatus?: string;
  repaymentSchedule?: {
    scheduleId?: string;
    numberOfPayments?: number;
    paymentFrequency?: 'weekly' | 'fortnightly' | 'monthly';
    payments?: ScheduledPayment[];
    createdDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledPayment {
  paymentNumber: number;
  dueDate: string;
  amount: number;
  status?: 'scheduled' | 'paid' | 'missed' | 'partial';
}

export interface Customer {
  id: string;
  customerId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  emailAddress?: string;
  mobilePhoneNumber?: string;
  dateOfBirth?: string;
  ekycStatus?: string;
  identityVerified?: boolean;
  residentialAddress?: Address;
  staffFlag?: boolean;
  investorFlag?: boolean;
  founderFlag?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  streetNumber?: string;
  streetName?: string;
  streetType?: string;
  unitNumber?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
  fullAddress?: string;
}
```
