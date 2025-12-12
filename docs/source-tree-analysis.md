# Source Tree Analysis

This document provides an annotated view of the project structure, highlighting critical directories and their purpose.

## Project Root

```
/Users/rohansharp/workspace/billie-crm/
├── src/                        # [PART: billie-crm-web] Main Web Application
├── event-processor/            # [PART: event-processor] Python Backend Service
├── docs/                       # Project Documentation
├── Requirements/               # Original Requirements & Architecture
├── proto/                      # Shared gRPC Protocol Definitions
├── docker-compose.yml          # Local development orchestration
└── package.json                # Root dependency manifest
```

## Part 1: Billie CRM Web (`src/`)

Root: `.` (Project Root)

```
src/
├── app/                        # Next.js App Router
│   ├── (frontend)/             # Customer-facing / Staff UI pages
│   │   ├── customer/           # Customer management routes
│   │   └── page.tsx            # Home page
│   ├── (payload)/              # Payload CMS Admin Panel
│   │   ├── admin/              # Admin UI routes
│   │   └── api/                # Payload generated APIs
│   └── api/                    # Custom API Routes
│       ├── customer/           # Customer data endpoints
│       ├── ledger/             # gRPC proxy to Ledger Service
│       └── loan-accounts/      # Loan account endpoints
├── collections/                # Payload CMS Collection Definitions (Data Models)
│   ├── Customers.ts            # Customer schema
│   ├── LoanAccounts.ts         # Loan Account schema
│   ├── Conversations.ts        # Chat schema
│   └── Users.ts                # Staff user schema
├── components/                 # React UI Components
│   └── LoanAccountServicing/   # Domain-specific components
├── server/                     # Server-side Utilities
│   └── grpc-client.ts          # gRPC Client Factory
├── payload.config.ts           # Payload CMS Configuration
└── payload-types.ts            # Generated TypeScript types
```

## Part 2: Event Processor (`event-processor/`)

Root: `event-processor/`

```
event-processor/
├── src/
│   └── billie_servicing/
│       ├── main.py             # Application Entry Point
│       ├── processor.py        # Core Event Processing Logic
│       ├── config.py           # Configuration Management
│       └── handlers/           # Event Handlers
│           ├── account.py      # Account event logic
│           ├── customer.py     # Customer event logic
│           └── conversation.py # Conversation event logic
├── tests/                      # Python Tests
│   ├── unit/                   # Unit tests
│   └── conftest.py             # Pytest configuration
├── Dockerfile                  # Container definition
├── requirements.txt            # Python dependencies
└── pyproject.toml              # Build configuration
```

## Critical Integration Points

1.  **Shared Protocol**: `proto/accounting_ledger.proto` - Used by `src/server/grpc-client.ts` to communicate with the external Ledger Service.
2.  **Database**: Both parts share the **same MongoDB instance**.
    -   `billie-crm-web` reads/writes via Payload CMS.
    -   `event-processor` writes via Motor (async driver).
3.  **Message Broker**: Both parts connect to **Redis**.
    -   `event-processor` consumes the `inbox:billie-srv` stream.
