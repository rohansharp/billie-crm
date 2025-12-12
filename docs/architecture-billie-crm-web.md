# Architecture: Billie CRM Web

## Executive Summary
The **Billie CRM Web** component is the user-facing interface for the Servicing App. It is built on **Next.js 15** and **Payload CMS 3.0**, providing a unified Admin UI for staff and custom API routes for specific business logic.

## Technology Stack
-   **Framework**: Next.js 15 (App Router)
-   **CMS**: Payload CMS 3.45.0
-   **Language**: TypeScript
-   **Database**: MongoDB (via Payload Adapter)
-   **Styling**: SCSS / CSS Modules
-   **Testing**: Vitest, Playwright

## Architecture Pattern
**Monolithic Web Application with Embedded CMS**
The application embeds Payload CMS directly into the Next.js app, sharing the same server instance and database connection. It uses a **Layered Architecture**:
1.  **Presentation**: React Components, Payload Admin UI.
2.  **API Layer**: Next.js Route Handlers (`src/app/api/`).
3.  **Domain/Data Layer**: Payload Collections (`src/collections/`).

## Data Architecture
### Key Collections
-   **LoanAccounts**: Read-only projection of loan data. Populated by Event Processor.
-   **Customers**: Read-only projection of customer data. Populated by Event Processor.
-   **Conversations**: Chat transcripts. Populated by Event Processor.
-   **Users**: Staff access control. Managed within Payload.

## API Design
### Custom API Routes
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/customer/[customerId]` | Fetch aggregated customer view |
| `GET` | `/api/loan-accounts/[id]` | Fetch loan account details |
| `POST` | `/api/ledger/repayment` | Record a repayment via gRPC |
| `POST` | `/api/ledger/late-fee` | Apply a late fee via gRPC |
| `POST` | `/api/ledger/waive-fee` | Waive a fee via gRPC |
| `POST` | `/api/ledger/write-off` | Write off a balance via gRPC |
| `POST` | `/api/ledger/adjustment` | Manual balance adjustment via gRPC |
| `GET` | `/api/ledger/transactions` | Fetch transaction history via gRPC |

## Development Workflow
-   **Run**: `pnpm dev`
-   **Build**: `pnpm build`
-   **Test Unit**: `pnpm test:int`
-   **Test E2E**: `pnpm test:e2e`

## Deployment
Deployed as a standard Node.js application (Dockerized).
-   Requires `PAYLOAD_SECRET`, `DATABASE_URI`, `LEDGER_SERVICE_URL` env vars.
-   Exposes port `3000`.
