# Billie Realtime Supervisor Dashboard - Architecture Document

## Overview

This document outlines the high-level architecture and detailed implementation approach for the Billie Realtime Supervisor Dashboard using Payload CMS v3. The architecture leverages Payload's native capabilities to the fullest extent while implementing event sourcing patterns with Redis streams.

## High-Level Architecture

### Core Components

1. **Event Store (Redis Streams)** - Single source of truth for all business events
2. **Event Projections** - Materialized read models optimized for specific use cases:
   - **Supervisor Dashboard Projection** (Payload CMS Collections)
   - **Customer Portal Projection** (Optimized for customer queries)
3. **Projection Processors** - Workers that build and maintain projections from events
4. **Payload Admin Panel** - Real-time supervisor dashboard interface
5. **Customer API** - Fast read access to customer projection data
6. **Next.js App Router** - Server-side rendering and API routes

### Architecture Diagram

```
┌─────────────────────┐    ┌─────────────────────────────────────────────────────────┐
│  Chat Application   │    │                    EVENT STORE                          │
│  (Event Producer)   │    │                 (Redis Streams)                        │
└─────────────────────┘    │                                                         │
         │                  │  Events (Single Source of Truth):                      │
         │ Publishes        │  • conversation_started / user_input / assistant_*     │
         │ Events           │  • applicationDetail_changed                           │
         ▼                  │  • identityRisk_assessment / serviceability_*          │
┌─────────────────────┐    │  • final_decision / conversation_summary               │
│   Redis Stream      │    │                                                         │
│   (chatLedger)      │    └─────────────────────────────────────────────────────────┘
│                     │                               │
└─────────────────────┘                               │ Events consumed by
         │                                             │ multiple projections
         │                                             ▼
         ├─────────────────────┬─────────────────────────────────────────────────────┐
         │                     │                                                     │
         ▼                     ▼                                                     ▼
┌─────────────────────┐    ┌─────────────────────────────────────┐    ┌─────────────────────┐
│  Supervisor         │    │  Customer Portal                    │    │  Analytics          │
│  Dashboard          │    │  Projection                         │    │  Projection         │
│  Projection         │    │                                     │    │                     │
│                     │    │ ┌─────────────────────────────┐     │    │ ┌─────────────────┐ │
│ ┌─────────────────┐ │    │ │ Customer Read Model         │     │    │ │ Aggregated      │ │
│ │ Payload CMS     │ │    │ │ - applicationStatus         │     │    │ │ Metrics         │ │
│ │ Collections:    │ │    │ │ - loanDetails              │     │    │ │ - Conversion    │ │
│ │ • Applications  │ │    │ │ - conversationHistory      │     │    │ │ - Approval Rate │ │
│ │ • Customers     │ │    │ │ - documentStatus           │     │    │ │ - Volume        │ │
│ │ • Conversations │ │    │ └─────────────────────────────┘     │    │ └─────────────────┘ │
│ └─────────────────┘ │    │                                     │    │                     │
│                     │    │ Optimized for:                      │    │ Optimized for:      │
│ Optimized for:      │    │ • Fast customer queries             │    │ • Reporting         │
│ • Real-time         │    │ • Application status               │    │ • Business metrics  │
│   monitoring        │    │ • Document requirements            │    │ • Trend analysis    │
│ • Supervisor        │    │ • Conversation access              │    │                     │
│   operations        │    │                                     │    │                     │
└─────────────────────┘    └─────────────────────────────────────┘    └─────────────────────┘
         │                                   │                                      │
         ▼                                   ▼                                      ▼
┌─────────────────────┐    ┌─────────────────────────────────────┐    ┌─────────────────────┐
│ Projection          │    │ Projection                          │    │ Projection          │
│ Processor           │    │ Processor                           │    │ Processor           │
│ (Payload Workers)   │    │ (Customer API Workers)              │    │ (Analytics Workers) │
│                     │    │                                     │    │                     │
│ • Event handlers    │    │ • Customer-focused                  │    │ • Aggregation       │
│ • Real-time updates │    │   event handlers                    │    │   logic             │
│ • Admin interface   │    │ • Optimized queries                 │    │ • Metrics calc      │
└─────────────────────┘    └─────────────────────────────────────┘    └─────────────────────┘
         │                                   │                                      │
         ▼                                   ▼                                      ▼
┌─────────────────────┐    ┌─────────────────────────────────────┐    ┌─────────────────────┐
│ MongoDB             │    │ Customer Portal                     │    │ Analytics           │
│ (Supervisor DB)     │    │ Database                            │    │ Database            │
│                     │    │ (PostgreSQL/MongoDB)                │    │ (ClickHouse/        │
│ Collections:        │    │                                     │    │  TimeSeries DB)     │
│ • applications      │    │ Tables:                             │    │                     │
│ • customers         │    │ • customer_applications            │    │ Tables:             │
│ • conversations     │    │ • customer_conversations           │    │ • daily_metrics     │
│ • users            │    │ • document_status                   │    │ • conversation_stats│
└─────────────────────┘    └─────────────────────────────────────┘    └─────────────────────┘
         │                                   │                                      │
         ▼                                   ▼                                      ▼
┌─────────────────────┐    ┌─────────────────────────────────────┐    ┌─────────────────────┐
│ Supervisor          │    │ Customer                            │    │ Business            │
│ Dashboard UI        │    │ Portal App                          │    │ Intelligence        │
│                     │    │                                     │    │ Dashboard           │
│ • Live monitoring   │    │ • Application status               │    │                     │
│ • Conversation      │    │ • Upload documents                  │    │ • Performance       │
│   details           │    │ • Chat history                     │    │   analytics         │
│ • Risk assessments  │    │ • Loan details                     │    │ • Operational       │
└─────────────────────┘    └─────────────────────────────────────┘    │   insights          │
                                                                      └─────────────────────┘
```

## Event Sourcing with Projections

### Architectural Pattern

This architecture implements **Event Sourcing with Projections**:

1. **Events as Source of Truth**: All business events are stored in Redis streams as immutable facts
2. **Multiple Projections**: Different read models built from the same events, optimized for specific use cases
3. **Eventual Consistency**: Projections are updated asynchronously as events are processed
4. **Replay Capability**: Projections can be rebuilt from scratch by replaying all events

### Projection Types

#### 1. Supervisor Dashboard Projection (Payload CMS)
- **Purpose**: Real-time monitoring and operational oversight
- **Optimized for**: Complex admin queries, real-time updates, relationship navigation
- **Technology**: Payload CMS with MongoDB
- **Access Pattern**: Low volume, high complexity queries by supervisors

#### 2. Customer Portal Projection 
- **Purpose**: Fast customer-facing queries
- **Optimized for**: Simple lookups by customer ID, application status, document requirements
- **Technology**: Dedicated API with optimized database schema
- **Access Pattern**: High volume, simple queries by customers

#### 3. Analytics Projection (Future)
- **Purpose**: Business intelligence and reporting
- **Optimized for**: Aggregations, time-series analysis, metrics calculation
- **Technology**: Analytical database (ClickHouse, TimeSeries DB)
- **Access Pattern**: Batch processing, historical analysis

### Benefits of This Approach

✅ **Single Source of Truth**: Events provide complete audit trail and rebuilding capability
✅ **Performance Optimization**: Each projection optimized for its specific use case  
✅ **Scalability**: Projections can be scaled independently based on load
✅ **Flexibility**: New projections can be added without affecting existing systems
✅ **Data Consistency**: Eventually consistent across all projections
✅ **Fault Tolerance**: Projections can be rebuilt if corrupted

## Detailed Implementation Plan

### 1. Supervisor Dashboard Projection (Payload Collections)

#### 1.1 Conversations Collection

```typescript
// src/collections/Conversations.ts
import type { CollectionConfig } from 'payload';
import { triggerRealTimeUpdate } from '../hooks/realTimeUpdates';

export const Conversations: CollectionConfig = {
  slug: 'conversations',
  admin: {
    useAsTitle: 'applicationNumber',
    defaultColumns: ['applicationNumber', 'customerId', 'status', 'startedAt'],
    group: 'Supervisor Dashboard',
  },
  access: {
    read: ({ req: { user } }) => {
      return user?.role === 'supervisor' || user?.role === 'admin';
    },
    create: false, // Only created via events
    update: false, // Only updated via events
    delete: false,
  },
  fields: [
    {
      name: 'conversationId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'applicationNumber',
      type: 'text',
      required: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'customerId',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'applicationId',
      type: 'relationship',
      relationTo: 'applications',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Soft End', value: 'soft_end' },
        { label: 'Hard End', value: 'hard_end' },
        { label: 'Approved', value: 'approved' },
        { label: 'Declined', value: 'declined' },
      ],
      defaultValue: 'active',
      index: true,
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'updatedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'utterances',
      type: 'array',
      label: 'Conversation Messages',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'username',
          type: 'text',
          admin: {
            description: 'Usually "customer" or "assistant"',
          },
        },
        {
          name: 'utterance',
          type: 'textarea',
          required: true,
        },
        {
          name: 'rationale',
          type: 'textarea',
          admin: {
            description: 'Internal reasoning for assistant responses',
          },
        },
        {
          name: 'createdAt',
          type: 'date',
          required: true,
        },
        {
          name: 'updatedAt',
          type: 'date',
        },
        {
          name: 'answerInputType',
          type: 'text',
          admin: {
            description: 'Frontend input type hint (e.g. address, email)',
          },
        },
        {
          name: 'prevSeq',
          type: 'number',
          admin: {
            description: 'Previous sequence number in conversation',
          },
        },
        {
          name: 'endConversation',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'additionalData',
          type: 'json',
          admin: {
            description: 'Additional data for frontend enrichment',
          },
        },
      ],
    },
    {
      name: 'purpose',
          type: 'text',
      admin: {
        description: 'Conversation purpose from summary',
        readOnly: true,
      },
    },
    {
      name: 'facts',
          type: 'array',
      admin: {
        description: 'Key facts from conversation summary',
        readOnly: true,
      },
          fields: [
            {
          name: 'fact',
          type: 'text',
        },
      ],
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        await triggerRealTimeUpdate('conversations', doc, operation);
      },
    ],
  },
};
```

#### 1.2 Customers Collection

```typescript
// src/collections/Customers.ts
import type { CollectionConfig } from 'payload';
import { triggerRealTimeUpdate } from '../hooks/realTimeUpdates';

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'customerId', 'dateOfBirth'],
    group: 'Supervisor Dashboard',
  },
  access: {
    read: ({ req: { user } }) => {
      return user?.role === 'supervisor' || user?.role === 'admin';
    },
    create: false, // Only created via events
    update: false, // Only updated via events
    delete: false,
  },
  fields: [
    {
      name: 'customerId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Mr, Mrs, Ms, Dr, etc.',
        readOnly: true,
      },
    },
    {
      name: 'preferredName',
      type: 'text',
      admin: {
        description: 'Name customer prefers to be called',
        readOnly: true,
      },
    },
    {
      name: 'firstName',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'middleName',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'lastName',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'fullName',
      type: 'text',
      hooks: {
        beforeChange: [
          ({ data }) => {
            // Construct full name from parts
            const parts = [data.firstName, data.middleName, data.lastName].filter(Boolean);
            return parts.join(' ') || data.preferredName || '';
          },
        ],
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'emailAddress',
      type: 'email',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'mobilePhoneNumber',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'dateOfBirth',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMM yyyy',
        },
        readOnly: true,
      },
    },
    {
      name: 'residentialAddress',
      type: 'group',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'street',
      type: 'text',
    },
    {
          name: 'city',
          type: 'text',
        },
        {
          name: 'state',
          type: 'text',
        },
        {
          name: 'postcode',
          type: 'text',
        },
        {
          name: 'country',
          type: 'text',
          defaultValue: 'Australia',
        },
      ],
    },
    {
      name: 'mailingAddress',
      type: 'group',
      admin: {
        readOnly: true,
        description: 'Address for mail delivery (e.g., cards)',
      },
      fields: [
        {
          name: 'street',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
        },
        {
          name: 'state',
          type: 'text',
        },
        {
          name: 'postcode',
          type: 'text',
        },
        {
          name: 'country',
          type: 'text',
          defaultValue: 'Australia',
        },
      ],
    },
    {
      name: 'staffFlag',
      type: 'checkbox',
      admin: {
        description: 'Indicates if customer is a staff member',
        readOnly: true,
      },
    },
    {
      name: 'investorFlag',
      type: 'checkbox',
      admin: {
        description: 'Indicates if customer is an investor',
        readOnly: true,
      },
    },
    {
      name: 'founderFlag',
      type: 'checkbox',
      admin: {
        description: 'Indicates if customer is a founder',
        readOnly: true,
      },
    },
    {
      name: 'ekycEntityId',
      type: 'text',
      admin: {
        description: 'eKYC identifier from Frankie',
        readOnly: true,
      },
    },
    {
      name: 'ekycStatus',
      type: 'select',
      options: [
        { label: 'Successful', value: 'successful' },
        { label: 'Failed', value: 'failed' },
        { label: 'Pending', value: 'pending' },
      ],
      admin: {
        description: 'Status of eKYC attempt',
        readOnly: true,
      },
    },
    {
      name: 'individualStatus',
      type: 'select',
      options: [
        { label: 'Living', value: 'LIVING' },
        { label: 'Deceased', value: 'DECEASED' },
        { label: 'Missing', value: 'MISSING' },
      ],
      admin: {
        description: 'Lifecycle status of the individual',
        readOnly: true,
      },
    },
    {
      name: 'identityDocuments',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'documentType',
          type: 'select',
          options: [
            { label: 'Drivers Licence', value: 'DRIVERS_LICENCE' },
            { label: 'Passport', value: 'PASSPORT' },
            { label: 'Medicare', value: 'MEDICARE' },
          ],
          required: true,
        },
        {
          name: 'documentSubtype',
          type: 'text',
          admin: {
            description: 'e.g., Medicare Card Colour',
          },
        },
        {
          name: 'documentNumber',
          type: 'text',
          required: true,
        },
        {
          name: 'expiryDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'stateOfIssue',
          type: 'text',
        },
        {
          name: 'countryOfIssue',
          type: 'text',
          defaultValue: 'Australia',
        },
        {
          name: 'additionalInfo',
          type: 'json',
          admin: {
            description: 'Additional document information as key-value pairs',
          },
        },
      ],
    },
    {
      name: 'applications',
      type: 'relationship',
      relationTo: 'applications',
      hasMany: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'conversations',
      type: 'relationship',
      relationTo: 'conversations',
      hasMany: true,
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        await triggerRealTimeUpdate('customers', doc, operation);
      },
    ],
  },
};
```

#### 1.3 Applications Collection

```typescript
// src/collections/Applications.ts
import type { CollectionConfig } from 'payload';
import { triggerRealTimeUpdate } from '../hooks/realTimeUpdates';

export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    useAsTitle: 'applicationNumber',
    defaultColumns: ['applicationNumber', 'customerId', 'loanAmount', 'applicationOutcome', 'updatedAt'],
    group: 'Supervisor Dashboard',
  },
  access: {
    read: ({ req: { user } }) => {
      return user?.role === 'supervisor' || user?.role === 'admin';
    },
    create: false, // Only created via events
    update: false, // Only updated via events
    delete: false,
  },
  fields: [
    {
      name: 'applicationNumber',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'customerId',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'loanPurpose',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'loanAmount',
      type: 'number',
      admin: {
        readOnly: true,
        step: 0.01,
      },
    },
    {
      name: 'loanFee',
      type: 'number',
      admin: {
        readOnly: true,
        step: 0.01,
        description: 'Calculated at 5% of loan amount',
      },
    },
    {
      name: 'loanTotalPayable',
      type: 'number',
      admin: {
        readOnly: true,
        step: 0.01,
        description: 'Loan amount + fee',
      },
    },
    {
      name: 'loanTerm',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Loan term in days/months',
      },
    },
    {
      name: 'customerAttestationAcceptance',
      type: 'checkbox',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'statementCaptureConsentProvided',
      type: 'checkbox',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'statementCaptureCompleted',
      type: 'checkbox',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'productOfferAcceptance',
      type: 'checkbox',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'applicationOutcome',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Declined', value: 'declined' },
        { label: 'Withdrawn', value: 'withdrawn' },
      ],
      admin: {
        readOnly: true,
      },
      index: true,
    },
    {
      name: 'applicationProcess',
      type: 'group',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'currentProcessStage',
          type: 'text',
          admin: {
            description: 'Current stage in the application process',
          },
        },
        {
          name: 'currentProcessStep',
          type: 'text',
          admin: {
            description: 'Current step within the stage',
          },
        },
        {
          name: 'startedAt',
          type: 'date',
        },
        {
          name: 'updatedAt',
          type: 'date',
        },
        {
          name: 'applicationProcessState',
          type: 'array',
          label: 'Process Stages',
          fields: [
            {
              name: 'stageName',
              type: 'text',
              required: true,
            },
            {
              name: 'complete',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'prompt',
              type: 'textarea',
            },
            {
              name: 'steps',
              type: 'array',
              fields: [
                {
                  name: 'stepName',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                },
                {
                  name: 'complete',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'type',
                  type: 'select',
                  options: [
                    { label: 'LLM', value: 'llm' },
                    { label: 'Business Logic', value: 'business_logic' },
                    { label: 'User Input', value: 'user_input' },
                  ],
                  defaultValue: 'llm',
                },
                {
                  name: 'completionEventName',
                  type: 'text',
                },
                {
                  name: 'answerInputType',
                  type: 'text',
                  admin: {
                    description: 'Frontend input type hint',
                  },
                },
                {
                  name: 'prompts',
                  type: 'group',
                  fields: [
                    {
                      name: 'main',
                      type: 'textarea',
                    },
                    {
                      name: 'completenessCheck',
                      type: 'textarea',
                    },
                    {
                      name: 'confirmation',
                      type: 'textarea',
                    },
                    {
                      name: 'outputJson',
                      type: 'textarea',
                    },
                    {
                      name: 'mappingOut',
                      type: 'json',
                    },
                  ],
                },
                {
                  name: 'businessLogic',
                  type: 'group',
                  fields: [
                    {
                      name: 'moduleName',
                      type: 'text',
                    },
                    {
                      name: 'methodName',
                      type: 'text',
                    },
                    {
                      name: 'mappingIn',
                      type: 'json',
                    },
                    {
                      name: 'mappingOut',
                      type: 'json',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'conversation',
          type: 'array',
          label: 'Process Conversation Log',
          fields: [
            {
              name: 'role',
              type: 'select',
              options: [
                { label: 'User', value: 'user' },
                { label: 'Assistant', value: 'assistant' },
                { label: 'System', value: 'system' },
              ],
            },
            {
              name: 'content',
              type: 'textarea',
            },
            {
              name: 'timestamp',
              type: 'date',
            },
          ],
        },
      ],
    },
    {
      name: 'assessments',
      type: 'group',
      admin: {
        readOnly: true,
        description: 'Risk and serviceability assessments',
      },
      fields: [
        {
          name: 'identityRisk',
          type: 'json',
          admin: {
            description: 'Identity risk assessment results',
          },
        },
        {
          name: 'serviceability',
          type: 'json',
          admin: {
            description: 'Serviceability assessment results',
          },
        },
        {
          name: 'fraudCheck',
          type: 'json',
          admin: {
            description: 'Fraud check results',
          },
        },
      ],
    },
    {
      name: 'noticeboard',
      type: 'array',
      admin: {
        readOnly: true,
        description: 'Agent notes and updates',
      },
      fields: [
        {
          name: 'agentName',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'textarea',
          required: true,
        },
        {
          name: 'timestamp',
          type: 'date',
          required: true,
        },
        {
          name: 'versions',
          type: 'array',
          fields: [
            {
              name: 'content',
              type: 'textarea',
            },
            {
              name: 'timestamp',
              type: 'date',
            },
          ],
        },
      ],
    },
    {
      name: 'conversations',
      type: 'relationship',
      relationTo: 'conversations',
      hasMany: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        await triggerRealTimeUpdate('applications', doc, operation);
      },
    ],
  },
};
```

#### 1.4 Enhancing the Users Collection for Supervisor Roles

```typescript
// src/collections/Users.ts
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Administration',
  },
  auth: true,
  access: {
    read: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.id === req.user?.id;
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin';
    },
    update: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.id === req.user?.id;
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin';
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: ['admin', 'supervisor'],
      defaultValue: 'supervisor',
      required: true,
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
  ],
};
```

### 2. Payload Hooks Implementation

#### 2.1 Real-time Update System

```typescript
// src/hooks/realTimeUpdates.ts
import { Payload } from 'payload';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const triggerRealTimeUpdate = async (
  collection: string,
  doc: any,
  operation: 'create' | 'update' | 'delete' = 'update'
) => {
  const update = {
    collection,
    operation,
    doc,
    timestamp: new Date().toISOString(),
  };

  await redis.publish('payload-updates', JSON.stringify(update));
};

export const setupRealTimeSubscriptions = (payload: Payload) => {
  // Set up SSE endpoint for real-time updates
  payload.express.use('/api/realtime', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const clientId = Date.now();
    const client = { id: clientId, res };

    // Store client connection
    payload.realTimeClients = payload.realTimeClients || new Set();
    payload.realTimeClients.add(client);

    req.on('close', () => {
      payload.realTimeClients.delete(client);
    });
  });
};
```

### 2. Customer Portal Projection

The customer portal projection is optimized for fast customer queries with a flattened, denormalized schema:

```typescript
// Customer Portal API Schema (PostgreSQL/MongoDB)

interface CustomerApplication {
  // Flattened for fast lookups
  customerId: string;
  applicationId: string;
  applicationNumber: string;
  
  // Current status (derived from events)
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'declined';
  currentStage: string;
  progressPercentage: number;
  
  // Loan details (latest values)
  loanAmount: number;
  loanFee: number;
  loanTotalPayable: number;
  
  // Customer details (denormalized for performance)
  customerName: string;
  customerEmail: string;
  
  // Document requirements
  requiredDocuments: {
    documentType: string;
    status: 'required' | 'uploaded' | 'verified' | 'rejected';
    reason?: string;
  }[];
  
  // Key timestamps
  submittedAt: Date;
  lastUpdateAt: Date;
  estimatedDecisionDate?: Date;
  
  // Quick access flags
  hasOutstandingRequirements: boolean;
  canUploadDocuments: boolean;
  
  // Version for optimistic locking
  version: number;
}

interface CustomerConversationSummary {
  customerId: string;
  conversationId: string;
  applicationId: string;
  
  // Summary for customer view
  purpose: string;
  status: 'active' | 'completed';
  lastMessage: string;
  lastMessageAt: Date;
  
  // Customer can access conversation
  isAccessible: boolean;
  
  // Quick stats
  messageCount: number;
  startedAt: Date;
}
```

#### 2.1 Customer Portal Projection Processor

```typescript
// src/projections/customerPortal/processor.ts
import { ChatLedgerEvent } from '../../workers/eventProcessor';

export class CustomerPortalProjection {
  
  async handleApplicationDetailChanged(event: ChatLedgerEvent) {
    const { aid, dat, tsp } = event;
    
    const application = {
      customerId: dat.customerId,
      applicationId: aid,
      applicationNumber: dat.applicationNumber,
      status: this.deriveStatus(dat),
      currentStage: dat.applicationProcess?.currentProcessStage || 'submitted',
      progressPercentage: this.calculateProgress(dat),
      loanAmount: parseFloat(dat.loanAmount || '0'),
      loanFee: parseFloat(dat.loanFee || '0'),
      loanTotalPayable: parseFloat(dat.loanTotalPayable || '0'),
      customerName: `${dat.customer?.first_name} ${dat.customer?.last_name}`.trim(),
      customerEmail: dat.customer?.email_address?.value,
      requiredDocuments: this.mapDocumentRequirements(dat),
      lastUpdateAt: new Date(tsp),
      hasOutstandingRequirements: this.hasOutstandingDocs(dat),
      canUploadDocuments: this.canUploadDocs(dat),
      version: (dat.version || 0) + 1,
    };

    // Upsert to customer portal database
    await this.upsertCustomerApplication(application);
  }

  async handleConversationEvent(event: ChatLedgerEvent) {
    const { cid, aid, typ, dat, tsp } = event;
    
    if (typ === 'conversation_started') {
      await this.createConversationSummary({
        conversationId: cid,
        applicationId: aid,
        customerId: event.uid,
        purpose: 'Loan Application Chat',
        status: 'active',
        isAccessible: true,
        messageCount: 0,
        startedAt: new Date(tsp),
        lastMessageAt: new Date(tsp),
      });
    } else if (typ === 'user_input' || typ === 'assistant_response') {
      await this.updateConversationSummary(cid, {
        lastMessage: this.sanitizeMessage(dat?.utterance || dat?.u),
        lastMessageAt: new Date(tsp),
        messageCount: { increment: 1 },
      });
    }
  }

  private deriveStatus(data: any): string {
    if (data.applicationOutcome === 'approved') return 'approved';
    if (data.applicationOutcome === 'declined') return 'declined';
    if (data.applicationProcess?.currentProcessStage) return 'under_review';
    return 'draft';
  }

  private calculateProgress(data: any): number {
    const stages = data.applicationProcess?.applicationProcessState || [];
    const completedStages = stages.filter((s: any) => s.complete).length;
    return stages.length > 0 ? (completedStages / stages.length) * 100 : 0;
  }
}
```

#### 2.2 Customer Portal API

```typescript
// Customer Portal API endpoints optimized for customer queries

// GET /api/customer/:customerId/applications
export async function getCustomerApplications(customerId: string) {
  return await db.customerApplications.findMany({
    where: { customerId },
    orderBy: { lastUpdateAt: 'desc' }
  });
}

// GET /api/customer/:customerId/application/:applicationId
export async function getApplicationDetail(customerId: string, applicationId: string) {
  return await db.customerApplications.findUnique({
    where: { 
      customerId_applicationId: { customerId, applicationId }
    }
  });
}

// GET /api/customer/:customerId/conversations
export async function getCustomerConversations(customerId: string) {
  return await db.customerConversations.findMany({
    where: { 
      customerId,
      isAccessible: true 
    },
    orderBy: { lastMessageAt: 'desc' }
  });
}
```

#### 2.3 Event Processing Worker Modules

```typescript
// src/workers/eventProcessor.ts
import { Payload } from 'payload';
import Redis from 'ioredis';
import { 
  handleConversationStarted,
  handleUserInput, 
  handleAssistantResponse,
  handleApplicationDetailChanged,
  handleAssessmentEvent,
  handleNoticeboardUpdate,
  handleFinalDecision,
  handleConversationSummary
} from './eventHandlers';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface ChatLedgerEvent {
  agt: string; // agent (usually 'broker')
  typ: string; // event type
  cid: string; // conversation_id
  aid?: string; // application_id
  uid?: string; // customer_id
  seq?: number; // sequence number
  tsp: string; // timestamp
  dat?: any; // event data
}

export const setupEventProcessing = async (payload: Payload) => {
  const consumerGroup = 'payload-dashboard';
  const consumerId = `payload-worker-${process.env.WORKER_ID || '1'}`;
  const streamKey = 'chatLedger';

  // Create consumer group
  try {
    await redis.xgroup('CREATE', streamKey, consumerGroup, '0', 'MKSTREAM');
  } catch (error) {
    // Group might already exist
    console.log('Consumer group already exists or stream not found');
  }

  // Start event processing
  processEvents(payload, streamKey, consumerGroup, consumerId);
};

const processEvents = async (
  payload: Payload,
  streamKey: string,
  consumerGroup: string,
  consumerId: string
) => {
  console.log(`Starting event processor: ${consumerId}`);
  
  while (true) {
    try {
      const results = await redis.xreadgroup(
        'GROUP',
        consumerGroup,
        consumerId,
        'COUNT',
        10,
        'BLOCK',
        1000,
        'STREAMS',
        streamKey,
        '>'
      );

      if (results && results.length > 0) {
        const [streamName, messages] = results[0];
        
        for (const [messageId, fields] of messages) {
          try {
            const event = parseEvent(fields);
            
            // Only process broker events for dashboard
            if (event.agt === 'broker') {
              await processBrokerEvent(payload, event, messageId);
            }
            
            await redis.xack(streamKey, consumerGroup, messageId);
          } catch (error) {
            console.error(`Error processing message ${messageId}:`, error);
            // Move to dead letter queue or retry logic here
          }
        }
      }
    } catch (error) {
      console.error('Error consuming events:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

const parseEvent = (fields: string[]): ChatLedgerEvent => {
  const event: any = {};
  for (let i = 0; i < fields.length; i += 2) {
    const key = fields[i];
    const value = fields[i + 1];
    
    // Parse JSON data if it's the dat field
    if (key === 'dat' && value) {
      try {
        event[key] = JSON.parse(value);
      } catch {
        event[key] = value;
      }
    } else {
      event[key] = value;
    }
  }
  return event as ChatLedgerEvent;
};

const processBrokerEvent = async (payload: Payload, event: ChatLedgerEvent, messageId: string) => {
  console.log(`Processing event: ${event.typ} for conversation: ${event.cid}`);
  
  try {
  switch (event.typ) {
    case 'conversation_started':
      await handleConversationStarted(payload, event);
      break;
    case 'user_input':
        await handleUserInput(payload, event);
        break;
    case 'assistant_response':
        await handleAssistantResponse(payload, event);
      break;
    case 'applicationDetail_changed':
      await handleApplicationDetailChanged(payload, event);
      break;
    case 'identityRisk_assessment':
    case 'serviceability_assessment_results':
      case 'fraudCheck_results':
      await handleAssessmentEvent(payload, event);
      break;
    case 'noticeboard_updated':
      await handleNoticeboardUpdate(payload, event);
      break;
    case 'final_decision':
      await handleFinalDecision(payload, event);
      break;
      case 'conversation_summary':
        await handleConversationSummary(payload, event);
        break;
      default:
        console.log(`Unhandled event type: ${event.typ}`);
    }
  } catch (error) {
    console.error(`Error handling event ${event.typ}:`, error);
    throw error; // Re-throw to trigger retry logic
  }
};
```

```typescript
// src/workers/eventHandlers.ts
import { Payload } from 'payload';
import { ChatLedgerEvent } from './eventProcessor';

export const handleConversationStarted = async (payload: Payload, event: ChatLedgerEvent) => {
  const { cid, aid, uid, dat } = event;
  
  try {
    // Create or update conversation record
    const conversationData = {
      conversationId: cid,
      applicationNumber: aid,
      customerId: uid,
      applicationId: aid, // Will be resolved to relationship
      status: 'active',
      startedAt: new Date(event.tsp),
      utterances: [],
      version: 1,
    };

    // Check if conversation already exists
    const existingConversations = await payload.find({
      collection: 'conversations',
      where: {
        conversationId: {
          equals: cid,
        },
      },
    });

    if (existingConversations.docs.length === 0) {
      await payload.create({
        collection: 'conversations',
        data: conversationData,
      });
      console.log(`Created conversation: ${cid}`);
    } else {
      console.log(`Conversation already exists: ${cid}`);
    }
  } catch (error) {
    console.error(`Error creating conversation ${cid}:`, error);
    throw error;
  }
};

export const handleUserInput = async (payload: Payload, event: ChatLedgerEvent) => {
  await handleUtterance(payload, event, 'customer');
};

export const handleAssistantResponse = async (payload: Payload, event: ChatLedgerEvent) => {
  await handleUtterance(payload, event, 'assistant');
};

const handleUtterance = async (payload: Payload, event: ChatLedgerEvent, username: string) => {
  const { cid, dat, seq, tsp } = event;
  
  try {
    // Find the conversation
    const conversations = await payload.find({
      collection: 'conversations',
      where: {
        conversationId: {
          equals: cid,
        },
      },
    });

    if (conversations.docs.length === 0) {
      console.error(`Conversation not found: ${cid}`);
      return;
    }

    const conversation = conversations.docs[0];
    const utteranceData = {
      username,
      utterance: dat?.utterance || dat?.u || '',
      rationale: dat?.rationale || dat?.r || '',
      createdAt: new Date(tsp),
      answerInputType: dat?.answer_input_type || dat?.a || '',
      prevSeq: dat?.prev_seq || seq,
      endConversation: dat?.end_conversation || dat?.e || false,
      additionalData: dat?.additional_data || dat?.d || {},
    };

    // Add utterance to conversation
    const updatedUtterances = [...(conversation.utterances || []), utteranceData];

    await payload.update({
      collection: 'conversations',
      id: conversation.id,
      data: {
        utterances: updatedUtterances,
        updatedAt: new Date(tsp),
        status: utteranceData.endConversation ? 'soft_end' : conversation.status,
      },
    });

    console.log(`Added ${username} utterance to conversation: ${cid}`);
  } catch (error) {
    console.error(`Error adding utterance to conversation ${cid}:`, error);
    throw error;
  }
};

export const handleApplicationDetailChanged = async (payload: Payload, event: ChatLedgerEvent) => {
  const { aid, dat, tsp } = event;
  
  try {
    // Handle customer creation/update first
    if (dat.customer) {
      await handleCustomerUpdate(payload, dat.customer);
    }

    // Handle customer identity documents
    if (dat.customerIdentityDocuments) {
      await handleCustomerIdentityDocuments(payload, dat.customer?.customer_id, dat.customerIdentityDocuments);
    }

    // Create or update application
    const applicationData = {
      applicationNumber: dat.applicationNumber || aid,
      customerId: dat.customerId || dat.customer?.customer_id,
      loanPurpose: dat.loanPurpose,
      loanAmount: dat.loanAmount ? parseFloat(dat.loanAmount) : null,
      loanFee: dat.loanFee ? parseFloat(dat.loanFee) : null,
      loanTotalPayable: dat.loanTotalPayable ? parseFloat(dat.loanTotalPayable) : null,
      loanTerm: dat.loanTerm ? parseInt(dat.loanTerm) : null,
      customerAttestationAcceptance: dat.customerAttestationAcceptance,
      statementCaptureConsentProvided: dat.statementCaptureConsentProvided,
      statementCaptureCompleted: dat.statementCaptureCompleted,
      productOfferAcceptance: dat.productOfferAcceptance,
      applicationOutcome: dat.applicationOutcome?.toLowerCase(),
      version: (dat.version || 1) + 1,
    };

    // Check if application exists
    const existingApplications = await payload.find({
      collection: 'applications',
      where: {
        applicationNumber: {
          equals: applicationData.applicationNumber,
        },
      },
    });

    if (existingApplications.docs.length === 0) {
      await payload.create({
        collection: 'applications',
        data: applicationData,
      });
      console.log(`Created application: ${applicationData.applicationNumber}`);
    } else {
      await payload.update({
        collection: 'applications',
        id: existingApplications.docs[0].id,
        data: applicationData,
      });
      console.log(`Updated application: ${applicationData.applicationNumber}`);
    }
  } catch (error) {
    console.error(`Error handling application detail change for ${aid}:`, error);
    throw error;
  }
};

const handleCustomerUpdate = async (payload: Payload, customerData: any) => {
  if (!customerData.customer_id) return;

  const customer = {
    customerId: customerData.customer_id,
    title: customerData.title,
    preferredName: customerData.preferred_name,
    firstName: customerData.first_name,
    middleName: customerData.middle_name,
    lastName: customerData.last_name,
    emailAddress: customerData.email_address?.value,
    mobilePhoneNumber: customerData.mobile_phone_number,
    dateOfBirth: customerData.date_of_birth ? new Date(customerData.date_of_birth) : null,
    residentialAddress: customerData.residential_address ? {
      street: customerData.residential_address.street,
      city: customerData.residential_address.city,
      state: customerData.residential_address.state,
      postcode: customerData.residential_address.postcode,
      country: customerData.residential_address.country || 'Australia',
    } : null,
    mailingAddress: customerData.mailing_address ? {
      street: customerData.mailing_address.street,
      city: customerData.mailing_address.city,
      state: customerData.mailing_address.state,
      postcode: customerData.mailing_address.postcode,
      country: customerData.mailing_address.country || 'Australia',
    } : null,
    staffFlag: customerData.staff_flag,
    investorFlag: customerData.investor_flag,
    founderFlag: customerData.founder_flag,
    ekycEntityId: customerData.ekyc_entity_id,
    ekycStatus: customerData.ekyc_status,
    individualStatus: customerData.individual_status,
  };

  // Check if customer exists
  const existingCustomers = await payload.find({
    collection: 'customers',
    where: {
      customerId: {
        equals: customer.customerId,
      },
    },
  });

  if (existingCustomers.docs.length === 0) {
    await payload.create({
      collection: 'customers',
      data: customer,
    });
    console.log(`Created customer: ${customer.customerId}`);
  } else {
    await payload.update({
      collection: 'customers',
      id: existingCustomers.docs[0].id,
      data: customer,
    });
    console.log(`Updated customer: ${customer.customerId}`);
  }
};

const handleCustomerIdentityDocuments = async (payload: Payload, customerId: string, documents: any[]) => {
  if (!customerId || !documents) return;

  const identityDocuments = documents.map(doc => ({
    documentType: doc.document_type,
    documentSubtype: doc.document_subtype,
    documentNumber: doc.document_number,
    expiryDate: doc.expiry_date ? new Date(doc.expiry_date) : null,
    stateOfIssue: doc.state_of_issue,
    countryOfIssue: doc.country_of_issue || 'Australia',
    additionalInfo: doc.additional_info || {},
  }));

  // Update customer with identity documents
  const customers = await payload.find({
    collection: 'customers',
    where: {
      customerId: {
        equals: customerId,
      },
    },
  });

  if (customers.docs.length > 0) {
    await payload.update({
      collection: 'customers',
      id: customers.docs[0].id,
      data: {
        identityDocuments,
      },
    });
    console.log(`Updated identity documents for customer: ${customerId}`);
  }
};

export const handleAssessmentEvent = async (payload: Payload, event: ChatLedgerEvent) => {
  const { aid, typ, dat, tsp } = event;
  
  try {
    const applications = await payload.find({
      collection: 'applications',
      where: {
        applicationNumber: {
          equals: aid,
        },
      },
    });

    if (applications.docs.length === 0) {
      console.error(`Application not found for assessment: ${aid}`);
      return;
    }

    const application = applications.docs[0];
    const assessments = application.assessments || {};

    // Update specific assessment type
    switch (typ) {
      case 'identityRisk_assessment':
        assessments.identityRisk = dat;
        break;
      case 'serviceability_assessment_results':
        assessments.serviceability = dat;
        break;
      case 'fraudCheck_results':
        assessments.fraudCheck = dat;
        break;
    }

    await payload.update({
      collection: 'applications',
      id: application.id,
      data: {
        assessments,
        version: (application.version || 1) + 1,
      },
    });

    console.log(`Updated ${typ} for application: ${aid}`);
  } catch (error) {
    console.error(`Error handling assessment event for ${aid}:`, error);
    throw error;
  }
};

export const handleNoticeboardUpdate = async (payload: Payload, event: ChatLedgerEvent) => {
  const { aid, dat, tsp } = event;
  
  try {
    const applications = await payload.find({
      collection: 'applications',
      where: {
        applicationNumber: {
          equals: aid,
        },
      },
    });

    if (applications.docs.length === 0) {
      console.error(`Application not found for noticeboard update: ${aid}`);
      return;
    }

    const application = applications.docs[0];
    const noticeboard = application.noticeboard || [];

    const noticeData = {
      agentName: dat.agentName,
      content: dat.content,
      timestamp: new Date(tsp),
      versions: dat.versions || [],
    };

    noticeboard.push(noticeData);

    await payload.update({
      collection: 'applications',
      id: application.id,
      data: {
        noticeboard,
        version: (application.version || 1) + 1,
      },
    });

    console.log(`Updated noticeboard for application: ${aid}`);
  } catch (error) {
    console.error(`Error handling noticeboard update for ${aid}:`, error);
    throw error;
  }
};

export const handleFinalDecision = async (payload: Payload, event: ChatLedgerEvent) => {
  const { aid, cid, dat, tsp } = event;
  
  try {
    // Update application outcome
    if (aid) {
      const applications = await payload.find({
        collection: 'applications',
        where: {
          applicationNumber: {
            equals: aid,
          },
        },
      });

      if (applications.docs.length > 0) {
        await payload.update({
          collection: 'applications',
          id: applications.docs[0].id,
          data: {
            applicationOutcome: dat.decision?.toLowerCase(),
            version: (applications.docs[0].version || 1) + 1,
          },
        });
      }
    }

    // Update conversation status
    if (cid) {
      const conversations = await payload.find({
        collection: 'conversations',
        where: {
          conversationId: {
            equals: cid,
          },
        },
      });

      if (conversations.docs.length > 0) {
        const status = dat.decision === 'APPROVED' ? 'approved' : 'declined';
        await payload.update({
          collection: 'conversations',
          id: conversations.docs[0].id,
          data: {
            status,
            updatedAt: new Date(tsp),
          },
        });
      }
    }

    console.log(`Processed final decision: ${dat.decision} for application: ${aid}`);
  } catch (error) {
    console.error(`Error handling final decision for ${aid}:`, error);
    throw error;
  }
};

export const handleConversationSummary = async (payload: Payload, event: ChatLedgerEvent) => {
  const { cid, dat, tsp } = event;
  
  try {
    const conversations = await payload.find({
      collection: 'conversations',
      where: {
        conversationId: {
          equals: cid,
        },
      },
    });

    if (conversations.docs.length === 0) {
      console.error(`Conversation not found for summary: ${cid}`);
      return;
    }

    const facts = dat.conversation_facts?.map((fact: string) => ({ fact })) || [];

    await payload.update({
      collection: 'conversations',
      id: conversations.docs[0].id,
      data: {
        purpose: dat.conversation_purpose,
        facts,
        updatedAt: new Date(tsp),
      },
    });

    console.log(`Updated conversation summary for: ${cid}`);
  } catch (error) {
    console.error(`Error handling conversation summary for ${cid}:`, error);
    throw error;
  }
};
```

### 3. Projection Comparison

| Aspect | Supervisor Dashboard | Customer Portal | Analytics (Future) |
|--------|---------------------|-----------------|-------------------|
| **Purpose** | Real-time monitoring | Customer self-service | Business intelligence |
| **Schema** | Normalized (relational) | Denormalized (flat) | Aggregated (metrics) |
| **Updates** | Real-time via hooks | Near real-time batched | Batch processing |
| **Queries** | Complex joins | Simple lookups | Time-series analytics |
| **Volume** | Low | Medium-High | Low (aggregated) |
| **Technology** | Payload CMS + MongoDB | Custom API + PostgreSQL | ClickHouse/TimeSeries |
| **Access Pattern** | Admin dashboard | Customer app API | Reporting dashboards |

### 4. Event Structure and Data Mapping

#### 4.1 ChatLedger Event Schema

The chatLedger Redis stream contains events with the following structure:

```typescript
interface ChatLedgerEvent {
  agt: string;  // Agent name (usually 'broker')
  typ: string;  // Event type
  cid: string;  // Conversation ID
  aid?: string; // Application ID
  uid?: string; // Customer ID
  seq?: number; // Sequence number
  tsp: string;  // Timestamp (ISO format)
  dat?: any;    // Event data (JSON)
}
```

#### 4.2 Event Type Mappings

| Event Type | Source Model | Target Collection | Description |
|------------|--------------|-------------------|-------------|
| `conversation_started` | `chat.Utterance` | `conversations` | Creates new conversation record |
| **`user_input`** | **`chat.Utterance`** | **`conversations.utterances[]`** | **Adds customer message to conversation** |
| **`assistant_response`** | **`chat.LLMChatResponse`** | **`conversations.utterances[]`** | **Adds assistant message to conversation** |
| `applicationDetail_changed` | `application.ApplicationDetail` | `applications` + `customers` | Updates application and customer data |
| `identityRisk_assessment` | Custom | `applications.assessments.identityRisk` | Risk assessment results |
| `serviceability_assessment_results` | Custom | `applications.assessments.serviceability` | Serviceability results |
| `fraudCheck_results` | Custom | `applications.assessments.fraudCheck` | Fraud check results |
| `noticeboard_updated` | Custom | `applications.noticeboard[]` | Agent notes and updates |
| `final_decision` | Custom | `applications.applicationOutcome` + `conversations.status` | Final approval/decline |
| `conversation_summary` | `chat.ConversationSummary` | `conversations.purpose` + `conversations.facts[]` | Conversation analysis |

#### 4.2.1 Conversation Building Process

**Conversations are dynamically built through a sequence of events:**

1. **`conversation_started`** - Initializes the conversation record
2. **`user_input`** - Each customer message appends to `utterances[]` array
3. **`assistant_response`** - Each LLM response appends to `utterances[]` array
4. **`conversation_summary`** - Adds analysis when conversation concludes

This creates a real-time conversation thread that supervisors can monitor as it develops.

**Event Flow for Conversation Building:**
```
Customer Types Message
         ↓
    user_input event
         ↓
   Event Processor
         ↓  
 Add to utterances[]
         ↓
   Real-time Update
         ↓
 Supervisor Dashboard

LLM Generates Response  
         ↓
assistant_response event
         ↓
   Event Processor
         ↓
 Add to utterances[]
         ↓
   Real-time Update
         ↓
 Supervisor Dashboard
```

#### 4.3 Data Transformation Examples

**Customer Data Transformation (application.py → Customer Collection):**
```typescript
// From ApplicationDetail.customer
{
  customer_id: "cust_123",
  first_name: "John",
  last_name: "Doe",
  email_address: { value: "john@example.com" },
  residential_address: {
    street: "123 Main St",
    city: "Sydney",
    state: "NSW",
    postcode: "2000"
  }
}

// To Payload Customer
{
  customerId: "cust_123",
  firstName: "John",
  lastName: "Doe",
  fullName: "John Doe", // Generated in beforeChange hook
  emailAddress: "john@example.com",
  residentialAddress: {
    street: "123 Main St",
    city: "Sydney", 
    state: "NSW",
    postcode: "2000",
    country: "Australia"
  }
}
```

**Conversation Building Examples:**

**User Input Event (chat.Utterance → Conversation.utterances[]):**
```typescript
// From user_input event
{
  agt: "broker",
  typ: "user_input", 
  cid: "conv_123",
  tsp: "2024-01-15T10:30:00Z",
  dat: {
    conversation_id: "conv_123",
    utterance: "I need a loan for $5000",
    answer_input_type: "currency",
    additional_data: { amount: 5000 }
  }
}

// Appends to Payload Conversation.utterances[]
{
  username: "customer",
  utterance: "I need a loan for $5000",
  rationale: "",
  createdAt: new Date("2024-01-15T10:30:00Z"),
  answerInputType: "currency",
  additionalData: { amount: 5000 }
}
```

**Assistant Response Event (chat.LLMChatResponse → Conversation.utterances[]):**
```typescript
// From assistant_response event  
{
  agt: "broker",
  typ: "assistant_response",
  cid: "conv_123", 
  tsp: "2024-01-15T10:30:15Z",
  dat: {
    u: "I can help you with a $5000 loan. Let me gather some information...",
    r: "Customer requested loan amount, proceeding with application flow",
    a: "text",
    d: { next_step: "identity_verification" }
  }
}

// Appends to Payload Conversation.utterances[]
{
  username: "assistant",
  utterance: "I can help you with a $5000 loan. Let me gather some information...",
  rationale: "Customer requested loan amount, proceeding with application flow", 
  createdAt: new Date("2024-01-15T10:30:15Z"),
  answerInputType: "text",
  additionalData: { next_step: "identity_verification" }
}
```

**Resulting Conversation Thread:**
```typescript
// Final Conversation.utterances[] array shows full dialog
[
  {
    username: "customer",
    utterance: "I need a loan for $5000",
    createdAt: "2024-01-15T10:30:00Z",
    // ...
  },
  {
    username: "assistant", 
    utterance: "I can help you with a $5000 loan. Let me gather some information...",
    rationale: "Customer requested loan amount, proceeding with application flow",
    createdAt: "2024-01-15T10:30:15Z",
    // ...
  }
  // Additional utterances continue the conversation thread...
]
```

### 5. Custom Admin Panel Views

#### 5.1 Dashboard Layout Component

```typescript
// src/admin/components/DashboardLayout.tsx
import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from 'payload/components/utilities';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();

  if (!user || user.role !== 'supervisor') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <h1>Billie Supervisor Dashboard</h1>
        <nav>
          <button onClick={() => router.push('/admin/conversations')}>
            All Conversations
          </button>
          <button onClick={() => router.push('/admin/customers')}>
            Customers
          </button>
        </nav>
      </header>
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
};
```

#### 5.2 Real-time Conversations View

```typescript
// src/admin/components/ConversationsView.tsx
import React, { useEffect, useState } from 'react';
import { useFind } from 'payload/components/utilities';

export const ConversationsView: React.FC = () => {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(20);

  const { data, isLoading } = useFind({
    collection: 'conversations',
    limit: displayCount,
    sort: '-startTime',
    where: searchQuery ? {
      or: [
        {
          'applicationNumber': {
            contains: searchQuery,
          },
        },
        {
          'customer.fullName': {
            contains: searchQuery,
          },
        },
      ],
    } : undefined,
  });

  useEffect(() => {
    // Set up SSE connection for real-time updates
    const eventSource = new EventSource('/api/realtime');
    
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.collection === 'conversations') {
        // Update local state with new data
        setConversations(prev => {
          const index = prev.findIndex(c => c.id === update.doc.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = update.doc;
            return updated;
          } else {
            return [update.doc, ...prev];
          }
        });
      }
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="conversations-view">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="conversations-grid">
        {data?.docs?.map((conversation) => (
          <ConversationCard key={conversation.id} conversation={conversation} />
        ))}
      </div>
      
      {isLoading && <div className="loading">Loading...</div>}
    </div>
  );
};
```

### 6. API Routes for Real-time Data

#### 6.1 Server-Sent Events Endpoint

```typescript
// src/app/api/realtime/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '../../../payload.config';

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config });
  
  const response = new NextResponse(
    new ReadableStream({
      start(controller) {
        const clientId = Date.now();
        
        // Store client connection
        if (!payload.realTimeClients) {
          payload.realTimeClients = new Set();
        }
        
        const client = { id: clientId, controller };
        payload.realTimeClients.add(client);
        
        // Send initial data
        const initialData = JSON.stringify({
          type: 'connected',
          clientId,
        });
        
        controller.enqueue(`data: ${initialData}\n\n`);
        
        req.signal.addEventListener('abort', () => {
          payload.realTimeClients.delete(client);
        });
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
  
  return response;
}
```

#### 6.2 Search API Endpoints

```typescript
// src/app/api/conversations/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '../../../../payload.config';

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config });
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  
  const result = await payload.find({
    collection: 'conversations',
    where: query ? {
      or: [
        {
          'applicationNumber': {
            contains: query,
          },
        },
        {
          'customer.fullName': {
            contains: query,
          },
        },
      ],
    } : undefined,
    limit: 50,
    sort: '-startTime',
  });
  
  return NextResponse.json(result);
}
```

### 7. Payload Configuration Updates

#### 7.1 Enhanced Payload Config

```typescript
// src/payload.config.ts
import { buildConfig } from 'payload';
import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { payloadCloudPlugin } from '@payloadcms/payload-cloud';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

import { Users } from './collections/Users';
import { Conversations } from './collections/Conversations';
import { Customers } from './collections/Customers';
import { Applications } from './collections/Applications';
import { Media } from './collections/Media';
import { setupRealTimeSubscriptions } from './hooks/realTimeUpdates';
import { setupEventProcessing } from './workers/eventProcessor';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      // Custom admin components
      routes: [
        {
          path: '/dashboard',
          Component: () => import('./admin/components/DashboardLayout'),
        },
      ],
    },
  },
  collections: [Users, Conversations, Customers, Applications, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
  ],
  onInit: async (payload) => {
    // Set up real-time subscriptions
    setupRealTimeSubscriptions(payload);
    
    // Set up event processing
    if (process.env.ENABLE_EVENT_PROCESSING === 'true') {
      await setupEventProcessing(payload);
    }
  },
});
```

### 8. Environment Configuration

```env
# .env.local
PAYLOAD_SECRET=your-secret-key
DATABASE_URI=mongodb://localhost:27017/billie-crm
REDIS_URL=redis://localhost:6379
ENABLE_EVENT_PROCESSING=true
WORKER_ID=1
```

### 9. Resilience and Fault Tolerance

#### 9.1 Stream Processing Resilience

**Problem**: Ensuring message consumption is not committed until projections are successfully written, and handling pending messages on server restart.

**Solution**: Implement transactional processing with proper acknowledgment patterns:

```typescript
// src/workers/resilientEventProcessor.ts
import { Payload } from 'payload';
import Redis from 'ioredis';
import { ChatLedgerEvent } from './eventProcessor';

export class ResilientEventProcessor {
  private redis: Redis;
  private payload: Payload;
  private isProcessing: boolean = false;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // Base delay in ms

  constructor(payload: Payload) {
    this.payload = payload;
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async startProcessing() {
    const consumerGroup = 'payload-dashboard';
    const consumerId = `payload-worker-${process.env.WORKER_ID || '1'}-${Date.now()}`;
    const streamKey = 'chatLedger';

    // Create consumer group with error handling
    await this.ensureConsumerGroup(streamKey, consumerGroup);
    
    // Process pending messages first (from previous failed runs)
    await this.processPendingMessages(streamKey, consumerGroup, consumerId);
    
    // Start processing new messages
    this.isProcessing = true;
    await this.processNewMessages(streamKey, consumerGroup, consumerId);
  }

  private async ensureConsumerGroup(streamKey: string, consumerGroup: string) {
    try {
      await this.redis.xgroup('CREATE', streamKey, consumerGroup, '0', 'MKSTREAM');
      console.log(`Created consumer group: ${consumerGroup}`);
    } catch (error) {
      if (error.message.includes('BUSYGROUP')) {
        console.log(`Consumer group ${consumerGroup} already exists`);
      } else {
        throw error;
      }
    }
  }

  private async processPendingMessages(streamKey: string, consumerGroup: string, consumerId: string) {
    console.log('Processing pending messages from previous runs...');
    
    try {
      // Get pending messages for this consumer group
      const pendingResults = await this.redis.xreadgroup(
        'GROUP', consumerGroup, consumerId,
        'COUNT', 100,
        'STREAMS', streamKey, '0' // '0' gets pending messages
      );

      if (pendingResults && pendingResults.length > 0) {
        const [streamName, messages] = pendingResults[0];
        console.log(`Found ${messages.length} pending messages`);
        
        for (const [messageId, fields] of messages) {
          await this.processMessageWithTransaction(streamKey, consumerGroup, messageId, fields);
        }
      }
    } catch (error) {
      console.error('Error processing pending messages:', error);
      throw error;
    }
  }

  private async processNewMessages(streamKey: string, consumerGroup: string, consumerId: string) {
    while (this.isProcessing) {
      try {
        const results = await this.redis.xreadgroup(
          'GROUP', consumerGroup, consumerId,
          'COUNT', 10,
          'BLOCK', 1000,
          'STREAMS', streamKey, '>'
        );

        if (results && results.length > 0) {
          const [streamName, messages] = results[0];
          
          for (const [messageId, fields] of messages) {
            await this.processMessageWithTransaction(streamKey, consumerGroup, messageId, fields);
          }
        }
      } catch (error) {
        console.error('Error in message processing loop:', error);
        await this.sleep(5000); // Wait before retrying
      }
    }
  }

  private async processMessageWithTransaction(
    streamKey: string, 
    consumerGroup: string, 
    messageId: string, 
    fields: string[]
  ) {
    const event = this.parseEvent(fields);
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        // Process event across all projections in transaction-like manner
        await this.processEventWithConsistency(event, messageId);
        
        // Only acknowledge after successful processing of ALL projections
        await this.redis.xack(streamKey, consumerGroup, messageId);
        console.log(`Successfully processed and acknowledged message: ${messageId}`);
        return;
        
      } catch (error) {
        attempt++;
        console.error(`Attempt ${attempt} failed for message ${messageId}:`, error);
        
        if (attempt >= this.maxRetries) {
          // Move to dead letter queue after max retries
          await this.moveToDeadLetterQueue(event, messageId, error);
          await this.redis.xack(streamKey, consumerGroup, messageId);
          console.error(`Message ${messageId} moved to dead letter queue after ${this.maxRetries} attempts`);
          return;
        }
        
        // Exponential backoff
        await this.sleep(this.retryDelay * Math.pow(2, attempt - 1));
      }
    }
  }

  private async processEventWithConsistency(event: ChatLedgerEvent, messageId: string) {
    const processingId = `${messageId}-${Date.now()}`;
    
    // Track which projections we need to update
    const projectionUpdates: ProjectionUpdate[] = [];
    
    try {
      // 1. Determine which projections need updates
      if (this.shouldUpdateSupervisorProjection(event)) {
        projectionUpdates.push({
          name: 'supervisor',
          processor: () => this.updateSupervisorProjection(event),
          rollback: () => this.rollbackSupervisorProjection(event, processingId)
        });
      }
      
      if (this.shouldUpdateCustomerProjection(event)) {
        projectionUpdates.push({
          name: 'customer',
          processor: () => this.updateCustomerProjection(event),
          rollback: () => this.rollbackCustomerProjection(event, processingId)
        });
      }

      // 2. Execute all projection updates
      const results = await this.executeProjectionUpdates(projectionUpdates, processingId);
      
      // 3. If any failed, rollback all successful ones
      if (results.some(r => !r.success)) {
        await this.rollbackSuccessfulUpdates(results, projectionUpdates);
        throw new Error(`Projection consistency failure: ${results.filter(r => !r.success).map(r => r.error).join(', ')}`);
      }
      
      console.log(`Successfully updated ${results.length} projections for event ${event.typ}`);
      
    } catch (error) {
      console.error(`Error in consistent processing for event ${event.typ}:`, error);
      throw error;
    }
  }

  private async executeProjectionUpdates(
    updates: ProjectionUpdate[], 
    processingId: string
  ): Promise<ProjectionResult[]> {
    const results: ProjectionResult[] = [];
    
    // Execute updates sequentially to maintain consistency
    for (const update of updates) {
      try {
        await update.processor();
        results.push({
          name: update.name,
          success: true,
          processingId
        });
      } catch (error) {
        results.push({
          name: update.name,
          success: false,
          error: error.message,
          processingId
        });
        break; // Stop on first failure
      }
    }
    
    return results;
  }

  private async rollbackSuccessfulUpdates(
    results: ProjectionResult[], 
    updates: ProjectionUpdate[]
  ) {
    const successfulUpdates = results.filter(r => r.success);
    
    console.log(`Rolling back ${successfulUpdates.length} successful updates due to consistency failure`);
    
    // Rollback in reverse order
    for (const result of successfulUpdates.reverse()) {
      try {
        const update = updates.find(u => u.name === result.name);
        if (update?.rollback) {
          await update.rollback();
          console.log(`Rolled back ${result.name} projection`);
        }
      } catch (rollbackError) {
        console.error(`Error rolling back ${result.name} projection:`, rollbackError);
        // Log for manual intervention - this is a critical error
        await this.logCriticalError('rollback_failure', {
          projection: result.name,
          processingId: result.processingId,
          error: rollbackError.message
        });
      }
    }
  }

  private async moveToDeadLetterQueue(event: ChatLedgerEvent, messageId: string, error: any) {
    const deadLetterData = {
      originalMessageId: messageId,
      event,
      error: error.message,
      timestamp: new Date().toISOString(),
      retryCount: this.maxRetries
    };
    
    await this.redis.lpush('chatLedger:deadletter', JSON.stringify(deadLetterData));
    
    // Alert monitoring system
    await this.logCriticalError('dead_letter_queue', deadLetterData);
  }

  private async logCriticalError(type: string, data: any) {
    // Log to monitoring system (e.g., Sentry, CloudWatch, etc.)
    console.error(`CRITICAL ERROR [${type}]:`, data);
    
    // Store in Redis for manual review
    await this.redis.lpush(`errors:${type}`, JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    }));
  }

  private parseEvent(fields: string[]): ChatLedgerEvent {
    const event: any = {};
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      
      if (key === 'dat' && value) {
        try {
          event[key] = JSON.parse(value);
        } catch {
          event[key] = value;
        }
      } else {
        event[key] = value;
      }
    }
    return event as ChatLedgerEvent;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async gracefulShutdown() {
    console.log('Initiating graceful shutdown...');
    this.isProcessing = false;
    
    // Allow current processing to complete
    await this.sleep(2000);
    
    await this.redis.disconnect();
    console.log('Graceful shutdown completed');
  }
}

interface ProjectionUpdate {
  name: string;
  processor: () => Promise<void>;
  rollback: () => Promise<void>;
}

interface ProjectionResult {
  name: string;
  success: boolean;
  error?: string;
  processingId: string;
}
```

#### 9.2 Idempotency and Duplicate Protection

**Problem**: Ensuring that re-processing the same event doesn't cause inconsistent state.

**Solution**: Implement idempotent event handlers with deduplication:

```typescript
// src/workers/idempotentHandlers.ts
export class IdempotentEventHandlers {
  private redis: Redis;
  private payload: Payload;

  async handleApplicationDetailChanged(event: ChatLedgerEvent, processingId: string) {
    const deduplicationKey = `processed:${event.aid}:${event.typ}:${event.tsp}`;
    
    // Check if we've already processed this exact event
    const alreadyProcessed = await this.redis.get(deduplicationKey);
    if (alreadyProcessed) {
      console.log(`Event already processed: ${deduplicationKey}`);
      return;
    }

    // Start transaction
    const multi = this.redis.multi();
    
    try {
      // Process the event
      const applicationData = this.buildApplicationData(event);
      
      // Use upsert with version checking to prevent conflicts
      const existingApp = await this.payload.find({
        collection: 'applications',
        where: { applicationNumber: { equals: event.aid } }
      });

      if (existingApp.docs.length > 0) {
        const existing = existingApp.docs[0];
        
        // Only update if our event is newer (based on version or timestamp)
        if (this.isEventNewer(event, existing)) {
          await this.payload.update({
            collection: 'applications',
            id: existing.id,
            data: {
              ...applicationData,
              version: (existing.version || 0) + 1,
              lastProcessedEvent: event.tsp
            }
          });
        }
      } else {
        await this.payload.create({
          collection: 'applications',
          data: {
            ...applicationData,
            version: 1,
            lastProcessedEvent: event.tsp
          }
        });
      }

      // Mark as processed with TTL (keep for 24 hours)
      multi.setex(deduplicationKey, 86400, processingId);
      await multi.exec();
      
    } catch (error) {
      console.error(`Error in idempotent handler:`, error);
      throw error;
    }
  }

  private isEventNewer(event: ChatLedgerEvent, existing: any): boolean {
    // Compare timestamps or version numbers
    const eventTime = new Date(event.tsp).getTime();
    const existingTime = existing.lastProcessedEvent 
      ? new Date(existing.lastProcessedEvent).getTime() 
      : 0;
    
    return eventTime > existingTime;
  }
}
```

#### 9.3 Circuit Breaker Pattern

**Problem**: Prevent cascading failures when downstream services are unavailable.

**Solution**: Implement circuit breakers for projection updates:

```typescript
// src/resilience/circuitBreaker.ts
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly failureThreshold = 5,
    private readonly resetTimeout = 60000, // 1 minute
    private readonly name = 'default'
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log(`Circuit breaker [${this.name}] moving to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker [${this.name}] is OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log(`Circuit breaker [${this.name}] opened after ${this.failures} failures`);
    }
  }
}

// Usage in projection processors
export class ResilientProjectionProcessor {
  private supervisorCircuitBreaker = new CircuitBreaker(5, 60000, 'supervisor-projection');
  private customerCircuitBreaker = new CircuitBreaker(5, 60000, 'customer-projection');

  async updateSupervisorProjection(event: ChatLedgerEvent) {
    return await this.supervisorCircuitBreaker.execute(async () => {
      // Actual supervisor projection update logic
      await this.doSupervisorUpdate(event);
    });
  }

  async updateCustomerProjection(event: ChatLedgerEvent) {
    return await this.customerCircuitBreaker.execute(async () => {
      // Actual customer projection update logic  
      await this.doCustomerUpdate(event);
    });
  }
}
```

#### 9.4 Health Checks and Monitoring

```typescript
// src/monitoring/healthCheck.ts
export class SystemHealthCheck {
  private redis: Redis;
  private payload: Payload;

  async checkHealth(): Promise<HealthStatus> {
    const checks: HealthCheck[] = [
      { name: 'redis', check: () => this.checkRedis() },
      { name: 'mongodb', check: () => this.checkMongoDB() },
      { name: 'event_processing', check: () => this.checkEventProcessing() },
      { name: 'projections_sync', check: () => this.checkProjectionSync() }
    ];

    const results = await Promise.allSettled(
      checks.map(async check => ({
        name: check.name,
        status: await check.check(),
        timestamp: new Date().toISOString()
      }))
    );

    const healthStatus: HealthStatus = {
      overall: 'healthy',
      checks: results.map(result => 
        result.status === 'fulfilled' ? result.value : {
          name: 'unknown',
          status: 'unhealthy',
          error: result.reason,
          timestamp: new Date().toISOString()
        }
      )
    };

    // Determine overall health
    if (healthStatus.checks.some(check => check.status === 'unhealthy')) {
      healthStatus.overall = 'unhealthy';
    } else if (healthStatus.checks.some(check => check.status === 'degraded')) {
      healthStatus.overall = 'degraded';
    }

    return healthStatus;
  }

  private async checkRedis(): Promise<'healthy' | 'unhealthy' | 'degraded'> {
    try {
      await this.redis.ping();
      
      // Check stream processing lag
      const consumerInfo = await this.redis.xinfo('CONSUMERS', 'chatLedger', 'payload-dashboard');
      const lag = Math.max(...consumerInfo.map((consumer: any) => consumer.pending));
      
      if (lag > 1000) return 'degraded';
      return 'healthy';
    } catch {
      return 'unhealthy';
    }
  }

  private async checkProjectionSync(): Promise<'healthy' | 'unhealthy' | 'degraded'> {
    try {
      // Check if projections are in sync by comparing record counts
      const supervisorCount = await this.payload.count({ collection: 'applications' });
      const customerCount = await this.getCustomerProjectionCount();
      
      const syncDifference = Math.abs(supervisorCount.totalDocs - customerCount);
      
      if (syncDifference > 10) return 'degraded';
      return 'healthy';
    } catch {
      return 'unhealthy';
    }
  }
}

interface HealthStatus {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  checks: Array<{
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    error?: string;
    timestamp: string;
  }>;
}
```

#### 9.5 Event Replay and Recovery

```typescript
// src/recovery/eventReplay.ts
export class EventReplayService {
  private redis: Redis;

  async replayProjectionFromTimestamp(
    projectionName: string, 
    fromTimestamp: string,
    toTimestamp?: string
  ) {
    console.log(`Starting replay for ${projectionName} from ${fromTimestamp}`);
    
    const processor = this.getProjectionProcessor(projectionName);
    
    // Get events from Redis stream in time range
    const events = await this.getEventsInTimeRange(fromTimestamp, toTimestamp);
    
    for (const event of events) {
      try {
        await processor.handleEvent(event);
        console.log(`Replayed event ${event.typ} for ${projectionName}`);
      } catch (error) {
        console.error(`Error replaying event ${event.typ}:`, error);
        throw error;
      }
    }
    
    console.log(`Completed replay for ${projectionName}: ${events.length} events processed`);
  }

  async rebuildProjection(projectionName: string) {
    console.log(`Starting full rebuild for ${projectionName}`);
    
    // Clear existing projection data
    await this.clearProjection(projectionName);
    
    // Replay all events from beginning
    await this.replayProjectionFromTimestamp(projectionName, '0');
  }

  private async getEventsInTimeRange(from: string, to?: string): Promise<ChatLedgerEvent[]> {
    const events: ChatLedgerEvent[] = [];
    let cursor = from === '0' ? '0-0' : from;
    
    while (true) {
      const result = await this.redis.xread('COUNT', 1000, 'STREAMS', 'chatLedger', cursor);
      
      if (!result || result.length === 0) break;
      
      const [streamName, messages] = result[0];
      
      for (const [messageId, fields] of messages) {
        const event = this.parseEvent(fields);
        const eventTime = new Date(event.tsp);
        
        if (to && eventTime > new Date(to)) {
          return events;
        }
        
        events.push(event);
        cursor = messageId;
      }
      
      if (messages.length < 1000) break; // No more messages
    }
    
    return events;
  }
}
```

#### 9.6 Resilience Configuration

```typescript
// src/config/resilience.ts
export const ResilienceConfig = {
  eventProcessing: {
    maxRetries: 3,
    retryDelayMs: 1000,
    maxBatchSize: 10,
    processingTimeoutMs: 30000,
    deadLetterQueueEnabled: true
  },
  
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeoutMs: 60000,
    halfOpenMaxCalls: 3
  },
  
  idempotency: {
    deduplicationTtlSeconds: 86400, // 24 hours
    versionCheckEnabled: true
  },
  
  monitoring: {
    healthCheckIntervalMs: 30000,
    lagAlertThreshold: 1000,
    syncDifferenceThreshold: 10
  },
  
  recovery: {
    autoRecoveryEnabled: true,
    maxRecoveryAttempts: 3,
    recoveryDelayMs: 5000
  }
};
```

### 10. Dependencies to Add

```json
{
  "dependencies": {
    "ioredis": "^5.3.2",
    "@types/ioredis": "^5.0.0",
    "lodash": "^4.17.21",
    "@types/lodash": "^4.14.202"
  }
}
```

## Implementation Benefits

### 1. Native Payload CMS Advantages

- **Built-in Authentication**: Leverages Payload's auth system for supervisor login
- **Access Control**: Uses Payload's access control for role-based permissions
- **Admin Panel**: Customizes Payload's admin panel for dashboard views
- **Type Safety**: Full TypeScript support with generated types
- **Database Abstraction**: Uses Payload's database adapter for MongoDB
- **API Generation**: Automatic REST and GraphQL API generation

### 2. Event Sourcing Benefits

- **Audit Trail**: Complete history of all conversation events
- **Scalability**: Redis streams handle high-volume event processing
- **Resilience**: Consumer groups ensure no events are lost
- **Real-time Updates**: SSE provides instant UI updates
- **Data Consistency**: Single source of truth in MongoDB

### 3. Architecture Benefits

- **Separation of Concerns**: Clear separation between event processing and UI
- **Extensibility**: Easy to add new event types and handlers
- **Maintainability**: Well-structured code with clear responsibilities
- **Performance**: Efficient data loading and real-time updates
- **Security**: Role-based access control throughout the system

## Migration Strategy

### Phase 1: Foundation
1. Set up enhanced collections (Users, Conversations, Customers)
2. Implement basic authentication and access control
3. Create custom admin panel views

### Phase 2: Event Processing
1. Implement Redis stream consumer
2. Create event handlers for different event types
3. Set up real-time update system

### Phase 3: Advanced Features
1. Add search functionality
2. Implement infinite scrolling
3. Add customer profile management
4. Enhance real-time features

### Phase 4: Optimization
1. Performance tuning
2. Error handling improvements
3. Monitoring and logging
4. Security hardening

This architecture leverages Payload CMS v3's native capabilities while implementing the event sourcing pattern for real-time supervisor dashboard functionality. The approach provides a robust, scalable, and maintainable solution that follows Payload's best practices and design patterns. 