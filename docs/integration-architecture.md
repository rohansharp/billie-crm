# Integration Architecture

## System Context

The Billie CRM ecosystem consists of two primary internal components and interactions with external services and data stores.

## Communication Patterns

### 1. Asynchronous Event Ingestion (Redis Streams)
-   **Source**: External Services (Accounts, Customers, Chat) -> Redis Stream (`inbox:billie-srv`)
-   **Consumer**: **Event Processor** (`event-processor/`)
-   **Pattern**: Consumer Group with manual Acknowledgement (ACK).
-   **Data Flow**:
    1.  External service publishes event to Redis.
    2.  Event Processor consumes message.
    3.  Event Processor parses using **Billie Event SDKs**.
    4.  Event Processor writes projection to **MongoDB**.
    5.  Event Processor ACKs message in Redis.

### 2. Database Integration (Shared Storage)
-   **Store**: MongoDB
-   **Pattern**: Shared Database (CQRS-lite)
-   **Writers**:
    -   **Event Processor**: Writes projected data (Loan Accounts, Customers) from events.
    -   **Web App**: Writes user-generated data (Notes, adjustments) and reads all data.
-   **Collections**:
    -   `loan-accounts`: Managed by Event Processor (upsert), Read by Web App.
    -   `customers`: Managed by Event Processor (upsert), Read by Web App.
    -   `conversations`: Managed by Event Processor, Read by Web App.

### 3. Synchronous Ledger Operations (gRPC)
-   **Source**: **Web App** (`src/app/api/ledger/`)
-   **Target**: External **Accounting Ledger Service**
-   **Protocol**: gRPC
-   **Definition**: `proto/accounting_ledger.proto`
-   **Operations**:
    -   `GetTransactions`, `GetBalance` (Read)
    -   `RecordRepayment`, `ApplyFee`, `WaiveFee` (Write)

## Data Flow Diagram

```mermaid
graph TD
    subgraph "External Systems"
        AccountsService[Accounts Service]
        CustomerService[Customer Service]
        LedgerService[Accounting Ledger Service]
    end

    subgraph "Infrastructure"
        Redis[(Redis Streams)]
        MongoDB[(MongoDB)]
    end

    subgraph "Billie CRM"
        EventProc[Event Processor (Python)]
        WebApp[Web App (Next.js/Payload)]
    end

    AccountsService -->|Publish Events| Redis
    CustomerService -->|Publish Events| Redis
    
    Redis -->|Consume (inbox:billie-srv)| EventProc
    EventProc -->|Write Projections| MongoDB
    
    WebApp -->|Read Projections| MongoDB
    WebApp -->|gRPC Calls| LedgerService
```

## Integration Points Registry

| Source | Target | Type | Details |
|--------|--------|------|---------|
| Event Processor | Redis | Stream Consumer | Group: `billie-servicing-processor`, Stream: `inbox:billie-srv` |
| Event Processor | MongoDB | Database Write | Collections: `loan-accounts`, `customers` |
| Web App | MongoDB | Database Read/Write | Payload CMS Native Access |
| Web App | Ledger Service | gRPC Client | Port: `50051` (default), Service: `AccountingLedgerService` |
