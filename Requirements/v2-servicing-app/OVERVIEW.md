# Billie Servicing App - Overview

## Executive Summary

The Billie Servicing App is an internal staff application for managing customer loan accounts at Billie, a small amount lender in Australian financial services. Built on **Payload CMS v3** with a **Python event processor** using **Billie Event SDKs**, it provides comprehensive servicing capabilities including account viewing, transaction management, and customer support workflows.

---

## Business Context

Billie provides small loans (up to $500 AUD) with flexible repayment terms (up to 60 days). Staff need tools to:

- View customer loan accounts and repayment schedules
- View and post transactions (payments, fees, waivers)
- Access customer support conversations
- Search across customers, accounts, and transactions
- Service customers from a unified view

---

## Key Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | View Loan Accounts | Browse accounts with balances, status, repayment schedules |
| 2 | View Transactions | See full transaction history from gRPC ledger |
| 3 | Post Transactions | Record payments, apply/waive fees, write-offs |
| 4 | View Conversations | Access customer chat transcripts |
| 5 | View Customer Details | Personal info, address, verification status |
| 6 | Single Customer View | Unified view: customer + accounts + conversations |
| 7 | Global Search | Search customers, accounts, transactions |

---

## Architecture Principles

### 1. Event-Sourced Projections with Billie SDKs
- Events consumed from Redis inbox `inbox:billie-servicing`
- **Billie Event SDKs** parse typed payloads (AccountCreatedV1, CustomerChangedV1, etc.)
- Python processor writes to MongoDB Payload collections

### 2. gRPC Integration for Ledger Operations
- Transaction reads and writes via AccountingLedgerService
- Real-time balance and transaction data
- Server-side gRPC client in Next.js API routes

### 3. Payload CMS Native Collections
- MongoDB collections for projections (not Redis)
- Native admin panel, relationships, access control
- TypeScript types auto-generated

### 4. Separate Processing Concerns
- **Python daemon**: Event consumption with SDKs → MongoDB
- **Payload CMS**: Staff UI, auth, API routes → gRPC/MongoDB

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Next.js 14+ | App Router, Server Components |
| CMS | Payload CMS v3 | Admin interface, Collections |
| Database | MongoDB | Payload collections (projections) |
| Event Store | Redis Streams | Event inbox only |
| Event SDKs | billie_accounts_events, billie_customers_events | Typed event parsing |
| API Protocol | gRPC | Ledger service integration |
| Authentication | Keycloak | Staff IDAM |
| UI Components | React + Tailwind | Staff interface |
| Event Processor | Python 3.11+ | Daemon with SDKs |

---

## Event Sources

### Billie Event SDKs

```bash
# SDK packages from GitHub
git+https://${GITHUB_TOKEN}@github.com/BillieLoans/billie-event-sdks.git@accounts-v2.2.0#subdirectory=packages/accounts
git+https://${GITHUB_TOKEN}@github.com/BillieLoans/billie-event-sdks.git@customers-v2.0.0#subdirectory=packages/customers
```

| SDK | Events | Models |
|-----|--------|--------|
| `billie_accounts_events` | account.*, payment.* | AccountCreatedV1, AccountScheduleCreatedV1 |
| `billie_customers_events` | customer.*, application.* | CustomerChangedV1 |

### Events Consumed

| Event | SDK | Target Collection |
|-------|-----|-------------------|
| `account.created.v1` | accounts | loan-accounts |
| `account.updated.v1` | accounts | loan-accounts |
| `account.status_changed.v1` | accounts | loan-accounts |
| `account.schedule.created.v1` | accounts | loan-accounts (repayment schedule) |
| `customer.changed.v1` | customers | customers |
| `customer.created.v1` | customers | customers |
| `customer.verified.v1` | customers | customers |
| Chat events | - | conversations |

### External Service Calls

| Service | Protocol | Operations |
|---------|----------|------------|
| AccountingLedgerService | gRPC | Read transactions, balances, statements |
| AccountingLedgerService | gRPC | Post repayments, fees, waivers, adjustments |

---

## Key Differences from V1 Architecture

| Aspect | V1 (Supervisor Dashboard) | V2 (Servicing App) |
|--------|---------------------------|---------------------|
| Primary Focus | Chat conversation monitoring | Full loan account servicing |
| Data Sources | Chat events only | Chat + Account + Customer events |
| Event Parsing | Manual JSON parsing | Billie Event SDKs (typed) |
| External APIs | None | gRPC to AccountingLedgerService |
| Write Operations | Read-only | Post transactions via gRPC |
| Customer Portal | Included | Removed |
| Repayment Schedule | Not available | Full schedule with payments |
| Search Scope | Conversations | Customers, Accounts, Transactions |
| Projection Storage | Redis | MongoDB (Payload native) |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Event processing lag | < 1 second |
| Payload query latency | < 50ms |
| Customer view load time | < 2 seconds |
| Data accuracy | Real-time via events + gRPC |
| Staff workflow efficiency | Unified single view |

---

## Documentation

| Document | Description |
|----------|-------------|
| [FEATURES.md](./FEATURES.md) | Detailed feature specifications |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture, SDK usage |
| [DATA_MODEL.md](./DATA_MODEL.md) | Collection schemas, field mappings |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Build phases with code |
