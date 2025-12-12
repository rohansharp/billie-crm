# Project Overview

## Executive Summary

**Billie CRM** is an internal servicing application for managing customers, loan accounts, and customer interactions (including contact notes, applications, and chat interactions). It is built as a hybrid system comprising a **Next.js + Payload CMS** web application for the staff UI and API, and a **Python Event Processor** for handling asynchronous events from the core banking system via Redis.

The system provides a Single Customer View, loan account management, transaction history, and customer communications visibility.

## Technical Stack

| Component | Technology | Version | Key Libraries |
|-----------|------------|---------|---------------|
| **Web / CMS** | TypeScript | 5.x | Next.js 15, Payload CMS 3.x, React 19 |
| **Backend Service** | Python | 3.12 | billie-event-sdks, motor, redis-py |
| **Database** | MongoDB | 7.0 | @payloadcms/db-mongodb |
| **Message Broker** | Redis | 7.0 | Streams (Inbox pattern) |
| **External API** | gRPC | - | @grpc/grpc-js |

## Architecture Type

**Multi-part Distributed System**
-   **Frontend/API:** Monolithic Next.js application hosting Payload CMS and API routes.
-   **Worker:** Standalone Python daemon for event processing.
-   **Integration:** Asynchronous communication via Redis Streams; Direct DB access (CQRS-lite pattern).

## Repository Structure

The project is structured as a **Multi-part** repository:

-   `src/` - **billie-crm-web**: The main web application and CMS.
-   `event-processor/` - **event-processor**: The backend event consumer service.

## Documentation Links

-   [Source Tree Analysis](./source-tree-analysis.md)
-   [Integration Architecture](./integration-architecture.md)
-   [Architecture - Web](./architecture-billie-crm-web.md)
-   [Architecture - Event Processor](./architecture-event-processor.md)
