# Development Guide: Event Processor

## Overview
The Event Processor is a Python daemon that consumes events from Redis Streams and maintains the MongoDB read models (projections) for the Web App.

## Prerequisites
-   **Python**: 3.12+
-   **Services**: Redis 7+, MongoDB 6+
-   **SDK Access**: `GITHUB_TOKEN` with read access to `BillieLoans/billie-event-sdks`.

## Setup

```bash
cd event-processor

# 1. Create venv
python -m venv venv
source venv/bin/activate

# 2. Install dependencies
export GITHUB_TOKEN=your_token
pip install -r requirements.txt
```

## Configuration
Controlled via environment variables (see `src/billie_servicing/config.py`).

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6383` | Redis connection. |
| `MONGODB_URL` | `mongodb://localhost:27017` | Mongo connection. |
| `DB_NAME` | `billie-servicing` | Target database name. |
| `INBOX_STREAM` | `inbox:billie-servicing` | Redis stream key. |
| `CONSUMER_GROUP` | `billie-servicing-processor` | Redis consumer group. |

## Running Locally

```bash
# Run the processor
python -m billie_servicing.main
```

## Testing
Uses **Pytest** for handler testing.

```bash
# Run tests
pytest
```

## Project Structure
-   `src/billie_servicing/handlers/`: Event processing logic separated by domain (`account.py`, `customer.py`).
-   `src/billie_servicing/processor.py`: Core consumer loop (connection, reading, deduplication, error handling).
-   `src/billie_servicing/main.py`: Entry point.

## Handlers
-   **Account**: `account.created.v1`, `account.updated.v1`, `account.schedule.created.v1`.
-   **Customer**: `customer.changed.v1`, `customer.verified.v1`.
-   **Conversation**: `conversation_started`, `user_input`, `assessment` events.
