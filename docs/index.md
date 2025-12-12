# Project Documentation Index

## Project Overview

-   **Type:** Multi-part Distributed System
-   **Primary Languages:** TypeScript, Python
-   **Architecture:** Event-Driven / Hybrid Monolith

### Quick Reference

#### Billie CRM Web (billie-crm-web)
-   **Type:** Web / CMS
-   **Tech Stack:** Next.js, Payload CMS
-   **Root:** `src/`

#### Event Processor (event-processor)
-   **Type:** Backend Worker
-   **Tech Stack:** Python, Redis, MongoDB
-   **Root:** `event-processor/`

### 🎯 Planning & Solutioning (BMAD Workflow)

-   [**Product Requirements (PRD)**](./prd.md) - User journeys, FRs, NFRs
-   [**UX Design Specification**](./ux-design-specification.md) - Design system, patterns, flows
-   [**Architecture Decision Document**](./architecture.md) - Technology decisions, patterns, structure
-   [**Project Context (AI Agents)**](./project_context.md) - Critical rules for implementation

### Generated Documentation

-   [Project Overview](./project-overview.md)
-   [Source Tree Analysis](./source-tree-analysis.md)
-   [Integration Architecture](./integration-architecture.md)

#### Part: Web App
-   [Architecture - Web](./architecture-billie-crm-web.md)
-   [API Contracts - Web](./api-contracts-billie-crm-web.md)
-   [Data Models - Web](./data-models-billie-crm-web.md)
-   [Component Inventory - Web](./component-inventory-billie-crm-web.md)
-   [Development Guide - Web](./development-guide-billie-crm-web.md)

#### Part: Event Processor
-   [Architecture - Event Processor](./architecture-event-processor.md)
-   [Development Guide - Event Processor](./development-guide-event-processor.md)

### Existing Documentation
-   [Brainstorming Session](./analysis/brainstorming-session-2025-12-11.md) - Initial project brainstorming
-   [Payload CMS Best Practices](../documents/payload-cms-ux-best-practices.md) - UX Guide

### Getting Started

**Web App:**
```bash
pnpm install
pnpm dev
```

**Event Processor:**
```bash
cd event-processor
pip install -r requirements.txt
python -m billie_servicing.main
```
