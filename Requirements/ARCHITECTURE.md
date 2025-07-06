# Billie Realtime Supervisor Dashboard - Architecture Document

## Overview

This document outlines the high-level architecture and detailed implementation approach for the Billie Realtime Supervisor Dashboard using Payload CMS v3. The architecture leverages Payload's native capabilities to the fullest extent while implementing event sourcing patterns with Redis streams.

## High-Level Architecture

### Core Components

1. **Payload CMS Collections** - Native data models for conversations, customers, and supervisors
2. **Payload Hooks** - Event-driven state management and real-time updates
3. **Payload Access Control** - Role-based permissions for supervisors
4. **Payload Admin Panel** - Custom dashboard views and real-time interfaces
5. **Redis Stream Processing** - Event sourcing and real-time data pipeline
6. **Next.js App Router** - Server-side rendering and API routes

### Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Redis Stream  │    │  Payload CMS    │    │  Next.js App    │
│   (chatLedger)  │───▶│   Collections   │───▶│   Router        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Stream Worker  │    │  Payload Hooks  │    │  Admin Panel    │
│  (Event Proc.)  │    │  (State Mgmt.)  │    │  (Dashboard)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  MongoDB Store  │    │  Real-time      │    │  Supervisor     │
│  (Persistent)   │    │  Updates        │    │  Interface      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Detailed Implementation Plan

### 1. Payload Collections Design

#### 1.1 Conversations Collection

```typescript
// src/collections/Conversations.ts
export const Conversations: CollectionConfig = {
  slug: 'conversations',
  admin: {
    useAsTitle: 'applicationNumber',
    defaultColumns: ['applicationNumber', 'customerName', 'status', 'startTime'],
    group: 'Supervisor Dashboard',
  },
  access: {
    read: ({ req: { user } }) => {
      return user?.role === 'supervisor';
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
    },
    {
      name: 'customerId',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: ['active', 'paused', 'soft_end', 'hard_end', 'approved', 'declined'],
      defaultValue: 'active',
    },
    {
      name: 'startTime',
      type: 'date',
      required: true,
    },
    {
      name: 'lastUtteranceTime',
      type: 'date',
    },
    {
      name: 'messages',
      type: 'array',
      fields: [
        {
          name: 'sender',
          type: 'select',
          options: ['customer', 'assistant'],
          required: true,
        },
        {
          name: 'utterance',
          type: 'textarea',
          required: true,
        },
        {
          name: 'timestamp',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'assessments',
      type: 'group',
      fields: [
        {
          name: 'identityRisk',
          type: 'json',
        },
        {
          name: 'serviceability',
          type: 'json',
        },
        {
          name: 'fraudCheck',
          type: 'json',
        },
      ],
    },
    {
      name: 'noticeboard',
      type: 'array',
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
      name: 'finalDecision',
      type: 'select',
      options: ['APPROVED', 'DECLINED'],
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        // Trigger real-time updates to connected clients
        await triggerRealTimeUpdate('conversation', doc);
      },
    ],
  },
};
```

#### 1.2 Customers Collection

```typescript
// src/collections/Customers.ts
export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'customerId'],
    group: 'Supervisor Dashboard',
  },
  access: {
    read: ({ req: { user } }) => {
      return user?.role === 'supervisor';
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
    },
    {
      name: 'fullName',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'dateOfBirth',
      type: 'date',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'residentialAddress',
      type: 'group',
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
      ],
    },
    {
      name: 'applications',
      type: 'relationship',
      relationTo: 'conversations',
      hasMany: true,
    },
  ],
};
```

#### 1.3 Enhanced Users Collection (Supervisors)

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

#### 2.2 Event Processing Hooks

```typescript
// src/hooks/eventProcessing.ts
import { Payload } from 'payload';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const setupEventProcessing = async (payload: Payload) => {
  const consumerGroup = 'payload-dashboard';
  const consumerId = 'payload-worker-1';
  const streamKey = 'chatLedger';

  // Create consumer group
  try {
    await redis.xgroup('CREATE', streamKey, consumerGroup, '0', 'MKSTREAM');
  } catch (error) {
    // Group might already exist
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
            
            if (event.agt === 'broker') {
              await processBrokerEvent(payload, event);
            }
            
            await redis.xack(streamKey, consumerGroup, messageId);
          } catch (error) {
            console.error(`Error processing message ${messageId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error consuming events:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

const processBrokerEvent = async (payload: Payload, event: any) => {
  switch (event.typ) {
    case 'conversation_started':
      await handleConversationStarted(payload, event);
      break;
    case 'user_input':
    case 'assistant_response':
      await handleMessageEvent(payload, event);
      break;
    case 'applicationDetail_changed':
      await handleApplicationDetailChanged(payload, event);
      break;
    case 'identityRisk_assessment':
    case 'serviceability_assessment_results':
      await handleAssessmentEvent(payload, event);
      break;
    case 'noticeboard_updated':
      await handleNoticeboardUpdate(payload, event);
      break;
    case 'final_decision':
      await handleFinalDecision(payload, event);
      break;
  }
};
```

### 3. Custom Admin Panel Views

#### 3.1 Dashboard Layout Component

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

#### 3.2 Real-time Conversations View

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

### 4. API Routes for Real-time Data

#### 4.1 Server-Sent Events Endpoint

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

#### 4.2 Search API Endpoints

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

### 5. Payload Configuration Updates

#### 5.1 Enhanced Payload Config

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
import { Media } from './collections/Media';
import { setupRealTimeSubscriptions } from './hooks/realTimeUpdates';
import { setupEventProcessing } from './hooks/eventProcessing';

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
  collections: [Users, Conversations, Customers, Media],
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

### 6. Environment Configuration

```env
# .env.local
PAYLOAD_SECRET=your-secret-key
DATABASE_URI=mongodb://localhost:27017/billie-crm
REDIS_URL=redis://localhost:6379
ENABLE_EVENT_PROCESSING=true
```

### 7. Dependencies to Add

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