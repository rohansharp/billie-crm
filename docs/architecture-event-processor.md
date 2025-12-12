# Architecture: Event Processor

## Executive Summary
The **Event Processor** is a headless Python daemon responsible for maintaining the "read side" of the Billie CRM. It consumes domain events from the core banking system and updates the local MongoDB projections used by the Web App.

## Technology Stack
-   **Language**: Python 3.12
-   **Core Libraries**: `billie-event-sdks`, `redis`, `motor` (Async Mongo)
-   **Container**: Docker

## Architecture Pattern
**Event-Driven Consumer**
The processor follows a **Worker Pattern**:
1.  **Ingest**: Connects to Redis Stream `inbox:billie-srv`.
2.  **Route**: Dispatches events based on type (`account.*`, `customer.*`).
3.  **Process**: Uses Typed SDKs to parse validation.
4.  **Persist**: Updates MongoDB documents (Upsert logic).
5.  **Acknowledge**: ACKs message to Redis only after successful write.

## Data Flow
### Event Handlers (`src/billie_servicing/handlers/`)
-   **Account Handler** (`account.py`):
    -   `account.created.v1`: Creates new `LoanAccount` document.
    -   `account.schedule.created.v1`: Updates repayment schedule.
-   **Customer Handler** (`customer.py`):
    -   `customer.changed.v1`, `customer.created.v1`: Updates `Customer` document.
-   **Conversation Handler** (`conversation.py`):
    -   `conversation_started`, `user_input`: Appends to `Conversation` document.

## Resilience & Reliability
-   **Deduplication**: Uses Redis keys with TTL to prevent processing the same Event ID twice.
-   **At-Least-Once**: Manual ACK ensures messages aren't lost if the worker crashes before writing.
-   **DLQ**: Messages failing retries are moved to a Dead Letter Queue.

## Development Workflow
-   **Install**: `pip install -r requirements.txt`
-   **Run**: `python -m billie_servicing.main`
-   **Test**: `pytest`

## Deployment
Deployed as a Docker container.
-   Requires `REDIS_URL`, `MONGODB_URL`, `GITHUB_TOKEN` (for SDK install) env vars.
