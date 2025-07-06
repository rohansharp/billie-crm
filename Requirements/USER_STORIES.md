# Billie Realtime Supervisor Dashboard - User Stories

This document outlines the user stories for the Billie Realtime Supervisor Dashboard application. The stories are intended to be detailed enough for an LLM agent to rebuild the application on a different platform.

---

## Epic: User Authentication

As a supervisor, I need a secure way to access the dashboard to ensure only authorized personnel can view sensitive customer conversation data.

**User Story 1.1: Supervisor Login**
- **As a** supervisor,
- **I want to** log in to the application using my credentials (email and password),
- **so that** I can access the conversation dashboard.

**Acceptance Criteria:**
- There should be a dedicated login page at the `/auth/login` route.
- The login form must have fields for email and password.
- The system must validate the credentials against a user database.
- Upon successful login, I should be redirected to the main dashboard (`/`).
- Upon failed login, an appropriate error message should be displayed on the login page.
- The user's session should be managed, keeping them logged in across browser sessions until they explicitly log out.

**Technical Notes:**
- Implemented using NextAuth.js with a Credentials provider.
- The `auth.ts` file contains the NextAuth configuration.
- A `LoginForm` client component handles the form submission.
- Middleware (`middleware.ts`) protects all routes except for the authentication pages, redirecting unauthenticated users to the login page.

**User Story 1.2: Supervisor Logout**
- **As a** supervisor,
- **I want to** be able to log out of the application,
- **so that** I can securely end my session.

**Acceptance Criteria:**
- A logout button should be clearly visible in the main application header.
- Clicking the logout button should terminate my session.
- After logging out, I should be redirected to the login page.

**Technical Notes:**
- Implemented using NextAuth.js `signOut` function.
- A `LogoutButton` client component handles the click event.

---

## Epic: All Conversations View

As a supervisor, I need a comprehensive overview of all ongoing and recent conversations so that I can monitor the workload and identify conversations that require attention.

**User Story 2.1: View All Conversations**
- **As a** supervisor,
- **I want to** see a grid of cards, each representing a single customer conversation,
- **so that** I can get a high-level overview of all activity.

**Acceptance Criteria:**
- The main page (`/`) should display the "All Conversations" view.
- Conversations should be displayed in a grid, with up to 3 cards per row on a standard widescreen monitor.
- The grid should be responsive to different screen sizes.
- The most recent conversations (by start time) must appear at the top.
- The initial set of conversations is loaded on the server when the page is first rendered.

**Technical Notes:**
- The root `page.tsx` is a Server Component that fetches the initial list of conversations from Redis.
- It passes this data to the `AllConversations.tsx` client component.
- The layout is managed by Tailwind CSS grid classes.

**User Story 2.2: Infinite Scrolling**
- **As a** supervisor,
- **I want** the list of conversations to load more cards automatically as I scroll down,
- **so that** I can view the entire history of conversations without needing to click through pagination pages.

**Acceptance Criteria:**
- When I scroll to the bottom of the visible conversation cards, the application should automatically load and display the next batch of cards.
- A loading indicator should be visible while the new cards are being loaded.
- This should continue until all conversations have been displayed.

**Technical Notes:**
- Implemented in `AllConversations.tsx` using the `IntersectionObserver` API to detect when the last visible card is scrolled into view.
- The component maintains a `displayCount` state to control how many conversations are rendered from the main list.

**User Story 2.3: Real-time Updates on All Conversations View**
- **As a** supervisor,
- **I want** the "All Conversations" view to update in real-time,
- **so that** I always have the most current information without needing to refresh the page.

**Acceptance Criteria:**
- New conversations should appear at the top of the grid automatically as they are started.
- The data on each conversation card (e.g., time since last utterance, status) should update in real-time as events for that conversation occur.

**Technical Notes:**
- This is driven by the real-time system (see Epic 4).
- The `AllConversations.tsx` component subscribes to a `zustand` store (`useConversationStore`).
- The store is updated by the SSE client, and any changes cause the component (and the `ConversationCard`s) to re-render with the new data.

**User Story 2.4: Conversation Card Summary**
- **As a** supervisor,
- **I want** each conversation card to display key summary information,
- **so that** I can quickly assess the status of each conversation.

**Acceptance Criteria:**
- Each card must display:
  - Customer's name.
  - Time since the conversation started (updating every few seconds).
  - Time since the last message was sent (updating every few seconds).
  - A status badge indicating if the conversation is "Paused", "Ended", "Approved", "Declined", etc.
  - The application number.
- Clicking on any part of the card should navigate me to the "Conversation Detail" view for that conversation.

**Technical Notes:**
- The `ConversationCard.tsx` component is responsible for rendering this information.
- It receives a `conversation` object as a prop and calculates the derived values (like time elapsed).
- It uses a `Link` component from Next.js to wrap the card for navigation.

**User Story 2.5: Search Conversations**
- **As a** supervisor,
- **I want to** be able to search for specific conversations,
- **so that** I can quickly find a conversation I'm looking for.

**Acceptance Criteria:**
- A search bar should be present on the "All Conversations" view.
- I should be able to search by:
    - Customer's first or last name.
    - Application number.
    - Final decision (e.g., "APPROVED").
    - Keywords within the conversation messages.
- The grid of conversations should filter in real-time as I type in the search bar.
- The search input should be debounced to avoid excessive re-rendering while typing.

**Technical Notes:**
- Implemented in `AllConversations.tsx`.
- A `useState` hook holds the `searchQuery`.
- A `debounce` function from `lodash` is used to delay the search execution.
- A `useEffect` hook filters the `sortedConversations` array based on the `searchQuery`.

---

## Epic: Conversation Detail View

As a supervisor, I need to be able to drill down into a specific conversation to see the full transcript and all associated assessment data, so I can provide support or perform a quality review.

**User Story 3.1: View Conversation Details**
- **As a** supervisor,
- **I want to** view a detailed screen for a single conversation when I click on its card,
- **so that** I can analyze it thoroughly.

**Acceptance Criteria:**
- The detail view should have a unique URL, like `/conversation/[id]`.
- The view must be split into two main sections: a message transcript on the left and assessment data panels on the right.
- A header section must display key conversation details:
  - Customer name and avatar.
  - Application number.
  - Time since the conversation started.
  - Time since the last utterance.
  - A dynamic status badge (e.g., "Active", "Paused", "Soft End", "Hard End", "Approved", "Declined"). The rules are:
    - `> 3 minutes` since last utterance: "Paused"
    - `> 20 minutes` since last utterance: "Soft End"
    - `> 24 hours` since last utterance: "Hard End"
    - If `finalDecision` is present: "Approved" or "Declined"
- The view must update in real-time as new events for this conversation arrive.

**Technical Notes:**
- The `/conversation/[id]/page.tsx` route is a Server Component that pre-loads the initial conversation state.
- It passes this state to the `ConversationDetail.tsx` client component.
- The component subscribes to the `useConversationStore` to receive real-time updates.

**User Story 3.2: View Message Transcript**
- **As a** supervisor,
- **I want to** see the full transcript of the conversation in a classic chat interface,
- **so that** I can understand the interaction between the customer and the CST member.

**Acceptance Criteria:**
- The chat view should take up the left-hand side of the screen (approx. 60% of the width).
- Messages from the customer should appear in bubbles on the left.
- Messages from the CST/assistant should appear in bubbles on the right.
- The view should automatically scroll to the latest message as new messages arrive.
- Each message bubble should show the message text and a timestamp.

**Technical Notes:**
- Implemented within `ConversationDetail.tsx`.
- It maps over the `messages` array of the `conversation` object.
- The `MessageBubble.tsx` component renders individual messages, styled differently based on the `sender`.
- A `useRef` (`messagesEndRef`) is used to control the auto-scrolling behavior.

**User Story 3.3: View Assessment Data**
- **As a** supervisor,
- **I want to** see all the collected assessment data related to the conversation,
- **so that** I have a complete picture of the customer's application and risk profile.

**Acceptance Criteria:**
- The assessment data view should take up the right-hand side of the screen (approx. 40% of the width).
- The data should be organized into logical panels, grouped by category (e.g., "Application", "Identity", "Credit Assessment", "Statements", "Noticeboard").
- Each panel should have a clear title.
- The content of each panel should be a neatly formatted representation of the JSON data for that assessment.
- The panels and their data must update in real-time as new assessment events arrive.

**Technical Notes:**
- The data for the assessment panels originates from specific events processed by the backend worker.
- Events like `identityRisk_assessment`, `serviceability_assessment_results`, and `final_decision` carry JSON payloads with assessment outcomes.
- The worker process receives these events, updates the master conversation state in the persistent data store (under the `assessments` key), and then publishes the event to the real-time channel.
- The client receives the event and updates its local state management store.
- The `ConversationDetail.tsx` component reacts to this store update. It contains a predefined mapping of assessment `types` to human-readable `categories` (e.g., the `identity_risk` assessment type is grouped under the "Identity" category).
- The component iterates through these categories and renders an `AssessmentPanel.tsx` for each piece of assessment data found in the `conversation.assessments` object, passing the relevant JSON data as a prop.
- The `AssessmentPanel` is a generic component responsible for formatting and displaying the raw JSON data in a readable way.
- The "Noticeboard" is handled specially. It's populated by `noticeboard_updated` events, and the component iterates over the `conversation.noticeboard` object to display these free-form notes.

**User Story 3.4: View Structured Agent Notes (Noticeboard)**
- **As a** supervisor,
- **I want to** see special, structured notes posted by various automated agents in a dedicated "Noticeboard" section,
- **so that** I can track key automated events and observations that aren't part of the main chat dialogue.

**Acceptance Criteria:**
- Noticeboard posts must appear in their own "Noticeboard" category in the right-hand panel of the conversation detail view.
- Each unique noticeboard topic (e.g., "Serviceability Assessment", "Fraud Check") should be displayed in its own dedicated panel.
- The panel's title should reflect the topic of the note.
- The panel should display the content of the most recent post for that topic.
- The system must maintain a version history for each topic. When a new post for an existing topic is received, the previous post for that topic must be archived within the data structure.
- The UI should clearly distinguish these noticeboard panels from regular assessment panels.

**Technical Notes:**
- This functionality is driven by a `noticeboard_updated` event.
- The event's payload contains the post content and an `agentName` which is a composite key (e.g., `serviceability_agent::Serviceability Assessment Complete`). The part after the `::` is used as the topic/title.
- On the backend, the `worker.ts` script adds the post content to the `conversation.noticeboard` object using the `agentName` as the key.
- On the frontend, the `useConversationStore` contains special logic in its `updateNoticeboard` function. When a new post for an existing topic arrives, this function moves the previous post into a `versions` array within the new post's data structure. This creates an auditable history.
- The `ConversationDetail.tsx` component iterates over the `conversation.noticeboard` object, extracts the title from the key, and renders a distinct `AssessmentPanel` for each noticeboard entry, passing a flag (`isNoticeboard=true`) to style it appropriately. While the data structure supports viewing historical versions, the current UI only displays the latest post.

---

## Epic: Real-time System & Backend

As a system, I need a robust, scalable, real-time pipeline to process events and update all connected supervisor dashboards, so that the information presented is always up-to-date.

**User Story 4.1: Process Raw Chat Events**
- **As the** system,
- **I need to** consume events from a central event ledger,
- **so that** I can process every interaction that occurs.

**Acceptance Criteria:**
- A long-running worker process must be established on the server.
- The worker must connect to a Redis Stream named `chatLedger`.
- It must use a consumer group (e.g., `supervisor-dashboard`) to ensure resilient and scalable event processing.
- The worker must filter events, only processing those with a top-level `agt` (agent) value of `broker`. All other events must be ignored.
- The worker must handle starting up and processing any messages that were missed while it was offline.

**Technical Notes:**
- Implemented in `src/server/worker.ts`.
- It uses the `redis` npm package.
- It uses `XREADGROUP` to consume messages from the stream.
- The `run()` function in the worker contains the main processing loop.

**User Story 4.2: Maintain Persistent Conversation State**
- **As the** system,
- **I need to** build and maintain a persistent, authoritative state for each conversation,
- **so that** there is a single source of truth that can be used to populate client views.

**Acceptance Criteria:**
- For each event processed, the worker must update a master state object for that conversation.
- This conversation state object must be stored persistently in a persistent data store.
- The worker must retrieve the current state, apply the changes from the new event, and save it back.
- If no state exists for a conversation ID, a new one must be created.
- The state object should include the full message history, all assessment data, customer details, etc.

**Technical Notes:**
- The `updateConversationState` function in `worker.ts` is responsible for this logic.
- The `redis-client.ts` file provides helper functions (`getConversationState`, `setConversationState`) that encapsulate the Redis commands (`GET`, `SET`).
- The conversation state is stored in a key like `conversation:[id]`.

**User Story 4.3: Push Updates to Clients**
- **As the** system,
- **I need to** push processed events to all connected web clients in real-time,
- **so that** their UIs can update.

**Acceptance Criteria:**

- When a client connects to this endpoint, it should first receive the full, current state of all conversations.

---

#### Event Processing Details

The worker's primary role is to translate a raw, ordered stream of events from the `chatLedger` into a structured, persistent state for each conversation. Different event types (`typ`) trigger different state mutations. Below is a functional description of how key events are handled:

-   **`conversation_started`**: This event signifies the beginning of a new conversation. The worker creates a new conversation state object in the persistent store, setting the `id`, `status` to 'active', and `startTime`. It may also include an initial `applicationNumber`.

-   **`user_input` & `assistant_response`**: These events represent the core dialogue. The worker appends a new message object to the `messages` array in the conversation state. It includes the sender (`customer` or `assistant`), the text (`utterance`), and the timestamp. The `lastUtteranceTime` for the conversation is also updated.

-   **`applicationDetail_changed`**: This is a crucial event for populating customer and application data. Its payload can contain various fields (e.g., `loanAmount`, `loanPurpose`, `customer.first_name`). The worker merges this payload with the existing `application` and `customer` objects within the conversation state, ensuring a complete and up-to-date record.

-   **Assessment Events (e.g., `identityRisk_assessment`, `serviceability_assessment_results`)**: These events represent the outcomes of various backend assessment processes. Each event type corresponds to a key within the `assessments` object in the conversation state. The worker takes the payload of the event and saves it under the corresponding key (e.g., the payload for `identityRisk_assessment` is saved to `conversation.assessments.identity_risk`).

-   **`noticeboard_updated`**: This event allows different automated agents to post structured notes. The worker adds or updates an entry in the `noticeboard` object within the conversation state. The noticeboard is a key-value store where the key is the name of the agent posting the note.

-   **`final_decision`**: This event marks a critical milestone. The worker updates the `finalDecision` field in the conversation state with the outcome (e.g., "APPROVED", "DECLINED") and may also change the conversation's overall `status`.

This event-driven state management ensures that the persistent record for each conversation is always a complete, aggregated reflection of all events that have occurred for it.

---

## Epic: Customer Data Management

As a supervisor, I want to have a centralized and searchable repository of customer information, so that I can easily look up customer details and view their history independently of a single conversation.

**User Story 5.1: Create and Update Customer Profiles from Events**
- **As the** system,
- **I need to** identify customer data within `applicationDetail_changed` events and use it to build and maintain a separate, persistent customer profile,
- **so that** a consolidated view of each customer is always available.

**Acceptance Criteria:**
- When the worker processes an `applicationDetail_changed` event, it must check for a `customer` object in the payload.
- The `customer_id` from the payload must be used as the unique identifier for the customer profile.
- The system must retrieve the existing customer profile (if one exists) from the persistent data store.
- Because each event payload represents a delta (a partial update), the system must intelligently merge the fields from the event's `customer` payload into the stored customer profile.
- If no profile exists for the given `customer_id`, a new one must be created using the data from the event.
- The updated customer profile must be saved back to the persistent data store as a separate object (e.g., in a key like `customer:[customer_id]`).

**Technical Notes:**
- This logic should be implemented in the `worker.ts` script, specifically within the `switch` case for the `applicationDetail_changed` event type.
- A new function, for example `updateCustomerState(customerId, customerData)`, should be created to encapsulate the logic of fetching, merging, and saving the customer profile to the data store.
- The merging logic must be deep, capable of updating nested objects like `residential_address` without overwriting the entire object.

**User Story 5.2: View and Search for Customer Profiles**
- **As a** supervisor,
- **I want to** be able to search for customers and view their complete profile,
- **so that** I can quickly find a specific person and see all their details in one place.

**Acceptance Criteria:**
- A new area or page (e.g., "Customers") should be added to the application's navigation.
- This page must feature a search interface allowing me to search for customers by their name, email address, or customer ID.
- The system should display a list of customers matching the search criteria.
- Clicking on a customer from the search results should navigate to a dedicated customer profile page (e.g., `/customer/[customer_id]`).
- The customer profile page must display all the consolidated information for that customer, such as their full name, contact details, date of birth, and address.

**Technical Notes:**
- A new API endpoint (e.g., `/api/customers/search`) would be required to handle customer searches. This endpoint would query the persistent data store.
- Depending on the data store used, implementing efficient search on non-key fields might require creating secondary indexes. For a smaller dataset, filtering all customer records on the server might be acceptable.
- A new dynamic route, `src/app/customer/[id]/page.tsx`, would be needed for the customer profile view. This would be a Server Component that fetches the customer data from the store.
- New client components would be needed for the search interface and the display of the customer profile.

