# Data Models: Billie CRM Web

## Overview

The web application uses **Payload CMS** with **MongoDB** as the persistence layer. The data models serve two primary purposes:
1.  **Read Model (Projections)**: Storing data consumed from events (Customers, Loan Accounts, Conversations).
2.  **Write Model**: Storing application state (Users, Media, Applications).

## Collections

### 1. LoanAccounts (`loan-accounts`)
*Read-Only Projection* - Updated by Event Processor.

| Field | Type | Description |
|-------|------|-------------|
| `loanAccountId` | text | Unique Ledger ID (indexed, unique). |
| `accountNumber` | text | Human-readable account number (indexed). |
| `customerId` | relationship | Reference to `customers` collection. |
| `customerIdString` | text | String ID for fast lookups. |
| `accountStatus` | select | `active`, `paid_off`, `in_arrears`, `written_off`. |
| `loanTerms` | group | Snapshot of original terms (`loanAmount`, `loanFee`, `totalPayable`, `openedDate`). |
| `balances` | group | Current balances snapshot (`currentBalance`, `totalOutstanding`, `totalPaid`). |
| `lastPayment` | group | Last payment amount and date. |
| `repaymentSchedule` | group | Nested `payments[]` array with schedule status. |

### 2. Customers (`customers`)
*Read-Only Projection* - Updated by Event Processor.

| Field | Type | Description |
|-------|------|-------------|
| `customerId` | text | Unique Customer ID (indexed, unique). |
| `firstName`, `lastName` | text | Personal details. |
| `fullName` | text | Combined name for display. |
| `emailAddress` | email | Contact email. |
| `mobilePhoneNumber` | text | Contact phone. |
| `dateOfBirth` | date | DOB. |
| `residentialAddress` | group | Structured address fields. |
| `identityVerified` | checkbox | KYC status flag. |
| `ekycStatus` | select | `successful`, `failed`, `pending`. |

### 3. Conversations (`conversations`)
*Read-Only Projection* - Updated by Event Processor.

| Field | Type | Description |
|-------|------|-------------|
| `conversationId` | text | Unique Conversation ID. |
| `applicationNumber` | text | Linked application ref. |
| `status` | select | `active`, `paused`, `approved`, `declined`, etc. |
| `utterances` | array | Chat log (`username`, `utterance`, `rationale`, `timestamp`). |
| `assessments` | group | Nested JSON blobs for `identityRisk`, `serviceability`, `fraudCheck`. |
| `noticeboard` | array | Agent internal notes. |

### 4. Applications (`applications`)
*Application State*

| Field | Type | Description |
|-------|------|-------------|
| `applicationNumber` | text | Unique App ID. |
| `customerId` | relationship | Link to `customers`. |
| `loanAmount`, `loanPurpose` | number/text | Application details. |
| `applicationOutcome` | select | `pending`, `approved`, `declined`. |
| `applicationProcess` | group | State machine for the application workflow. Note: This supports a chat application where data is provided by backend agents via Redis streams. |

### 5. Users (`users`)
*System Access*

| Field | Type | Description |
|-------|------|-------------|
| `email` | email | Login username. |
| `role` | select | `admin`, `supervisor`, `operations`, `readonly`. |
| `firstName`, `lastName` | text | Staff details. |

## Relationships

-   **Customer -> LoanAccounts**: One-to-Many
-   **Customer -> Applications**: One-to-Many
-   **Customer -> Conversations**: One-to-Many
-   **Conversation -> Application**: Many-to-One (optional)

## Database Indexes

-   **Unique**: `loanAccountId`, `accountNumber`, `customerId`, `conversationId`, `applicationNumber`, `email`.
-   **Performance**: `customerIdString`, `accountStatus`.
