# API Contracts: Billie CRM Web

## Overview

The `billie-crm-web` part exposes two types of APIs:
1.  **Payload CMS APIs** - Auto-generated REST and GraphQL endpoints for accessing collections.
2.  **Custom Next.js API Routes** - Specialized endpoints for aggregating data (Single Customer View) and proxying requests to the gRPC Ledger Service.

## Custom API Routes (`/api/*`)

### Ledger Operations

Proxies requests to the internal gRPC Accounting Ledger Service.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ledger/transactions` | Fetch transaction history for an account. |
| `GET` | `/api/ledger/balance` | Get live balance details (principal, fees, etc.). |
| `POST` | `/api/ledger/repayment` | Record a repayment. |
| `POST` | `/api/ledger/late-fee` | Apply a late fee. |
| `POST` | `/api/ledger/waive-fee` | Waive a fee. |
| `POST` | `/api/ledger/write-off` | Write off an account balance. |
| `POST` | `/api/ledger/adjustment` | Make a manual balance adjustment. |

#### `GET /api/ledger/transactions`
-   **Query Params**:
    -   `loanAccountId` (required): Loan Account ID.
    -   `limit` (optional): Max records.
    -   `fromDate`, `toDate`, `type`: Filters.
-   **Response**: `{ loanAccountId: string, transactions: Transaction[], totalCount: number }`

#### `GET /api/ledger/balance`
-   **Query Params**: `loanAccountId` (required)
-   **Response**: `{ principalBalance: string, feeBalance: string, totalOutstanding: string, asOf: { seconds, nanos } }`

### Customer Views

Aggregated data endpoints for the frontend UI.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/customer/[customerId]` | **Single Customer View**: Fetches customer details, loan accounts (with live balances), and recent conversations. |
| `GET` | `/api/loan-accounts/[id]` | Fetch a single loan account by Payload ID. |

## Payload CMS APIs

Standard endpoints provided by Payload CMS.

| Endpoint | Methods | Collection | Description |
|----------|---------|------------|-------------|
| `/api/customers` | GET | `customers` | List/Find customers (Projected data) |
| `/api/loan-accounts` | GET | `loan-accounts` | List/Find loan accounts (Projected data) |
| `/api/conversations` | GET | `conversations` | List/Find chat transcripts |
| `/api/users` | GET, POST, ... | `users` | Staff user management |

## Authentication

-   **Payload APIs**: Authenticated via standard Payload cookie-based auth (`payload-token`).
-   **Custom APIs**: Currently public (internal network assumed) or inherit Payload session context if using `payload.local` API within the same server instance.
