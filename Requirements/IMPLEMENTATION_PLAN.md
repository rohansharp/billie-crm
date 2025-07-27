# Billie Realtime Supervisor Dashboard - Implementation Plan

This document provides a detailed, step-by-step implementation plan for building the event sourcing system with multiple projections as defined in the architecture.

---

## Overview

The implementation follows an **Event Sourcing with Projections** pattern:
- **Event Store**: Redis streams as single source of truth
- **Supervisor Dashboard Projection**: Payload CMS for admin interface
- **Customer Portal Projection**: Optimized API for customer queries
- **Event Processing Workers**: Resilient processors with cross-projection consistency

---

## Phase 1: Foundation Setup

### Step 1.1: Environment and Dependencies Setup

**Objective**: Set up the development environment with required dependencies.

**Tasks**:

1. **Update package.json dependencies**:
   ```bash
   pnpm add ioredis @types/ioredis lodash @types/lodash
   pnpm add @payloadcms/db-mongodb @payloadcms/richtext-lexical
   pnpm add sharp multer @types/multer
   ```

2. **Create Redis client configuration**:
   - File: `src/server/redis-client.ts`
   - Implement connection management and basic operations

**Acceptance Criteria**:
- ✅ All dependencies installed
- ✅ Redis and MongoDB connections established
- ✅ Basic Redis connection working

---

### Step 1.2: Payload CMS Configuration

**Objective**: Configure Payload CMS with MongoDB adapter and basic settings.

**Tasks**:

1. **Update `src/payload.config.ts`**:
   - Configure MongoDB adapter
   - Set up Lexical editor
   - Configure admin interface
   - Set up TypeScript output

2. **Create collections directory structure**:
   ```
   src/collections/
   ├── Users.ts
   ├── Applications.ts
   ├── Customers.ts
   ├── Conversations.ts
   └── Media.ts
   ```

3. **Configure admin layout**:
   - Update `src/app/(payload)/layout.tsx`
   - Set up custom admin routing
   - Configure authentication

**Acceptance Criteria**:
- ✅ Payload CMS starts without errors
- ✅ MongoDB connection established
- ✅ Admin panel accessible
- ✅ TypeScript types generated

---

## Phase 2: Event Store and Basic Event Processing

### Step 2.1: Redis Stream Setup

**Objective**: Set up Redis streams for event sourcing with proper consumer groups.

**Tasks**:

1. **Create Redis stream utilities** (`src/server/redis-client.ts`):
   ```typescript
   export class RedisStreamClient {
     async createConsumerGroup(stream: string, group: string)
     async addEvent(stream: string, event: any)
     async readEvents(stream: string, group: string, consumer: string)
     async acknowledgeEvent(stream: string, group: string, messageId: string)
   }
   ```

2. **Create chatLedger stream structure**:
   - Stream name: `chatLedger`
   - Consumer group: `payload-dashboard`
   - Event fields: `agt`, `typ`, `cid`, `aid`, `uid`, `seq`, `tsp`, `dat`

3. **Set up test event producer** (for development):
   - File: `src/server/test-event-producer.ts`
   - Generate sample events matching pydantic models
   - Events: `conversation_started`, `user_input`, `assistant_response`, `applicationDetail_changed`

**Acceptance Criteria**:
- ✅ Redis stream created and accessible
- ✅ Consumer group established
- ✅ Test events can be produced and consumed
- ✅ Event format matches architecture specification

---

### Step 2.2: Basic Event Processor

**Objective**: Create a simple event processor to validate the event flow.

**Tasks**:

1. **Create basic event processor** (`src/workers/eventProcessor.ts`):
   ```typescript
   export class EventProcessor {
     async startProcessing()
     private async processEvent(event: ChatLedgerEvent)
     private parseEvent(fields: string[]): ChatLedgerEvent
   }
   ```

2. **Implement event type filtering**:
   - Only process events where `agt === 'broker'`
   - Log unhandled event types for debugging

3. **Create worker startup script** (`src/server/worker.ts`):
   - Initialize event processor
   - Handle graceful shutdown
   - Basic error handling and logging

4. **Add npm scripts**:
   ```json
   {
     "scripts": {
       "worker": "tsx src/server/worker.ts",
       "test-events": "tsx src/server/test-event-producer.ts"
     }
   }
   ```

**Acceptance Criteria**:
- ✅ Worker starts and connects to Redis stream
- ✅ Events are consumed and processed
- ✅ Proper filtering by agent type
- ✅ Basic logging and error handling

---

## Phase 3: Payload Collections Implementation

### Step 3.1: Users Collection Enhancement

**Objective**: Set up user authentication with supervisor roles.

**Tasks**:

1. **Update `src/collections/Users.ts`**:
   - Add role field (`admin`, `supervisor`)
   - Configure access control
   - Add profile fields (firstName, lastName, avatar)

2. **Configure authentication**:
   - Set up Payload auth configuration
   - Create default admin user
   - Test login functionality

**Acceptance Criteria**:
- ✅ Users can register and log in
- ✅ Role-based access control working
- ✅ Admin can create supervisor accounts

---

### Step 3.2: Applications Collection

**Objective**: Create the Applications collection based on `application.py` model.

**Tasks**:

1. **Implement `src/collections/Applications.ts`**:
   - Map all fields from `ApplicationDetail` model
   - Include nested `applicationProcess` structure
   - Add assessment fields (identityRisk, serviceability, fraudCheck)
   - Configure noticeboard array field

2. **Add field relationships**:
   - Link to customers collection
   - Link to conversations collection
   - Set up proper indexing

3. **Configure admin interface**:
   - Set up default columns for list view
   - Configure field groups and tabs
   - Make fields read-only (only updated via events)

**Acceptance Criteria**:
- ✅ Applications collection created successfully
- ✅ All fields from pydantic model mapped
- ✅ Relationships properly configured
- ✅ Admin interface functional

---

### Step 3.3: Customers Collection

**Objective**: Create the Customers collection based on `customer.py` model.

**Tasks**:

1. **Implement `src/collections/Customers.ts`**:
   - Map all fields from `Customer` model
   - Include address groups (residential, mailing)
   - Add identity documents array
   - Configure customer flags

2. **Add computed fields**:
   - Full name generation hook
   - Address formatting
   - Document validation

3. **Set up relationships**:
   - Link to applications
   - Link to conversations
   - Configure reverse relationships

**Acceptance Criteria**:
- ✅ Customers collection created
- ✅ Address and identity document structures work
- ✅ Full name auto-generation working
- ✅ Relationships properly linked

---

### Step 3.4: Conversations Collection

**Objective**: Create the Conversations collection based on `chat.py` model.

**Tasks**:

1. **Implement `src/collections/Conversations.ts`**:
   - Map utterances array structure
   - Include conversation metadata
   - Add status tracking
   - Configure summary fields

2. **Configure utterance structure**:
   - Map from `Utterance` and `LLMChatResponse` models
   - Handle both user and assistant messages
   - Store rationale and additional data

3. **Add real-time hooks**:
   - After change hook for real-time updates
   - Status calculation logic
   - Message ordering and indexing

**Acceptance Criteria**:
- ✅ Conversations collection created
- ✅ Utterances structure properly configured
- ✅ Real-time hooks implemented
- ✅ Status calculation working

---

## Phase 4: Event Handlers Implementation

### Step 4.1: Application Event Handler

**Objective**: Process `applicationDetail_changed` events to update Applications and Customers.

**Tasks**:

1. **Create `src/workers/eventHandlers.ts`**:
   ```typescript
   export async function handleApplicationDetailChanged(payload: Payload, event: ChatLedgerEvent)
   export async function handleCustomerUpdate(payload: Payload, customerData: any)
   export async function handleCustomerIdentityDocuments(payload: Payload, customerId: string, documents: any[])
   ```

2. **Implement data transformation logic**:
   - Map pydantic field names to Payload field names
   - Handle nested objects (addresses, process states)
   - Calculate derived fields (loan fees, totals)

3. **Add upsert logic**:
   - Check for existing applications by applicationNumber
   - Update or create based on existence
   - Handle version tracking

**Acceptance Criteria**:
- ✅ Application events create/update applications
- ✅ Customer data extracted and stored
- ✅ Data transformation working correctly
- ✅ No duplicate records created

---

### Step 4.2: Conversation Event Handlers

**Objective**: Process conversation events to build chat transcripts.

**Tasks**:

1. **Implement conversation handlers**:
   ```typescript
   export async function handleConversationStarted(payload: Payload, event: ChatLedgerEvent)
   export async function handleUserInput(payload: Payload, event: ChatLedgerEvent)  
   export async function handleAssistantResponse(payload: Payload, event: ChatLedgerEvent)
   export async function handleConversationSummary(payload: Payload, event: ChatLedgerEvent)
   ```

2. **Build conversation transcript**:
   - Append utterances to conversations array
   - Handle both customer and assistant messages
   - Store timestamps and metadata

3. **Add conversation state tracking**:
   - Update conversation status
   - Track last message time
   - Handle conversation ending

**Acceptance Criteria**:
- ✅ Conversations created from events
- ✅ Messages properly appended
- ✅ Conversation state accurately tracked
- ✅ Real-time updates working

---

### Step 4.3: Assessment Event Handlers

**Objective**: Process assessment events to update application assessments.

**Tasks**:

1. **Implement assessment handlers**:
   ```typescript
   export async function handleAssessmentEvent(payload: Payload, event: ChatLedgerEvent)
   export async function handleNoticeboardUpdate(payload: Payload, event: ChatLedgerEvent)
   export async function handleFinalDecision(payload: Payload, event: ChatLedgerEvent)
   ```

2. **Map assessment types**:
   - `identityRisk_assessment` → `assessments.identityRisk`
   - `serviceability_assessment_results` → `assessments.serviceability`
   - `fraudCheck_results` → `assessments.fraudCheck`

3. **Handle noticeboard updates**:
   - Parse agent names and content
   - Maintain version history
   - Update application records

**Acceptance Criteria**:
- ✅ Assessment data stored in applications
- ✅ Noticeboard updates working
- ✅ Final decisions properly recorded
- ✅ Assessment UI displays correctly

---

## Phase 5: Resilience Implementation

### Step 5.1: Resilient Event Processing

**Objective**: Implement the resilient event processor with transaction-like semantics.

**Tasks**:

1. **Create `src/workers/resilientEventProcessor.ts`**:
   - Implement pending message recovery
   - Add cross-projection consistency
   - Include retry logic with exponential backoff
   - Add dead letter queue handling

2. **Implement projection consistency**:
   ```typescript
   private async processEventWithConsistency(event: ChatLedgerEvent, messageId: string)
   private async executeProjectionUpdates(updates: ProjectionUpdate[], processingId: string)
   private async rollbackSuccessfulUpdates(results: ProjectionResult[], updates: ProjectionUpdate[])
   ```

3. **Add error handling and monitoring**:
   - Critical error logging
   - Dead letter queue management
   - Processing metrics tracking

**Acceptance Criteria**:
- ✅ Pending messages processed on startup
- ✅ Cross-projection consistency maintained
- ✅ Failed events moved to dead letter queue
- ✅ Rollback mechanisms working

---

### Step 5.2: Idempotency and Circuit Breakers

**Objective**: Add idempotency protection and circuit breaker pattern.

**Tasks**:

1. **Create `src/workers/idempotentHandlers.ts`**:
   - Event deduplication logic
   - Version-based conflict resolution
   - TTL-based cleanup

2. **Implement `src/resilience/circuitBreaker.ts`**:
   - Circuit breaker state management
   - Failure threshold configuration
   - Auto-recovery logic

3. **Add health monitoring** (`src/monitoring/healthCheck.ts`):
   - Redis connection health
   - Database connectivity
   - Stream processing lag
   - Projection sync status

**Acceptance Criteria**:
- ✅ Duplicate events handled correctly
- ✅ Circuit breakers prevent cascading failures
- ✅ Health checks provide system status
- ✅ Monitoring alerts on issues

---

## Phase 6: Customer Portal Projection

### Step 6.1: Customer Portal Database Design

**Objective**: Set up optimized database for customer portal queries.

**Tasks**:

1. **Choose database technology**:
   - Option A: Use existing MongoDB with optimized schema
   - Option B: PostgreSQL with Prisma (if separate customer portal DB needed)
   - Recommendation: Start with existing MongoDB, consider PostgreSQL if performance requires it

2. **Design customer portal schema**:
   ```sql
   CREATE TABLE customer_applications (
     customer_id VARCHAR PRIMARY KEY,
     application_id VARCHAR,
     application_number VARCHAR,
     status VARCHAR,
     current_stage VARCHAR,
     progress_percentage INTEGER,
     loan_amount DECIMAL,
     -- ... other denormalized fields
   );
   ```

3. **Set up database connection and migrations**:
   - Configure Prisma or native driver
   - Create migration scripts (if using separate customer portal DB)
   - Set up connection pooling

**Acceptance Criteria**:
- ✅ Customer portal database configured
- ✅ Schema optimized for customer queries
- ✅ Database schema deployed (if using separate customer portal DB)
- ✅ Connection pooling configured

---

### Step 6.2: Customer Projection Processor

**Objective**: Create event processor for customer portal projection.

**Tasks**:

1. **Create `src/projections/customerPortal/processor.ts`**:
   ```typescript
   export class CustomerPortalProjection {
     async handleApplicationDetailChanged(event: ChatLedgerEvent)
     async handleConversationEvent(event: ChatLedgerEvent)
     private deriveStatus(data: any): string
     private calculateProgress(data: any): number
   }
   ```

2. **Implement data denormalization**:
   - Flatten nested structures for fast queries
   - Pre-calculate derived fields
   - Store frequently accessed data

3. **Add to resilient processor**:
   - Include customer projection in consistency checks
   - Add rollback mechanisms
   - Configure circuit breaker

**Acceptance Criteria**:
- ✅ Customer projection processor working
- ✅ Data properly denormalized
- ✅ Integrated with resilient processing
- ✅ Fast customer queries possible

---

### Step 6.3: Customer Portal API

**Objective**: Create API endpoints for customer portal queries.

**Tasks**:

1. **Create API routes**:
   ```
   src/app/api/customer/
   ├── [customerId]/
   │   ├── applications/route.ts
   │   ├── application/[applicationId]/route.ts
   │   └── conversations/route.ts
   ```

2. **Implement query endpoints**:
   - Get customer applications
   - Get application details
   - Get conversation summaries
   - Search functionality

3. **Add authentication and authorization**:
   - Customer authentication
   - Data access validation
   - Rate limiting

**Acceptance Criteria**:
- ✅ Customer API endpoints working
- ✅ Fast query performance
- ✅ Proper authentication implemented
- ✅ API documentation available

---

## Phase 7: Supervisor Dashboard UI

### Step 7.1: Dashboard Layout and Navigation

**Objective**: Create the main supervisor dashboard layout.

**Tasks**:

1. **Update Payload admin configuration**:
   - Custom dashboard routes
   - Navigation customization
   - Supervisor-only access

2. **Create dashboard components**:
   ```
   src/admin/components/
   ├── DashboardLayout.tsx
   ├── Navigation.tsx
   └── Header.tsx
   ```

3. **Implement routing**:
   - `/admin/conversations` - All conversations view
   - `/admin/customers` - Customer search
   - `/admin/applications` - Application management

**Acceptance Criteria**:
- ✅ Dashboard layout implemented
- ✅ Navigation working correctly
- ✅ Supervisor-only access enforced
- ✅ Responsive design working

---

### Step 7.2: All Conversations View

**Objective**: Implement the main conversations overview (User Stories 2.1-2.5).

**Tasks**:

1. **Create conversations list component**:
   ```typescript
   // src/admin/components/ConversationsView.tsx
   export const ConversationsView: React.FC = () => {
     // Real-time conversation list
     // Search functionality
     // Infinite scrolling
     // Conversation cards
   }
   ```

2. **Implement conversation cards**:
   - Display key conversation info
   - Status badges
   - Time since last message
   - Click to navigate to detail

3. **Add search and filtering**:
   - Search by customer name, application number
   - Filter by status
   - Real-time filtering

4. **Implement infinite scrolling**:
   - Load more conversations on scroll
   - Performance optimization
   - Loading states

**Acceptance Criteria**:
- ✅ Conversations displayed in grid layout
- ✅ Real-time updates working
- ✅ Search functionality implemented
- ✅ Infinite scrolling working
- ✅ Performance acceptable with large datasets

---

### Step 7.3: Conversation Detail View

**Objective**: Implement detailed conversation view (User Stories 3.1-3.4).

**Tasks**:

1. **Create conversation detail page**:
   ```
   src/app/admin/conversations/[id]/page.tsx
   ```

2. **Implement chat transcript view**:
   - Message bubbles for customer/assistant
   - Auto-scroll to latest message
   - Timestamp display
   - Message history

3. **Add assessment panels**:
   - Application details panel
   - Identity risk assessment
   - Serviceability assessment
   - Noticeboard panel

4. **Implement real-time updates**:
   - Live message updates
   - Assessment data updates
   - Status changes

**Acceptance Criteria**:
- ✅ Full conversation transcript displayed
- ✅ Assessment data panels working
- ✅ Real-time updates functioning
- ✅ Navigation between conversations
- ✅ Responsive design implemented

---

## Phase 8: Real-time System Implementation

### Step 8.1: Server-Sent Events Setup

**Objective**: Implement real-time updates via Server-Sent Events.

**Tasks**:

1. **Create SSE endpoint** (`src/app/api/realtime/route.ts`):
   ```typescript
   export async function GET(req: NextRequest) {
     // Set up SSE connection
     // Send initial data
     // Handle client disconnection
   }
   ```

2. **Implement real-time hooks**:
   - Add hooks to Payload collections
   - Publish changes to connected clients
   - Handle connection management

3. **Create client-side SSE handler**:
   ```typescript
   // src/hooks/useRealTimeUpdates.ts
   export const useRealTimeUpdates = () => {
     // Connect to SSE endpoint
     // Handle incoming updates
     // Update local state
   }
   ```

**Acceptance Criteria**:
- ✅ SSE endpoint functional
- ✅ Real-time updates pushing to clients
- ✅ Client reconnection handling
- ✅ Performance acceptable with multiple clients

---

### Step 8.2: State Management

**Objective**: Implement client-side state management for real-time updates.

**Tasks**:

1. **Choose state management solution**:
   - Recommendation: Zustand for simplicity
   - Alternative: Redux Toolkit

2. **Create stores**:
   ```typescript
   // src/stores/conversationStore.ts
   export const useConversationStore = create<ConversationStore>((set, get) => ({
     conversations: [],
     updateConversation: (conversation) => { /* ... */ },
     addMessage: (conversationId, message) => { /* ... */ }
   }))
   ```

3. **Integrate with components**:
   - Connect stores to UI components
   - Handle optimistic updates
   - Manage loading states

**Acceptance Criteria**:
- ✅ State management working correctly
- ✅ Real-time updates reflected in UI
- ✅ Optimistic updates implemented
- ✅ No memory leaks or performance issues

---

## Phase 9: Event Replay and Recovery

### Step 9.1: Event Replay Service

**Objective**: Implement ability to rebuild projections from events.

**Tasks**:

1. **Create `src/recovery/eventReplay.ts`**:
   ```typescript
   export class EventReplayService {
     async replayProjectionFromTimestamp(projectionName: string, fromTimestamp: string)
     async rebuildProjection(projectionName: string)
     private async getEventsInTimeRange(from: string, to?: string)
   }
   ```

2. **Add admin interface for replay**:
   - Admin-only event replay controls
   - Progress tracking
   - Error reporting

3. **Implement projection clearing**:
   - Safe projection data removal
   - Backup mechanisms
   - Rollback capabilities

**Acceptance Criteria**:
- ✅ Event replay functionality working
- ✅ Projections can be rebuilt from scratch
- ✅ Admin interface for replay operations
- ✅ Safe projection clearing implemented

---

### Step 9.2: Monitoring and Alerting

**Objective**: Implement comprehensive monitoring for the system.

**Tasks**:

1. **Create monitoring dashboard**:
   - Event processing metrics
   - Projection sync status
   - Error rates and alerts
   - Performance metrics

2. **Implement health checks**:
   - Redis connectivity
   - Database health
   - Stream processing lag
   - Memory and CPU usage

3. **Set up alerting**:
   - Dead letter queue alerts
   - Projection drift alerts
   - High error rate alerts
   - Performance degradation alerts

**Acceptance Criteria**:
- ✅ Monitoring dashboard functional
- ✅ Health checks comprehensive
- ✅ Alerting system working
- ✅ Metrics collection automated

---

## Phase 10: Testing and Documentation

### Step 10.1: Unit and Integration Testing

**Objective**: Implement comprehensive testing suite.

**Tasks**:

1. **Set up testing framework**:
   - Jest for unit tests
   - Playwright for E2E tests
   - Testing database setup

2. **Write unit tests**:
   - Event handlers
   - Data transformations
   - Utility functions
   - State management

3. **Create integration tests**:
   - End-to-end event processing
   - API endpoint testing
   - Real-time functionality
   - Error scenarios

4. **Add E2E tests**:
   - User login flow
   - Conversation viewing
   - Real-time updates
   - Search functionality

**Acceptance Criteria**:
- ✅ 80%+ test coverage achieved
- ✅ All critical paths tested
- ✅ E2E tests passing
- ✅ CI/CD pipeline running tests

---

### Step 10.2: Documentation and Deployment

**Objective**: Complete documentation and prepare for deployment.

**Tasks**:

1. **Create API documentation**:
   - OpenAPI specifications
   - Customer portal API docs
   - Admin API documentation
   - Authentication guides

2. **Write deployment guides**:
   - Production deployment steps
   - Environment configuration
   - Scaling considerations
   - Backup and recovery procedures

3. **Create operational runbooks**:
   - Event replay procedures
   - Troubleshooting guides
   - Monitoring setup
   - Performance tuning

4. **Prepare production deployment**:
   - Docker configuration
   - Environment setup
   - Security hardening
   - Load testing

**Acceptance Criteria**:
- ✅ Complete API documentation
- ✅ Deployment guides written
- ✅ Operational runbooks complete
- ✅ Production deployment ready

---

## Implementation Timeline

### Phase 1-2: Foundation (Week 1-2)
- Environment setup
- Basic event processing
- Payload configuration

### Phase 3-4: Core Collections and Handlers (Week 3-5)
- Payload collections implementation
- Event handlers development
- Data transformation logic

### Phase 5: Resilience (Week 6)
- Resilient event processing
- Circuit breakers and monitoring
- Error handling improvements

### Phase 6: Customer Portal (Week 7-8)
- Customer projection setup
- API development
- Performance optimization

### Phase 7-8: Supervisor UI and Real-time (Week 9-11)
- Dashboard implementation
- Real-time updates
- User interface polish

### Phase 9-10: Recovery and Production (Week 12-14)
- Event replay system
- Monitoring and alerting
- Testing and documentation
- Production deployment

---

## Success Criteria

**Technical Goals**:
- ✅ Event sourcing architecture fully implemented
- ✅ Multiple projections with consistency guarantees
- ✅ Real-time supervisor dashboard functional
- ✅ Customer portal API performing < 100ms response times
- ✅ 99.9% uptime with resilience measures
- ✅ Comprehensive monitoring and alerting

**User Experience Goals**:
- ✅ Supervisors can monitor conversations in real-time
- ✅ Search and filtering work seamlessly
- ✅ Assessment data displayed clearly
- ✅ Customer portal provides fast status lookups
- ✅ System handles high conversation volumes

**Operational Goals**:
- ✅ System can recover from failures automatically
- ✅ Projections can be rebuilt when needed
- ✅ Comprehensive documentation and runbooks
- ✅ Monitoring provides early warning of issues
- ✅ Team trained on system operations

---

## Next Steps

1. **Start with Phase 1**: Set up the development environment and basic Payload configuration
2. **Validate Event Flow**: Ensure the basic event processing pipeline works before building complex features
3. **Iterate on UI**: Build the supervisor dashboard incrementally, getting feedback from stakeholders
4. **Load Testing**: Test the system with realistic event volumes early in development
5. **Documentation**: Keep documentation updated throughout development

This implementation plan provides a structured approach to building a robust, scalable event sourcing system that meets all the requirements defined in the architecture and user stories. 