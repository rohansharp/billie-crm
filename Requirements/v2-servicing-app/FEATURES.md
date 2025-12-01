# Billie Servicing App - Feature Specifications

## Feature Overview

This document defines the seven core features of the Billie Servicing App, organized by capability area.

---

## Feature 1: View Customer Loan Accounts

### Description
Staff can view all loan accounts for customers, showing current balances, account status, and key account details.

### Data Source
- **Events**: `account.created.v1`, `account.schedule.created.v1` from Redis inbox
- **SDK**: `billie_accounts_events` (AccountCreatedV1, AccountScheduleCreatedV1)
- **Storage**: `LoanAccounts` Payload CMS collection (local projection)

### User Stories

**F1.1: View Account List**
- As a staff member, I want to see a list of all loan accounts, so I can quickly find and access any account.
- Acceptance Criteria:
  - Display accounts in a sortable, filterable table
  - Show: Account Number, Customer Name, Principal Balance, Fee Balance, Total Outstanding, Status, Created Date
  - Support pagination with 25/50/100 items per page
  - Real-time updates as new accounts are created

**F1.2: View Account Details**
- As a staff member, I want to view the full details of a loan account, so I can understand the account status and history.
- Acceptance Criteria:
  - Display all account fields from the ledger record
  - Show: Disbursed Principal, Establishment Fee, Total Repayable, Balances, Payment Progress
  - Link to associated customer profile
  - Link to view transactions (Feature 2)
  - Link to post transactions (Feature 3)

**F1.3: Account Status Display**
- As a staff member, I want to see clear account status indicators, so I can prioritize work appropriately.
- Acceptance Criteria:
  - Status badges: Active, Paid Off, In Arrears, Written Off
  - Color coding for quick visual identification
  - Days past due indicator for arrears accounts

**F1.4: View Repayment Schedule**
- As a staff member, I want to view the repayment schedule for a loan account, so I can see upcoming payment dates and amounts.
- Acceptance Criteria:
  - Display schedule created from `account.schedule.created.v1` event
  - Show: Schedule ID, Number of Payments, Payment Frequency
  - Display all scheduled payments with: Payment Number, Due Date, Amount, Status
  - Payment status: Scheduled, Paid, Missed, Partial
  - Highlight overdue payments
  - Show next upcoming payment prominently
- Data Source:
  - **Event**: `account.schedule.created.v1`
  - **SDK Model**: AccountScheduleCreatedV1 → ScheduledPayment[]

### Data Model: LoanAccount

```typescript
interface LoanAccount {
  // Core identifiers
  loanAccountId: string;      // Primary key (from SDK: account_id)
  accountNumber: string;      // Display identifier (from SDK: account_number)
  customerId: string;         // Relationship to Customer (from SDK: customer_id)
  
  // Loan terms (from SDK AccountCreatedV1)
  loanTerms: {
    loanAmount: number;       // From SDK: loan_amount
    loanFee: number;          // From SDK: loan_fee
    totalPayable: number;     // From SDK: loan_total_payable
    openedDate: Date;         // From SDK: opened_date
  };
  
  // Current state
  balances: {
    currentBalance: number;   // From SDK: current_balance
    totalOutstanding: number;
    totalPaid: number;
  };
  
  // Last payment (from account.updated.v1)
  lastPayment?: {
    date: Date;               // From SDK: last_payment_date
    amount: number;           // From SDK: last_payment_amount
  };
  
  // Status
  accountStatus: 'active' | 'paid_off' | 'in_arrears' | 'written_off';
  sdkStatus: string;          // Original SDK status (PENDING, ACTIVE, SUSPENDED, CLOSED)
  
  // Repayment Schedule (from account.schedule.created.v1)
  repaymentSchedule?: {
    scheduleId: string;                          // From SDK: schedule_id
    numberOfPayments: number;                    // From SDK: n_payments
    paymentFrequency: 'weekly' | 'fortnightly' | 'monthly'; // From SDK: payment_frequency
    payments: ScheduledPayment[];                // From SDK: payments[]
    createdDate: Date;                           // From SDK: created_date
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface ScheduledPayment {
  paymentNumber: number;      // From SDK: payment_number
  dueDate: Date;              // From SDK: due_date
  amount: number;             // From SDK: amount
  status: 'scheduled' | 'paid' | 'missed' | 'partial';
}
```

---

## Feature 2: View Account Transactions

### Description
Staff can view the full transaction history for any loan account, with real-time balance calculations.

### Data Source
- **API**: `AccountingLedgerService.GetTransactions` (gRPC)
- **API**: `AccountingLedgerService.GetBalance` (gRPC)
- **API**: `AccountingLedgerService.GetStatement` (gRPC)

### User Stories

**F2.1: View Transaction History**
- As a staff member, I want to see all transactions on an account, so I can understand the account activity.
- Acceptance Criteria:
  - Display transactions in reverse chronological order (newest first)
  - Show: Date, Type, Description, Principal Delta, Fee Delta, Running Balance
  - Filter by transaction type (disbursement, repayment, late fee, etc.)
  - Filter by date range
  - Pagination for large transaction histories

**F2.2: View Current Balance**
- As a staff member, I want to see the current account balance, so I can provide accurate information.
- Acceptance Criteria:
  - Display: Principal Balance, Fee Balance, Total Outstanding
  - Show "as of" timestamp
  - Refresh button to get latest balance

**F2.3: Generate Statement**
- As a staff member, I want to generate a statement for a period, so I can share with the customer or for records.
- Acceptance Criteria:
  - Select statement period (start and end date)
  - Display: Opening Balance, All Transactions, Fees Charged, Payments Received, Closing Balance
  - Export to PDF (future enhancement)

**F2.4: Watch Transactions (Real-time)**
- As a staff member, I want to see new transactions appear in real-time, so I have the latest information.
- Acceptance Criteria:
  - Use `WatchTransactions` streaming API
  - New transactions appear at top of list without refresh
  - Visual indicator for new transactions

### Transaction Type Reference

| Type | Description | Principal Effect | Fee Effect |
|------|-------------|------------------|------------|
| DISBURSEMENT | Initial loan disbursement | + | 0 |
| ESTABLISHMENT_FEE | Loan setup fee | 0 | + |
| REPAYMENT | Customer payment | - | - (fees first) |
| LATE_FEE | Missed payment fee | 0 | + |
| DISHONOUR_FEE | Failed payment fee | 0 | + |
| FEE_WAIVER | Staff-approved waiver | 0 | - |
| ADJUSTMENT | Manual correction | ± | ± |
| WRITE_OFF | Bad debt write off | - | - |

---

## Feature 3: Post Account Transactions

### Description
Staff can post transactions to loan accounts, including recording payments, applying fees, and making adjustments.

### Data Source
- **API**: `AccountingLedgerService` write operations (gRPC)

### User Stories

**F3.1: Record Repayment**
- As a staff member, I want to record a payment received, so the account balance is updated.
- Acceptance Criteria:
  - Enter: Payment Amount, Payment Reference, Payment Method
  - System shows allocation preview (fees first, then principal)
  - Display any overpayment amount
  - Confirmation before posting
  - Success message with new balance

**F3.2: Apply Late Fee**
- As a staff member, I want to apply a late fee to an account, so the customer is charged for missed payments.
- Acceptance Criteria:
  - Enter: Fee Amount, Days Past Due, Reason (optional)
  - Confirmation before posting
  - Audit trail of who applied the fee

**F3.3: Waive Fees**
- As a staff member, I want to waive fees on an account, so I can resolve customer complaints appropriately.
- Acceptance Criteria:
  - Enter: Waiver Amount, Reason (required), Approver (required)
  - Cannot waive more than current fee balance
  - Requires supervisor approval for amounts over threshold
  - Audit trail of waiver

**F3.4: Write Off Account**
- As a staff member, I want to write off an account balance, so bad debts are properly recorded.
- Acceptance Criteria:
  - Enter: Reason (required), Approver (required)
  - Writes off full remaining balance
  - Requires manager approval
  - Account status changes to "written_off"

**F3.5: Make Adjustment**
- As a staff member, I want to make a manual adjustment, so I can correct errors.
- Acceptance Criteria:
  - Enter: Principal Adjustment, Fee Adjustment, Reason (required), Approver (required)
  - Can increase or decrease balances
  - Requires supervisor approval
  - Clear audit trail

### Transaction Posting Forms

```typescript
// Form: Record Repayment
interface RecordRepaymentForm {
  loanAccountId: string;
  amount: number;           // Decimal, required
  paymentReference: string; // Required
  paymentMethod?: 'direct_debit' | 'card' | 'bank_transfer' | 'cash';
}

// Form: Apply Late Fee
interface ApplyLateFeeForm {
  loanAccountId: string;
  feeAmount: number;    // Decimal, required
  daysPastDue: number;  // Required
  reason?: string;
}

// Form: Waive Fee
interface WaiveFeeForm {
  loanAccountId: string;
  waiverAmount: number; // Decimal, required, <= fee balance
  reason: string;       // Required
  approvedBy: string;   // Staff ID, required
}

// Form: Write Off
interface WriteOffForm {
  loanAccountId: string;
  reason: string;     // Required
  approvedBy: string; // Staff ID, required
}

// Form: Make Adjustment
interface MakeAdjustmentForm {
  loanAccountId: string;
  principalDelta: number; // Can be negative
  feeDelta: number;       // Can be negative
  reason: string;         // Required
  approvedBy: string;     // Staff ID, required
}
```

---

## Feature 4: View Customer Conversations

### Description
Staff can view the full conversation history for customers, including chat transcripts from loan applications.

### Data Source
- **Event**: Chat events from Redis stream (existing implementation)
- **Storage**: `Conversations` Payload CMS collection

### User Stories

**F4.1: View Conversation List**
- As a staff member, I want to see all conversations for a customer, so I can understand their history with Billie.
- Acceptance Criteria:
  - Display conversations in reverse chronological order
  - Show: Application Number, Start Date, Status, Purpose, Message Count
  - Filter by status (active, ended, approved, declined)
  - Link to full conversation detail

**F4.2: View Conversation Detail**
- As a staff member, I want to read the full conversation transcript, so I can understand what was discussed.
- Acceptance Criteria:
  - Display all messages in chat format
  - Customer messages on left, assistant messages on right
  - Show timestamps for each message
  - Auto-scroll to latest message
  - Display conversation summary and key facts

**F4.3: View Assessment Data**
- As a staff member, I want to see the assessment data from a conversation, so I can understand decisions made.
- Acceptance Criteria:
  - Display assessment panels: Identity Risk, Serviceability, Fraud Check
  - Show noticeboard notes from agents
  - Display final decision with reasoning

### Conversation Status Rules

| Status | Condition |
|--------|-----------|
| Active | Last message < 3 minutes ago |
| Paused | Last message 3-20 minutes ago |
| Soft End | Last message 20 min - 24 hours ago |
| Hard End | Last message > 24 hours ago |
| Approved | Final decision = APPROVED |
| Declined | Final decision = DECLINED |

---

## Feature 5: View Customer Details

### Description
Staff can view and search for customer profiles with full contact and identity information.

### Data Source
- **Events**: `customer.changed.v1`, `customer.created.v1`, `customer.verified.v1` from Redis inbox
- **SDK**: `billie_customers_events` (CustomerChangedV1)
- **Storage**: `Customers` Payload CMS collection

### User Stories

**F5.1: View Customer Profile**
- As a staff member, I want to view a customer's full profile, so I can verify their identity and contact them.
- Acceptance Criteria:
  - Display: Full Name, Preferred Name, DOB, Contact Details
  - Display: Residential Address, Mailing Address
  - Display: Identity Documents (type, number, expiry)
  - Display: Special flags (staff, investor, founder)
  - Display: eKYC status and entity ID

**F5.2: Search Customers**
- As a staff member, I want to search for customers, so I can quickly find who I'm looking for.
- Acceptance Criteria:
  - Search by: Name, Email, Mobile, Customer ID
  - Display results in a list with key details
  - Click to navigate to full profile

**F5.3: View Customer Flags**
- As a staff member, I want to see special customer flags, so I handle them appropriately.
- Acceptance Criteria:
  - Display badges for: Staff, Investor, Founder
  - Visual distinction for special customers

### Customer Data Model

```typescript
interface Customer {
  // Core identifiers
  customerId: string;         // From SDK: customer_id
  
  // Name (from SDK CustomerChangedV1)
  firstName?: string;         // From SDK: first_name
  lastName?: string;          // From SDK: last_name
  fullName: string;           // Computed: firstName + lastName
  
  // Contact (from SDK)
  emailAddress?: string;      // From SDK: email_address
  mobilePhoneNumber?: string; // From SDK: mobile_phone_number
  
  // Personal (from SDK)
  dateOfBirth?: Date;         // From SDK: date_of_birth
  ekycStatus?: string;        // From SDK: ekyc_status
  identityVerified: boolean;  // Set true on customer.verified.v1
  
  // Address (from SDK residential_address)
  residentialAddress?: Address;
  
  // Flags
  staffFlag: boolean;
  investorFlag: boolean;
  founderFlag: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

interface Address {
  streetNumber?: string;      // From SDK: street_number
  streetName?: string;        // From SDK: street_name
  streetType?: string;        // From SDK: street_type
  unitNumber?: string;        // From SDK: unit_number
  suburb?: string;            // From SDK: suburb
  state?: string;             // From SDK: state
  postcode?: string;          // From SDK: postcode
  country: string;            // From SDK: country (default: 'Australia')
  fullAddress?: string;       // From SDK: full_address
}
```

---

## Feature 6: Single Customer View

### Description
A unified view that aggregates all information about a customer in one place.

### Data Sources
- Customer profile (local projection)
- Loan accounts (local projection)
- Account transactions (gRPC API)
- Conversations (local projection)

### User Stories

**F6.1: Unified Customer Dashboard**
- As a staff member, I want a single view of everything about a customer, so I can service them efficiently.
- Acceptance Criteria:
  - Header: Customer name, key identifiers, flags
  - Section 1: Customer Details (expandable)
  - Section 2: All Loan Accounts with current balances
  - Section 3: Recent Transactions across all accounts
  - Section 4: All Conversations with quick access

**F6.2: Quick Actions from Customer View**
- As a staff member, I want to take actions directly from the customer view, so I don't need to navigate away.
- Acceptance Criteria:
  - Button to record payment (opens modal)
  - Button to view full account details
  - Button to view full conversation
  - Button to view full transaction history

**F6.3: Customer Activity Timeline**
- As a staff member, I want to see a timeline of customer activity, so I understand their journey.
- Acceptance Criteria:
  - Combined timeline of: Account creation, Transactions, Conversations
  - Reverse chronological order
  - Filterable by activity type
  - Click to navigate to detailed view

### Single Customer View Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  CUSTOMER HEADER                                                 │
│  John Smith • CUS-12345 • john@email.com • 0412 345 678         │
│  [Staff] [Investor]                                              │
├─────────────────────────────────────────────────────────────────┤
│  TABS: [Details] [Accounts] [Transactions] [Conversations]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LOAN ACCOUNTS                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ACC-001 │ Active │ $450 outstanding │ [View] [Pay]      │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ACC-002 │ Paid   │ $0 outstanding   │ [View]            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  RECENT TRANSACTIONS                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 2024-01-15 │ Repayment │ ACC-001 │ -$50.00             │   │
│  │ 2024-01-10 │ Late Fee  │ ACC-001 │ +$10.00             │   │
│  │ 2024-01-01 │ Disburse  │ ACC-001 │ +$500.00            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  CONVERSATIONS                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ APP-123 │ Approved │ 15 Jan 2024 │ [View Transcript]    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature 7: Global Search

### Description
Staff can search across all entities (customers, accounts, transactions) from a single search interface.

### Data Sources
- Customers collection (local)
- LoanAccounts collection (local)
- Transactions via gRPC API

### User Stories

**F7.1: Unified Search Bar**
- As a staff member, I want a single search bar that searches everything, so I can quickly find what I need.
- Acceptance Criteria:
  - Global search bar in header (always visible)
  - Auto-detect search type based on input pattern
  - Display categorized results (Customers, Accounts, Transactions)

**F7.2: Search by Customer**
- As a staff member, I want to search for customers by name or contact details.
- Acceptance Criteria:
  - Search by: Full name, first name, last name
  - Search by: Email address, mobile number
  - Search by: Customer ID

**F7.3: Search by Account**
- As a staff member, I want to search for accounts by account number.
- Acceptance Criteria:
  - Search by: Account number (exact match)
  - Search by: Application number

**F7.4: Search by Transaction**
- As a staff member, I want to search for a specific transaction.
- Acceptance Criteria:
  - Search by: Transaction ID
  - Search by: Payment reference

### Search Input Pattern Detection

| Pattern | Search Type | Examples |
|---------|-------------|----------|
| CUS-* | Customer ID | CUS-12345 |
| ACC-* | Account Number | ACC-67890 |
| TXN-* | Transaction ID | TXN-11111 |
| Email format | Customer Email | john@email.com |
| Mobile format | Customer Mobile | 0412345678 |
| Default | Customer Name | John Smith |

### Search Results Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 Search: "john"                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CUSTOMERS (3 results)                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ John Smith • john.smith@email.com • CUS-12345            │   │
│  │ John Doe • john.doe@email.com • CUS-23456                │   │
│  │ Johnny Walker • johnny@email.com • CUS-34567             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ACCOUNTS (1 result)                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ACC-12345 • John Smith • $250.00 outstanding • Active    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TRANSACTIONS (0 results)                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature Priority Matrix

| Feature | Priority | Complexity | Dependencies |
|---------|----------|------------|--------------|
| F1: View Accounts + Schedules | High | Medium | Event processing, SDKs |
| F2: View Transactions | High | Medium | gRPC client |
| F3: Post Transactions | High | High | gRPC client, Auth |
| F4: View Conversations | Medium | Low | Existing implementation |
| F5: View Customers | High | Low | Event processing, SDKs |
| F6: Single Customer View | High | Medium | F1, F2, F4, F5 |
| F7: Global Search | Medium | Medium | F1, F5 |

## Billie Event SDK Requirements

| SDK Package | Events | Version |
|-------------|--------|---------|
| `billie_accounts_events` | account.created.v1, account.updated.v1, account.status_changed.v1, account.schedule.created.v1 | v2.2.0 |
| `billie_customers_events` | customer.changed.v1, customer.created.v1, customer.updated.v1, customer.verified.v1 | v2.0.0 |

## Implementation Order

**Phase 1: Foundation**
- F5: View Customer Details (extends existing)
- F1: View Loan Accounts (new projection)

**Phase 2: Ledger Integration**
- F2: View Transactions (gRPC read)
- F3: Post Transactions (gRPC write)

**Phase 3: Unified Experience**
- F6: Single Customer View
- F7: Global Search

**Phase 4: Enhancements**
- F4: View Conversations (already implemented, minor updates)
- Real-time transaction streaming
- Advanced search filters

