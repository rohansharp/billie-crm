# Redis Stream Worker

This directory contains the Redis stream worker that processes chat events and maintains conversation state.

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
# Payload CMS Configuration
PAYLOAD_SECRET=your-secret-key-here
DATABASE_URI=mongodb://localhost:27017/billie-crm

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Worker Configuration
ENABLE_EVENT_PROCESSING=true

# Development
NODE_ENV=development
```

## Running the Worker

To start the worker:

```bash
pnpm worker
```

## How it Works

1. **Stream Consumer**: Connects to Redis stream `chatLedger` using consumer group `supervisor-dashboard`
2. **Event Processing**: Processes events with `agt: 'broker'` and transforms them into structured conversation state
3. **State Management**: Maintains conversation state in Redis and syncs to MongoDB via Payload CMS
4. **Real-time Updates**: Publishes updates to connected clients via Redis pub/sub

## Event Types Processed

- `conversation_started`: Initializes new conversation
- `user_input`/`assistant_response`: Adds messages to conversation
- `applicationDetail_changed`: Updates application and customer data
- `identityRisk_assessment`: Stores identity risk assessment
- `serviceability_assessment_results`: Stores serviceability assessment
- `fraudCheck_assessment`: Stores fraud check results
- `noticeboard_updated`: Updates agent noticeboard posts
- `final_decision`: Records final approval/decline decision

## Architecture

The worker follows the event sourcing pattern:
- Events are consumed from Redis streams
- State is built incrementally from events
- Final state is persisted to MongoDB
- Real-time updates are published to clients 