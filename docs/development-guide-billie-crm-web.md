# Development Guide: Billie CRM Web

## Prerequisites
-   **Node.js**: v18.20.2+ or >=20.9.0
-   **Package Manager**: `pnpm` (v9+)
-   **Database**: MongoDB 6+
-   **External Services**: Access to `AccountingLedgerService` (gRPC) via port 50051 (or mock).

## Setup & Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Setup Environment
cp .env.example .env
# Required vars:
# PAYLOAD_SECRET=...
# DATABASE_URI=mongodb://localhost:27017/billie-servicing
# REDIS_URL=redis://localhost:6383
# LEDGER_SERVICE_URL=localhost:50051
```

## Running Locally

```bash
# Start development server
pnpm dev

# The app will be available at http://localhost:3000
# Admin panel: http://localhost:3000/admin
```

## Testing

### Unit & Integration Tests
Uses **Vitest** for backend logic and component testing.

```bash
# Run all integration/unit tests
pnpm test:int

# Run specific test file
pnpm exec vitest run tests/unit/collections.test.ts
```

### End-to-End Tests
Uses **Playwright** for browser automation.

```bash
# Run E2E tests
pnpm test:e2e
```

## Code Generation
Payload requires type generation when collections change.

```bash
# Generate TypeScript types for Collections
pnpm generate:types
```

## Key Directories
-   `src/app/api`: Custom API implementation.
-   `src/collections`: Data model definitions.
-   `src/components`: Custom React components (Servicing UI).
-   `src/server`: Shared server logic (gRPC client).
