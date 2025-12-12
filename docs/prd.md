---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
  - 9
  - 10
  - 11
inputDocuments:
  - docs/analysis/brainstorming-session-2025-12-11.md
  - docs/index.md
  - Requirements/v2-servicing-app/FEATURES.md
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 2
workflowType: 'prd'
lastStep: 11
project_name: 'billie-crm'
user_name: 'Rohan'
date: '2025-12-11'
---

# Product Requirements Document - billie-crm

**Author:** Rohan
**Date:** 2025-12-11

## Executive Summary

The **Billie CRM Servicing App Modernization** is a strategic initiative to empower support staff with a unified, high-performance interface for managing customer loan accounts. By evolving the existing Next.js/Payload CMS platform into a comprehensive servicing shell, the project aims to eliminate context switching and reduce average handle time (AHT) for common servicing tasks.

The system integrates disparate data sources—core banking ledger, customer identity profiles, and chat interactions—into a **Single Customer View**. This view operates on a **CQRS (Command Query Responsibility Segregation)** pattern: providing instant read access via local MongoDB projections populated by Redis streams (the Read Model), while ensuring financial integrity through direct gRPC commands to the Accounting Ledger Service for actions like repayments, fee waivers, and adjustments (the Write Model).

### What Makes This Special

Unlike traditional monolithic banking portals, Billie CRM decouples the user experience from the core ledger's performance constraints. It treats **"Servicing" as a distinct product experience**, prioritizing speed and visibility. The architecture enables real-time reactivity—where a payment posted in the UI updates the ledger, emits an event, and instantly refreshes the UI projection—creating a feedback loop that feels instantaneous to the user while maintaining strict auditability and separation of concerns.

## Project Classification

**Technical Type:** web_app
**Domain:** fintech
**Complexity:** high
**Project Context:** Brownfield - extending existing system

This project operates within a high-compliance fintech environment, requiring strict adherence to data accuracy, audit logging, and role-based access control (RBAC). It extends an existing multi-part distributed system comprising a Next.js web application and a Python event processor.

## Success Criteria

### User Success
*   **Zero Context Switching (Actions):** Staff can complete core loan servicing tasks (View Balance, Repay, Waive Fee) without navigating to the legacy ledger system. *(Note: Chat interactions remain in the legacy tool for MVP)*.
*   **Instant Visibility:** Transaction history and balances update in real-time (< 1s latency) after an action is taken.
*   **Operational Confidence:** Staff trust the displayed data matches the ledger without manual verification.

### Business Success
*   **Efficiency:** Measurable reduction in Average Handle Time (AHT) for standard loan inquiries.
*   **Adoption:** Full migration of support staff to the new shell for all non-chat servicing tasks.
*   **Compliance:** 100% audit trail coverage for all financial modifications (waivers, adjustments).

### Technical Success
*   **Data Integrity:** Event Processor guarantees eventual consistency with the ledger within 1 second.
*   **Reliability:** Read/Write model synchronization (CQRS) has zero unexplained drift.
*   **Performance:** UI actions render feedback in < 500ms.

## User Journeys

### Journey 1: Sarah - The One-Call Wonder (Primary User)
**Role:** Senior Support Specialist
**Goal:** Resolve a complex customer inquiry (balance check + fee waiver) in one call without switching tabs.

**Opening Scene:**
It's 4:55 PM. Sarah's heart rate spikes as John, a frustrated customer, yells about a "scam" late fee. In the legacy workflow, she's frantically alt-tabbing between a sluggish Ledger system (which is currently spinning) and the CRM. She has 5 tabs open, the data isn't matching up, and she feels the pressure of the Average Handle Time (AHT) clock ticking. She feels cluttered, blind, and anxious.

**Rising Action:**
Sarah opens the new **Billie Servicing App**. She types "John Sm..." into the **Global Search (F7)** bar. The system auto-suggests "John Smith (CUS-12345)" and she hits enter. She lands immediately on the **Single Customer View (F6)**. She doesn't need to ask for his account number; she sees his "Active" Personal Loan right there.

**Climax:**
She glances at the **Recent Transactions (F6/F2)** panel. She clearly sees the `REPAYMENT` came in at 9:00 AM on the 15th, but the `LATE_FEE` was triggered at 12:01 AM. She explains this to John, validating his frustration while explaining the system logic. She offers a one-time courtesy waiver. She clicks the "Waive Fee" button directly on the account card. A modal pops up, she enters "Courtesy Waiver - Payment same day", and clicks "Submit".

**Resolution:**
**Optimistic UI:** The interface doesn't wait for the server round-trip. It instantly updates the balance to $0.00, allowing Sarah to say, "I've taken care of that for you, John. Your balance is zero," without a pause. A subtle "Synced" checkmark appears moments later as the event persists. The call ends in 90 seconds. John is relieved, and Sarah leaves work feeling efficient and in control.

### Journey 2: Michael - The Frictionless Approver (Leadership)
**Role:** Service Team Lead
**Goal:** Review and approve a high-value debt write-off.

**Opening Scene:**
Michael is deep in a quarterly strategy document. In the past, approvals waited until he manually checked a spreadsheet or email inbox, causing delays. Today, a subtle **Toast Notification** slides onto his screen: *"New Approval Request: Write-Off ($2,500) - 2m ago"*.

**Rising Action:**
He clicks the notification and is deep-linked directly to the specific **Approval Context**. He sees the request details alongside the full **Account Context (F1)**. He toggles to the **Conversation History (F4)** tab and scans the transcript of the agent's chat with the customer, verifying the medical evidence provided 3 months ago.

**Climax:**
Satisfied, he checks the **Transaction History (F2)** to confirm no payments have been made in 90 days. He clicks "Approve Write-Off". The system prompts for a final confirmation: "This will permanently close the account." He confirms.

**Resolution:**
The account status flips to `WRITTEN_OFF`. An **Immutable Audit Log (F3)** entry is created, cryptographically linking his User ID to the decision. Michael returns to his strategy doc, having unblocked his team in under 60 seconds.

### Journey 3: Alex - The System Guardian (Power Admin)
**Role:** System Administrator
**Goal:** Fix a data inconsistency caused by a malformed payment event without breaking data integrity.

**Opening Scene:**
A ticket comes in: "Payment Ref P-998877 is missing from Customer Account ACC-555." The gateway logs show it was sent, but the customer balance hasn't updated. Alex suspects a data payload issue.

**Rising Action:**
Alex logs into the **Admin Console** and searches for `P-998877`. He finds the raw event in the `Dead Letter Queue (DLQ)` view. The status is `PROCESSED_WITH_ERROR`. The error log shows: *InvalidTimestampException: '2025-13-45'*. The gateway sent a bad date.

**Climax:**
Alex knows he cannot "edit" the database directly. He uses the **"Replay / Compensate" Tool**. He selects the failed event and chooses "Issue Correction Event". He inputs the correct effective date (verified from the bank file) and confirms.

**Resolution:**
The system generates a *new* event: `payment.correction.v1` which references the original transaction ID. The Event Processor consumes this valid event, posts the payment to the ledger, and updates the **Single Customer View**. The balance for ACC-555 updates. Alex marks the ticket "Resolved - Compensating Event Issued".

### Journey 4: Pri - The Risk Auditor (Compliance)
**Role:** Compliance & Risk Officer
**Goal:** Ensure staff aren't waiving fees for their friends or themselves.

**Opening Scene:**
It's "Audit Week". Pri needs to review all financial adjustments made in the last 30 days. She's looking for anomalies and potential internal fraud.

**Rising Action:**
She accesses the **Reporting / Audit View**. She filters for `Transaction Type: FEE_WAIVER` and `Date: Last 30 Days`. She sorts by "Amount".

**Climax:**
She spots a $50 waiver applied by "Sarah" for a customer flagged as **[Staff] (F5)**. This is a potential policy breach. She clicks into the **Customer Profile (F5)** to confirm the badge. She expands the **Event Metadata** panel. She isn't just looking at a text log; she's viewing the immutable `FeeWaivedV1` event payload, verifying the `approver_id` matches Sarah's user hash and the `reason` field matches the dropdown code.

**Resolution:**
She checks the previous transaction and sees it was indeed a double-charge error. The waiver was legitimate. She marks the audit item as "Verified". The visibility of the `STAFF` flag and the immutable event proof gives her total confidence in the assessment.

### Journey Requirements Summary
This journey mapping reveals the following core requirements:

*   **Global Search (F7):** Unified search for Customers, Accounts, and Transactions.
*   **Single Customer View (F6):** Aggregated dashboard of Profile, Accounts, and Transactions to reduce tab switching.
*   **Optimistic UI:** "Write" actions must reflect instantly in the UI to prevent user hesitation, handling eventual consistency in the background.
*   **Integrated Actions (F3):** Contextual buttons (Waive, Repay) within the view, not separate pages.
*   **Approvals & Notifications:** Real-time alerts for supervisors and a dedicated approval queue context.
*   **Compensating Actions:** Admin tools to fix data issues by issuing *new* events (corrections), not editing DB records.
*   **Immutable Audit:** UI visibility into the raw event data (Approver ID, Reason Codes) for compliance verification.
*   **Risk Indicators (F5):** Visual flags (Staff, Investor) that persist across views.

## Domain-Specific Requirements

### Fintech Compliance & Regulatory Overview
**Billie CRM** operates in the Australian fintech sector. While currently below the threshold for an Australian Financial Services License (AFSL), the system must be built with "Compliance-Ready" architecture to support future scaling. The immediate focus is on data privacy (Australian Privacy Principles) and operational security, avoiding direct handling of PCI data to minimize scope.

### Key Domain Concerns

*   **Regional Compliance (Australia):** Must adhere to Australian Privacy Principles (APP) regarding the collection, use, and disclosure of personal financial data.
*   **Security Standards:**
    *   **PCI-DSS Scope Reduction:** The system explicitly **excludes** capture or storage of raw credit card data (PAN/CVV). Any future payment integration must use tokenization or hosted fields.
    *   **Role-Based Access Control (RBAC):** Strict separation of duties between "Support" (Initiators) and "Approvers" (Supervisors) to prevent internal fraud.
*   **Audit Requirements:** "Compliance-Light" audit logging is sufficient for MVP, provided it captures *Who, What, When, and Why* for all financial mutations.
*   **Fraud Prevention:** Deferred to future phases. The system will rely on manual staff vigilance and basic ledger flags for now.

### Compliance Requirements

| Requirement | Implementation Strategy |
| :--- | :--- |
| **Data Privacy (APP)** | Personal Identifiable Information (PII) must be encrypted at rest. Support staff access to PII should be logged. |
| **Data Residency** | All customer data must remain hosted within Australian AWS/Cloud regions. |
| **Right to Erasure** | System must support "Soft Delete" or anonymization workflows for customers requesting data deletion (where not overridden by record-keeping laws). |

### Industry Standards & Best Practices

*   **Idempotency:** All financial write operations (Repayments, Waivers) must be idempotent to prevent double-charging on network retries.
*   **Event Sourcing Immutability:** The "ledger of truth" must never be rewritten. Corrections must be handled via compensating events (e.g., `PaymentReversedV1`), ensuring a complete, audit-proof history.
*   **Least Privilege:** Staff should only see data relevant to the active customer context.

### Required Expertise & Validation

*   **Domain Knowledge:** Developers must understand the distinction between "Authorization" (holding funds) and "Settlement" (moving funds), though currently simplified to "Posted" transactions.
*   **Validation:** All financial calculations (fees, interest) ideally occur in the Ledger (backend), not the frontend, to ensure precision and avoid JavaScript floating-point errors.

### Implementation Considerations

*   **Security Architecture:** API routes handling write actions (`/api/ledger/waive`) must implement strict server-side validation of the user's role and approval limits before dispatching gRPC commands.
*   **Audit_Requirements:** The `Immutable Audit Log` feature (Journey 2) effectively satisfies our current audit needs.
*   **Fraud_Prevention:** Placeholder hooks for future fraud checks should be considered in the event consumer design, even if unused in MVP.

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Reactive Financial Integrity (The "Optimistic Ledger" Pattern)**
*   **Concept:** Applying social-media-style "Optimistic UI" updates to financial write operations.
*   **Novelty:** Banking interfaces are traditionally "Pessimistic," blocking the user until the mainframe confirms. Billie CRM inverts this by treating the Local Read Projection as the immediate truth, creating a "zero-latency" feel for staff while managing eventual consistency in the background.
*   **Impact:** Shifts the emotional state of support staff from "waiting and anxious" to "fast and confident."

**2. Compliance-First UX (Visible Governance)**
*   **Concept:** Surfacing immutable event metadata (Approver ID, Reason Codes) directly in the UI as a first-class operational view, not just a hidden database log.
*   **Novelty:** Typical CRMs hide audit logs in separate "Admin" portals. Billie CRM integrates "Proof of Integrity" into the daily workflow (Journey 4), making compliance transparent and accessible.

**3. The "Decoupled Servicing Shell" Architecture**
*   **Concept:** Using a Headless CMS (Payload) not just for content, but as a "State Container" for a complex distributed system (Ledger + Chat + Identity).
*   **Novelty:** It treats the "Servicing Experience" as a distinct product separate from the "Core Banking System," allowing the UI to evolve faster than the underlying legacy rails.

### Market Context & Competitive Landscape
*   **Traditional Landscape:** Staff usually toggle between Salesforce (CRM), a Mainframe Terminal (Ledger), and Outlook (Approvals).
*   **Differentiation:** Billie CRM collapses these into a single "Command Center" view. Unlike generic CRM plugins, the deep Event Sourcing integration allows for "Time-Travel" debugging (Replay/Compensate tools) that standard CRMs cannot offer.

### Validation Approach
*   **Latency Perception Tests:** Measure "Perceived Latency" vs "Actual Latency." Success = Staff *feel* the action is instant, even if the ledger takes 800ms.
*   **Error Rate Monitoring:** Closely monitor the "Rejection Rate" of optimistic updates. If > 1%, the optimistic pattern may need to be dialed back to prevent "lying" to the user.

### Risk Mitigation
*   **The "Lying UI" Risk:** If the Optimistic UI says "Fee Waived" but the Ledger returns "Insufficient Privileges" 500ms later, the user trust is broken.
*   **Mitigation Strategy:** Implement a robust **"Compensating Feedback"** mechanism. If an optimistic update fails, the UI must aggressively notify the user (e.g., "Update Failed - Reverting Balance") and offer a clear retry path.

## Web App Specific Requirements

### Project-Type Overview
**Billie CRM** is a **Modern Web Application** built on the **Next.js App Router** framework. It functions as a "Servicing Shell," aggregating data from distributed backend systems into a cohesive frontend experience.

### Technical Architecture Considerations

*   **Rendering Strategy (Hybrid):**
    *   **Server Components (RSC):** Utilized for static shell elements (Navigation, Layouts) and initial data hydration to ensure fast First Contentful Paint (FCP).
    *   **Client Components:** Heavily utilized for interactive features (Forms, Transaction Lists) to enable **Optimistic UI** patterns and client-side cache mutation.
    *   **State Management:** React Query (or SWR) recommended for managing server state, caching, and background revalidation.

*   **Real-Time Data Strategy:**
    *   **Intelligent Polling:** Primary mechanism for data freshness. The application will revalidate data on window focus and post-mutation (e.g., after a fee waiver), with a fallback background poll (e.g., every 10s).
    *   **Optimistic Updates:** The UI must support "optimistic mutations"—immediately updating the local cache (e.g., setting Balance to $0.00) upon user action, then reconciling with the server response.

*   **Browser & Device Support:**
    *   **Target Browsers:** Latest 2 versions of Chrome, Safari, Edge, and Firefox.
    *   **Responsive Design:** Responsive layout required to support Desktop (primary) and Tablet/Mobile (secondary) viewports, enabling staff to work away from their desks.

### Implementation Considerations

*   **Error Handling:** Global Error Boundaries must be implemented to catch React rendering errors without crashing the entire shell.
*   **Performance Targets:**
    *   Time to Interactive (TTI): < 1.0s
    *   Route Transition: < 200ms
*   **Accessibility:** Baseline accessibility (keyboard navigation, semantic HTML) expected, though strict WCAG 2.1 compliance is not a mandatory gate for MVP.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** **Experience MVP**
This approach prioritizes a high-fidelity, high-speed user experience for the most frequent servicing tasks. It sacrifices breadth (Chat, complex reporting) to deliver a transformative "Zero Context Switching" experience for the core loop of Viewing and Acting on Loan Accounts.

**Resource Requirements:**
*   **Team:** 1 PM, 1 UX/UI Designer, 2 Full-Stack Engineers (Next.js + Python/Event integration).
*   **Timeline:** 6-8 Weeks (Phase 1).

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
1.  **Sarah (Support):** View Customer/Accounts, Post Repayment, Waive Fee.
2.  **Michael (Approver):** View Approvals, Approve/Reject Write-Off.
3.  **Alex (Admin):** Global Search, Replay Event (DLQ).
4.  **Pri (Compliance):** View Basic Audit Trail (Immutable Events).

**Must-Have Capabilities:**
*   **Single Customer View (F6):** Profile + Accounts + Transactions (Read-Only Projection).
*   **Global Search (F7):** Customer Name, ID, Account Number.
*   **Write Actions (F3):** Repay, Waive, Write-Off (with Optimistic UI).
*   **RBAC:** Separation of Support vs. Approver roles.
*   **Data Integrity:** Reliable Event -> Payload syncing.

### Post-MVP Features

**Phase 2 (Growth - +4 Weeks):**
*   **Integrated Chat (F4):** Streaming chat logs into the Single Customer View.
*   **Notification Center:** Real-time toast alerts for Michael (Approvals).
*   **Fraud Flags:** Displaying "Suspicious Velocity" warnings.

**Phase 3 (Expansion - +8 Weeks):**
*   **Mobile App:** Dedicated iOS/Android wrapper if tablet usage spikes.
*   **Advanced Reporting:** dedicated dashboard for Pri (Compliance).
*   **Customer Portal:** Exposing a subset of this view directly to end-users.

### Risk Mitigation Strategy

**Technical Risks:**
*   *Risk:* Optimistic UI creates confusion if the backend rejects the action.
*   *Mitigation:* "Compensating Feedback" UI—aggressively alerting the user and reverting the state if the optimistic update fails.

**Market Risks:**
*   *Risk:* Staff refuse to adopt the new tool because they trust the "Old Ledger" more.
*   *Mitigation:* Run both systems in parallel for 2 weeks. Show "Data Match" score on the new dashboard to prove it matches the ledger.

**Resource Risks:**
*   *Risk:* Integration with the Legacy Ledger is harder than expected.
*   *Mitigation:* Build the "Read Only" view first (Phase 1a). Even without "Write" buttons, a fast search interface provides 80% of the value.

## Functional Requirements

### Customer Intelligence (Search & View)
*   **FR1:** Staff can search for customers using **partial or exact matches** on Name, Email, Mobile Number, or Customer ID (minimum 3 characters).
*   **FR2:** Staff can search for loan accounts by Account Number or Application ID.
*   **FR3:** Staff can search for specific transactions by Payment Reference or Transaction ID.
*   **FR4:** Staff can view a "Single Customer View" dashboard aggregating Profile, Accounts, and recent Transactions.
*   **FR4.1:** Staff can filter the transaction history by Transaction Type (e.g., Fees, Repayments) and Date Range.
*   **FR5:** Staff can view the *latest known* balances (Principal, Interest, Fees, Total) for all active loan accounts.
*   **FR6:** Staff can view a chronological history of all financial transactions for a specific loan account.
*   **FR7:** Staff can view customer identity flags (e.g., "Staff", "Investor", "Vulnerable") clearly on the dashboard.

### Financial Operations (Write Actions)
*   **FR8:** Staff can initiate a "Waive Fee" action directly from the loan account view.
*   **FR9:** Staff can initiate a "Record Repayment" action (manual bank transfer entry) from the loan account view.
*   **FR10:** Staff can initiate a "Write-Off" request for an account balance, triggering an approval workflow.
*   **FR10.1:** Staff can **cancel** their own pending write-off requests before they are approved.
*   **FR11:** System must optimistically update the UI balance immediately upon action submission (before server confirmation).
*   **FR12:** System must revert the optimistic update and display an **actionable error toast with retry option** if the backend action fails.

### Governance & Audit (Compliance)
*   **FR13:** Approvers (Supervisors) can view a queue of pending "Write-Off" requests.
*   **FR13.1:** Approvers can sort/filter the approval queue by Date Requested, Amount, and Requestor.
*   **FR14:** Approvers can Approve or Reject a write-off request with a mandatory comment.
*   **FR15:** Compliance Officers can view an immutable audit log of all financial mutations (who, what, when, reason).
*   **FR15.1:** Audit logs and transaction histories must support **server-side pagination** to handle large datasets.
*   **FR16:** System must cryptographically link the Approver's identity to the approved transaction event.
*   **FR17:** Staff cannot approve their own requests (Segregation of Duties).
*   **FR17.1:** Staff can view their current approval limits and permissions directly in the UI.

### Notification & Workflow
*   **FR18:** Approvers receive a real-time notification (Toast) when a new request is assigned to their queue.
*   **FR19:** Staff receive a notification when their request is Approved or Rejected.
*   **FR22:** Staff can view the **sync status** (e.g., "Saving...", "Synced", "Failed") of any recent write action.
*   **FR23:** Failed actions must trigger a **persistent alert** in a global notification center that remains visible across page navigation.

### System Health & Resilience
*   **FR20:** Staff can view a "System Status" indicator showing the health/latency of the Event Processor connection.
*   **FR21:** The application automatically switches to **"Read-Only Mode"** if the connection to the Event Processor is lost, disabling write actions to prevent data drift.
*   **FR24:** System must detect **version conflicts** (e.g., modifying a stale account state) and prompt the user to refresh the data.

## Non-Functional Requirements

### Performance
*   **NFR1 (Responsiveness):** UI interactions (e.g., button clicks, tab switches) must respond in **< 100ms** (Optimistic UI) to perceived user action.
*   **NFR2 (Data Freshness):** Background data must refresh every **10 seconds** (Intelligent Polling), with immediate revalidation triggered upon any user write action.
*   **NFR3 (Load Time):** The Single Customer View must achieve First Contentful Paint (FCP) in **< 1.5 seconds**.

### Security
*   **NFR4 (Access Control):** All API routes must validate the user's role (Support vs. Approver) against the session token before executing any logic.
*   **NFR5 (Data Minimization):** The frontend must strictly type all API responses to ensure no "over-fetching" of sensitive fields (e.g., PII) not required for the view.
*   **NFR6 (Auditability):** All write actions must log the `actor_id`, `resource_id`, `action_type`, `timestamp`, and `reason` to the immutable event store.

### Reliability & Resilience
*   **NFR7 (Graceful Degradation):** In the event of a Ledger Service outage, the UI must enter "Read-Only Mode" (FR21) within **30 seconds** of detection.
*   **NFR8 (Error Recovery):** Optimistic UI failures must trigger a user-dismissible toast notification with a clear "Retry" action.

### Accessibility (Baseline)
*   **NFR9 (Keyboard Nav):** **Primary Actions** (Search, Forms, Main Buttons) must be keyboard accessible; secondary actions (sorting, filtering) are best-effort for MVP.
