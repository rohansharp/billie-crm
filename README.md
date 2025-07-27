# Billie Realtime Supervisor Dashboard

This project implements an event-sourcing architecture with Payload CMS for the Billie Realtime Supervisor Dashboard. It includes Redis streams for event processing and real-time updates for monitoring customer conversations and applications.

## Architecture Overview

This application implements an **Event Sourcing with Projections** pattern:

- **Event Store**: Redis streams serve as the single source of truth for all business events
- **Supervisor Dashboard Projection**: Payload CMS collections optimized for admin interface
- **Customer Portal Projection**: Optimized API for fast customer queries (future)
- **Event Processing Workers**: Resilient processors ensuring cross-projection consistency

### Key Features

- ✅ Redis streams for event sourcing
- ✅ Real-time supervisor dashboard
- ✅ Event-driven data updates
- ✅ Comprehensive unit testing
- ✅ MongoDB persistence layer
- ✅ Role-based access control
- ✅ Complete Payload CMS collections (Applications, Customers, Conversations)
- ✅ Event-driven data model with read-only projections

## Quick start

This project can be deployed with MongoDB and Redis for complete event sourcing functionality.

## Quick Start - local setup

To spin up this project locally, follow these steps:

### Prerequisites

- Node.js 18+ and pnpm
- MongoDB instance running
- Redis instance running

### Clone

Clone this repository to your local machine.

### Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   Ensure your `.env.local` file includes:
   ```env
   PAYLOAD_SECRET=your-secret-key
   DATABASE_URI=mongodb://localhost:27017/billie-crm
   REDIS_URL=redis://localhost:6383
   ENABLE_EVENT_PROCESSING=true
   WORKER_ID=1
   ```

3. **Test Redis connection**:
   ```bash
   pnpm exec tsx src/server/test-redis-connection.ts
   ```

4. **Start the development server**:
   ```bash
   pnpm dev
   ```

5. **Open the application**:
   Navigate to `http://localhost:3000` to access the admin panel.

### Event Processing

To enable event processing from Redis streams:

```bash
pnpm worker
```

This starts the background worker that consumes events from the `chatLedger` Redis stream and updates the Payload collections in real-time.

### Payload Collections

The system includes comprehensive Payload CMS collections designed for event sourcing:

#### Admin Panel Access

Visit `http://localhost:3000/admin` to access the supervisor dashboard with:
- **Applications**: View loan applications with complete process tracking
- **Customers**: Comprehensive customer profiles with identity verification
- **Conversations**: Real-time chat monitoring with utterances and summaries
- **Users**: User management with supervisor/admin roles

All collection data is **read-only** in the admin panel and updated exclusively through Redis stream events.

### Testing

The project includes comprehensive unit tests for all core functionality:

#### Run Unit Tests

```bash
cd tests && ./run_unit_tests.sh
```

Or manually:

```bash
pnpm exec vitest run tests/unit --config ./vitest.config.mts
```

#### Run All Tests

```bash
pnpm test
```

This runs both unit tests and integration tests.

#### Test Structure

- `tests/unit/` - Unit tests with mocked dependencies
  - `redis-client.test.ts` - Redis stream client functionality
  - `collections.test.ts` - Payload CMS collections configuration
- `tests/int/` - Integration tests against real services
- `tests/e2e/` - End-to-end tests using Playwright
- `tests/utils/` - Shared test utilities and mocks
  - `mocks/redis-mock.ts` - Mock Redis client for testing
  - `test-helpers.ts` - Common test utilities and helpers

#### Docker (Optional)

If you prefer to use Docker for local development instead of a local MongoDB instance, the provided docker-compose.yml file can be used.

To do so, follow these steps:

- Modify the `MONGODB_URI` in your `.env` file to `mongodb://127.0.0.1/<dbname>`
- Modify the `docker-compose.yml` file's `MONGODB_URI` to match the above `<dbname>`
- Run `docker-compose up` to start the database, optionally pass `-d` to run in the background.

## How it works

The system is built on an **Event Sourcing** architecture with multiple projections optimized for different use cases.

### Event Store (Redis Streams)

All business events are stored in Redis streams as the single source of truth:

- **Stream**: `chatLedger` contains all conversation and application events
- **Consumer Groups**: Enable scalable, fault-tolerant event processing
- **Event Types**: `conversation_started`, `user_input`, `assistant_response`, `applicationDetail_changed`, etc.

### Payload Collections (Supervisor Dashboard Projection)

Optimized for supervisor monitoring and admin operations:

- #### Users (Authentication)
  Enhanced with supervisor and admin roles for access control to the admin panel.

- #### Applications
  **NEW**: Complete application lifecycle tracking with loan details, application process state, risk assessments, and noticeboard notes. All fields are read-only and populated via events from the `applicationDetail_changed` stream.

- #### Customers  
  **ENHANCED**: Comprehensive customer profiles with identity documents, residential/mailing addresses, eKYC status, and application history. Features automatic full name generation and complete mapping from the customer.py model.

- #### Conversations
  **ENHANCED**: Real-time conversation monitoring with utterances array (not messages), conversation summaries, and proper relationships to applications and customers. Maps from chat.py models for user_input and assistant_response events.

- #### Media
  Standard uploads collection for document storage and avatars.

### Event Processing

The `RedisStreamClient` provides robust stream operations:

- Consumer group management
- Event publishing and consumption  
- Pending message recovery
- Stream monitoring and health checks

See the [Implementation Plan](Requirements/IMPLEMENTATION_PLAN.md) for detailed architecture documentation.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
